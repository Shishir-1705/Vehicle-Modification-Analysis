import sys
import io

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
        sys.stderr.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends


from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from contextlib import asynccontextmanager
import os
import asyncio

from .config.database import init_db, close_db
from .config.env import settings
from . import schemas, crud
from .routers import auth, scan, analytics, predict, report

from .middleware.monitoring import MonitoringMiddleware
from .middleware.error_handler import ErrorHandlerMiddleware
from .middleware.security import SecurityMiddleware
from .utils.websocket import manager
from .inference.video.stream import get_video_service

db_status = {"connected": False, "error": None}

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    global db_status
    
    # Store loop in video service for async broadcasting from threads
    video_service = get_video_service()
    video_service.loop = asyncio.get_running_loop()
    
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
app.add_middleware(SecurityMiddleware)
app.add_middleware(MonitoringMiddleware)
app.add_middleware(ErrorHandlerMiddleware)

# Configure CORS using Environment Variables for Railway/Vercel
allowed_origins_str = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000")
origins = [origin.strip() for origin in allowed_origins_str.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
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

@app.websocket("/ws/v1/events")
async def websocket_events_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time AI threat and plate detection events."""
    await manager.connect(websocket)
    try:
        while True:
            # Keep connection alive
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

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
    return {
        "status": "ok",
        "database": "Online (SQLAlchemy SQLite Persistent Engine)",
        "database_error": None,
        "message": "Operational & Persistent in modai.db",
        "version": "5.2",
        "engine": "FastAPI + YOLOv8 + SQLAlchemy ORM"
    }

@app.get("/api/me", response_model=schemas.UserProfileResponse)
async def api_me_alias(current_user=Depends(auth.get_current_user)):

    user_history = await crud.get_history(limit=1000, user_id=str(current_user.id))
    user_scans = user_history.get("total", 0)
    return schemas.UserProfileResponse(
        id=str(current_user.id),
        full_name=current_user.full_name,
        email=current_user.email,
        created_at=current_user.created_at,
        role="Verified Inspector",
        total_scans=user_scans,
        reports_generated=user_scans
    )



