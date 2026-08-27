import uuid
import os

# During real startup deployment, this bridges AWS Boto3
# For V4 mapping, we simulate Cloudinary/AWS CDN links

def upload_image_to_cloud(image_bytes: bytes, file_ext: str = "jpg") -> str:
    """
    Simulates Cloud Upload while persisting a local copy for the PDF Reporter.
    """
    unique_name = f"modai_scan_{uuid.uuid4().hex[:8]}.{file_ext}"
    
    # Ensure local directory exists for the reporter
    storage_root = os.getenv("AXION_STORAGE_DIR", ".")
    upload_dir = os.path.join(storage_root, "static", "uploads")
    if not os.path.exists(upload_dir):
        os.makedirs(upload_dir, exist_ok=True)

        
    local_path = os.path.join(upload_dir, unique_name)
    with open(local_path, "wb") as f:
        f.write(image_bytes)
        
    # During real startup deployment, this bridges AWS Boto3
    # For V4 mapping, we return a URL but the local file is now available for the reporter
    mock_s3_url = f"https://cdn.bikemodai.app/uploads/{unique_name}"
    
    return mock_s3_url
