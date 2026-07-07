import cv2
import threading
import time
from ultralytics import YOLO
import torch

class BikeRealTimeDetector:
    def __init__(self, model_path="yolov8n.pt", source=0):
        print("🚀 Initializing Optimized Live Detection...")
        
        # Load weights - try custom first, fallback to nano
        try:
            self.model = YOLO(model_path)
            print(f"✅ Loaded weights from: {model_path}")
        except Exception:
            print("⚠️ Custom weights not found. Using yolov8n.pt for structural testing.")
            self.model = YOLO("yolov8n.pt")

        self.cap = cv2.VideoCapture(source)
        self.frame = None
        self.processed_frame = None
        self.running = True
        self.lock = threading.Lock()

        # Config
        self.conf_threshold = 0.4
        self.img_size = 416  # Optimized for speed vs accuracy

    def capture_loop(self):
        """Thread 1: Constant frame capture to prevent buffer buildup"""
        while self.running:
            success, img = self.cap.read()
            if success:
                with self.lock:
                    self.frame = img
            else:
                time.sleep(0.01)

    def inference_loop(self):
        """Thread 2: AI Inference on latest available frame"""
        while self.running:
            if self.frame is not None:
                with self.lock:
                    current_frame = self.frame.copy()

                # Optimized Inference
                # 使用 track() 代替 predict() 可以获得跨帧跟踪，减少检测抖动
                results = self.model.track(
                    source=current_frame, 
                    conf=self.conf_threshold, 
                    persist=True,  # 启用持久化跟踪
                    imgsz=self.img_size, 
                    verbose=False
                )

                # Custom Rendering Logic (Can be extended for specific classes)
                # results[0].plot() is fast, but we could customize colors here if needed
                self.processed_frame = results[0].plot()
            else:
                time.sleep(0.01)

    def run(self):
        # Start Threads
        t1 = threading.Thread(target=self.capture_loop, daemon=True)
        t2 = threading.Thread(target=self.inference_loop, daemon=True)
        t1.start()
        t2.start()

        print("🔥 Real-Time Stream Active. Press 'q' to quit.")
        
        while self.running:
            if self.processed_frame is not None:
                cv2.imshow("Bike ModAI - Optimized Live Feed", self.processed_frame)
            
            if cv2.waitKey(1) & 0xFF == ord('q'):
                self.running = False
                break

        self.cap.release()
        cv2.destroyAllWindows()

if __name__ == "__main__":
    detector = BikeRealTimeDetector(model_path="../models/yolov8l-seg.pt")
    detector.run()
