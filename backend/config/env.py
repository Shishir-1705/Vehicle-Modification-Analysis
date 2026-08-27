import os

try:
    from pydantic_settings import BaseSettings
except ImportError:
    try:
        from pydantic import BaseSettings
    except ImportError:
        from pydantic.v1 import BaseSettings

class Settings(BaseSettings):
    """
    Centralized Configuration loader using Pydantic.
    """
    PROJECT_NAME: str = "Bike ModAI V4 API"
    VERSION: str = "4.1"
    DESCRIPTION: str = "Intelligent Vehicle Component Scanning Startup API Backend - ONNX Optimized"
    
    # Database
    MONGODB_URL: str = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    MONGODB_NAME: str = os.getenv("MONGODB_NAME", "vehicle_mod_ai")
    
    # Security Settings
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "b3d8756c2f9d869273c5df3f7a6b8c9d1e4f2a3b5c6d7e8f9a0b1c2d3e4f5a6b")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7 # 7 Days
    
    # Model Settings
    YOLO_MODEL_PATH: str = "models/yolov8n-seg.pt"


    class Config:
        env_file = ".env"

settings = Settings()
