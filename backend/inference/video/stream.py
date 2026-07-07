import cv2
import threading
import time
from datetime import datetime
from typing import Optional
import numpy as np
from ..yolo.engine import get_yolo_engine
from ..ocr.engine import get_ocr_engine

class VideoStreamStore:
    """
    Enterprise video stream service with RTSP/CCTV + webcam support.
    - Source can be: 0 (webcam), RTSP URL, video file path
    - Shares the global singleton YOLOEngine for zero-overhead model loading
    - Dual-threaded: capture loop + inference loop
    - Auto-reconnect on dropped RTSP connections
    """
    _instance = None
    _lock = threading.Lock()

    def __new__(cls, *args, **kwargs):
        with cls._lock:
            if cls._instance is None:
                cls._instance = super(VideoStreamStore, cls).__new__(cls)
                cls._instance._initialized = False
            return cls._instance

    def __init__(self, source=0):
        if self._initialized: return

        print("📹 Initializing Video Stream Service...")

        yolo_engine = get_yolo_engine()
        self.model = yolo_engine.model
        self.ocr_engine = None  # Lazy-loaded when first plate detected

        if self.model is None:
            print("⚠️ YOLO model unavailable. Inference disabled for video.")

        self.source = source
        self.cap: Optional[cv2.VideoCapture] = None
        self.raw_frame = None
        self.frame = None
        self.running = True
        self.is_active = False
        self.recent_events = []
        self.latest_plate: Optional[str] = None   # Last confirmed OCR plate
        self.plate_confidence: float = 0.0
        self._plate_cooldown = 0  # Frame counter for duplicate suppression
        self.lock = threading.Lock()

        self.frame = np.zeros((480, 640, 3), dtype=np.uint8)
        self._set_placeholder("CAMERA STANDBY — PRESS START")

        self.capture_thread = threading.Thread(target=self._capture_loop, daemon=True)
        self.inference_thread = threading.Thread(target=self._inference_loop, daemon=True)
        self.capture_thread.start()
        self.inference_thread.start()
        self._initialized = True

    def _set_placeholder(self, text: str):
        with self.lock:
            self.frame = np.zeros((480, 640, 3), dtype=np.uint8)
            cv2.putText(self.frame, text, (40, 240),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.75, (180, 180, 180), 2)

    def set_source(self, source) -> bool:
        """
        Dynamically change the camera source (webcam index, RTSP URL, video path).
        Call before start_session().
        Accepts:
          - 0, 1, 2...      → webcam index
          - "rtsp://..."    → RTSP CCTV stream
          - "/path/to.mp4"  → video file
        """
        was_active = self.is_active
        if was_active:
            self.stop_session()
        self.source = source
        print(f"📷 Source updated to: {source}")
        if was_active:
            return self.start_session()
        return True

    def start_session(self) -> bool:
        if self.is_active:
            return False
        print(f"🟢 Starting camera session (source: {self.source})")

        # Support RTSP URLs and local device indices
        if isinstance(self.source, str) and self.source.startswith("rtsp://"):
            # Optimized RTSP flags — reduce latency
            self.cap = cv2.VideoCapture(self.source, cv2.CAP_FFMPEG)
            self.cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
        else:
            self.cap = cv2.VideoCapture(self.source)
            self.cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)

        if self.cap.isOpened():
            self.is_active = True
            return True
        else:
            print(f"❌ Failed to open source: {self.source}")
            return False

    def stop_session(self) -> bool:
        if not self.is_active:
            return False
        print("🔴 Stopping camera session...")
        self.is_active = False
        self.raw_frame = None
        time.sleep(0.6)
        if self.cap:
            self.cap.release()
        self._set_placeholder("CAMERA OFF — SESSION TERMINATED")
        return True

    def session_status(self):
        return {
            "is_active": self.is_active,
            "source": str(self.source),
            "device_opened": self.cap.isOpened() if self.cap else False
        }

    def _capture_loop(self):
        """Thread 1: Continuous frame grab — keeps buffer fresh."""
        error_count = 0
        while self.running:
            if not self.is_active or self.cap is None:
                time.sleep(0.3)
                continue
            try:
                success, img = self.cap.read()
                if success:
                    with self.lock:
                        self.raw_frame = img
                    error_count = 0
                else:
                    error_count += 1
                    if error_count > 60:  # ~3s failure
                        print("⚠️ Stream lost. Attempting auto-reconnect...")
                        self.cap.release()
                        time.sleep(2)
                        self.cap = cv2.VideoCapture(self.source)
                        error_count = 0
                    time.sleep(0.05)
            except Exception as e:
                print(f"❌ Capture error: {e}")
                time.sleep(1)

    def _inference_loop(self):
        """Thread 2: YOLOv8 inference on latest frame."""
        while self.running:
            if not self.is_active:
                time.sleep(0.3)
                continue
            try:
                if self.raw_frame is not None and self.model is not None:
                    with self.lock:
                        frame = self.raw_frame.copy()

                    results = self.model.track(
                        source=frame, conf=0.4, imgsz=320,
                        half=True, persist=True, verbose=False
                    )

                    if results and results[0].boxes is not None and len(results[0].boxes) > 0:
                        plotted = results[0].plot(line_width=2)

                        for box in results[0].boxes:
                            cls_id = int(box.cls[0])
                            name = results[0].names[cls_id]
                            conf = float(box.conf[0])
                            severity = "critical" if "exhaust" in name.lower() else \
                                       "high" if "modified" in name.lower() else "medium"

                            # ── Plate OCR ──────────────────────────────────
                            if "plate" in name.lower() and self._plate_cooldown <= 0:
                                try:
                                    if self.ocr_engine is None:
                                        self.ocr_engine = get_ocr_engine()
                                    xyxy = box.xyxy[0].cpu().numpy()
                                    x1, y1, x2, y2 = int(xyxy[0]), int(xyxy[1]), int(xyxy[2]), int(xyxy[3])
                                    cx = (x1 + x2) // 2
                                    cy = (y1 + y2) // 2
                                    w  = x2 - x1
                                    h  = y2 - y1
                                    _, frame_jpg = cv2.imencode('.jpg', frame)
                                    plate_text = self.ocr_engine.extract_text(
                                        frame_jpg.tobytes(),
                                        {'x': cx, 'y': cy, 'w': w, 'h': h}
                                    )
                                    if plate_text and len(plate_text) >= 6:
                                        with self.lock:
                                            self.latest_plate = plate_text
                                            self.plate_confidence = conf
                                        self._plate_cooldown = 30  # suppress for 30 frames
                                        # Add to event log
                                        self.recent_events.append({
                                            "id": str(int(time.time() * 1000)),
                                            "type": "Plate Detected",
                                            "component": plate_text,
                                            "confidence": round(conf, 2),
                                            "timestamp": datetime.now().strftime("%H:%M:%S"),
                                            "severity": "low"
                                        })
                                except Exception as e:
                                    print(f"[OCR] Error: {e}")

                            self._plate_cooldown = max(0, self._plate_cooldown - 1)

                            event = {
                                "id": str(int(time.time() * 1000)),
                                "type": "Violation Detected",
                                "component": name.replace("_", " ").title(),
                                "confidence": round(conf, 2),
                                "timestamp": datetime.now().strftime("%H:%M:%S"),
                                "severity": severity
                            }
                            self.recent_events.append(event)
                            if len(self.recent_events) > 50:
                                self.recent_events.pop(0)

                        # Red border warning overlay
                        h, w = plotted.shape[:2]
                        cv2.rectangle(plotted, (0, 0), (w, h), (0, 0, 220), 8)
                        cv2.putText(plotted, "⚠ MODIFICATION DETECTED",
                                    (10, 36), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 0, 255), 2)

                        if self.is_active:
                            with self.lock:
                                self.frame = plotted
                    else:
                        if results:
                            plotted = results[0].plot(line_width=2)
                            if self.is_active:
                                with self.lock:
                                    self.frame = plotted
                else:
                    time.sleep(0.05)

            except Exception as e:
                print(f"❌ Inference error: {e}")
                time.sleep(1)

    def get_frame_bytes(self):
        """MJPEG generator for StreamingResponse."""
        while self.running:
            with self.lock:
                frame = self.frame.copy() if self.frame is not None else None
            if frame is not None:
                ret, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 80])
                if ret:
                    yield (b'--frame\r\n'
                           b'Content-Type: image/jpeg\r\n\r\n' + buffer.tobytes() + b'\r\n')
            time.sleep(0.016)  # ~60fps cap

    def stop(self):
        self.running = False
        if self.cap:
            self.cap.release()


_video_stream_service: Optional[VideoStreamStore] = None

def get_video_service() -> VideoStreamStore:
    global _video_stream_service
    if _video_stream_service is None:
        _video_stream_service = VideoStreamStore()
    return _video_stream_service
