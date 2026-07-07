import pytest
from backend.config.env import settings

def test_settings_loaded():
    """Test that default settings are loaded correctly via Pydantic."""
    assert settings.PROJECT_NAME == "Bike ModAI V4 API"
    assert settings.VERSION == "4.1"
    assert settings.ALGORITHM == "HS256"
    assert settings.YOLO_MODEL_PATH == "yolov8l-seg.pt"
