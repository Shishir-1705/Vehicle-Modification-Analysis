from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from contextlib import asynccontextmanager
from .config.database import init_db, close_db
from .config.env import settings
from .routers import auth, scan, analytics, predict, report
from .middleware.monitoring import MonitoringMiddleware
from .middleware.error_handler import ErrorHandlerMiddleware
from .inference.video.stream import get_video_service

db_status = {"connected": False, "error": None}

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    global db_status
    try:
        await init_db()
        db_status["connected"] = True
        print("✅ MONGODB CONNECTION ESTABLISHED SUCCESSFULLY via Beanie ODM")
    except Exception as e:
        db_status["connected"] = False
        db_status["error"] = str(e)
        print(f"❌ MONGODB CONNECTION FAILED: {e}")
        print("💡 API Server will continue running, but database features will be disabled.")
    yield
    # Shutdown
    if db_status["connected"]:
        await close_db()

# 2. Spin up FastAPI Gateway
app = FastAPI(
    title=settings.PROJECT_NAME, 
    description=settings.DESCRIPTION,
    version=settings.VERSION,
    lifespan=lifespan
)

# 3. Add Production Middleware
app.add_middleware(MonitoringMiddleware)
app.add_middleware(ErrorHandlerMiddleware)

# 3. Add Security Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:8000", "http://127.0.0.1:8000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 4. Integrate API Routes
app.include_router(auth.router, prefix="/api/v1")
app.include_router(scan.router, prefix="/api/v1")
app.include_router(analytics.router, prefix="/api/v1")
app.include_router(predict.router, prefix="/api/v1")
app.include_router(report.router, prefix="/api/v1")

@app.get("/api/v1/video_feed")
def video_feed():
    """Serves the real-time AI processed video stream."""
    video_service = get_video_service()
    return StreamingResponse(
        video_service.get_frame_bytes(), 
        media_type="multipart/x-mixed-replace; boundary=frame"
    )

@app.get("/api/v1/video/events")
def get_video_events():
    """Returns the most recent detection events from the live stream."""
    video_service = get_video_service()
    return video_service.recent_events

@app.post("/api/v1/video/start")
def start_video():
    """Activates the camera and AI processing."""
    video_service = get_video_service()
    if video_service.start_session():
        return {"status": "started", "message": "Camera and AI processing active."}
    return {"status": "already_running"}

@app.post("/api/v1/video/stop")
def stop_video():
    """Deactivates the camera and AI processing."""
    video_service = get_video_service()
    if video_service.stop_session():
        return {"status": "stopped", "message": "Camera and AI processing suspended."}
    return {"status": "already_stopped"}

@app.get("/api/v1/video/status")
def get_video_status():
    """Returns the current state of the video session."""
    video_service = get_video_service()
    return video_service.session_status()

@app.get("/api/v1/video/plate")
def get_latest_plate():
    """
    Returns the most recently OCR-detected plate number from the live stream.
    Frontend polls this every 2s to auto-fill the owner/vehicle form.
    """
    video_service = get_video_service()
    return {
        "plate": video_service.latest_plate,
        "confidence": video_service.plate_confidence,
    }

@app.post("/api/v1/video/source")
def set_video_source(source: str):
    """
    Change the video input source dynamically.
    Accepts:
      - "0", "1"          → webcam index
      - "rtsp://..."      → RTSP CCTV stream URL
      - "/path/to/video"  → local video file
    """
    video_service = get_video_service()
    # Convert numeric strings to ints for OpenCV
    parsed_source = int(source) if source.isdigit() else source
    success = video_service.set_source(parsed_source)
    return {
        "status": "source_updated" if success else "update_failed",
        "source": source
    }

@app.get("/health")
def health_check():
    global db_status
    return {
        "status": "ok", # keeps start script and checks happy
        "database": "Online" if db_status["connected"] else "Offline (Connection Failed)",
        "database_error": db_status["error"],
        "message": "Operational" if db_status["connected"] else "Running in Offline Mode",
        "version": "5.1",
        "engine": "FastAPI + YOLOv8 Real-Time Ready"
    }
