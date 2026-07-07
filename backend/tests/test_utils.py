import pytest
import os
from backend.utils.storage import upload_image_to_cloud
from backend.utils.logger import logger

def test_logger_initializes():
    """Test that the centralized logger configures correctly."""
    assert logger is not None
    assert logger.name == "bike_modai"
    assert logger.level == 20 # logging.INFO

def test_upload_image_to_cloud_mock():
    """Test that the mock cloud upload generates a valid URL and saves locally."""
    dummy_bytes = b"fake_image_data_for_testing"
    
    url = upload_image_to_cloud(dummy_bytes, "png")
    
    assert url.startswith("https://cdn.bikemodai.app/uploads/modai_scan_")
    assert url.endswith(".png")
    
    # Check if file was saved locally
    filename = url.split("/")[-1]
    local_path = os.path.join("static", "uploads", filename)
    assert os.path.exists(local_path)
    
    # Clean up test file
    os.remove(local_path)
