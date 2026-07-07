from beanie import Document, Link
from pydantic import Field
from typing import Optional, List, Dict, Any
from datetime import datetime

class User(Document):
    email: str
    hashed_password: str
    is_premium: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "users"

class RCData(Document):
    plate_number: str
    owner_masked: Optional[str] = None
    manufacturer: Optional[str] = None
    vehicle_model: Optional[str] = None
    fuel_type: Optional[str] = None
    registration_date: Optional[str] = None
    insurance_valid_till: Optional[str] = None
    vehicle_class: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "rc_data"

class Scan(Document):
    user_id: str  # Store string ID to avoid strict linking if needed, or use Link[User]
    image_url: str
    scanned_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Classification Metadata
    status: str = "pending" # stock or modified
    binary_confidence: float = 0.0
    modification_scores: Optional[Dict[str, float]] = None
    
    # Vehicle Metadata (Migrated from RCData & OCR)
    plate_number: Optional[str] = None
    vehicle_model: Optional[str] = None
    vehicle_owner: Optional[str] = None
    owner_contact: Optional[str] = None

    class Settings:
        name = "scans"

class Detection(Document):
    scan_id: str
    component_name: str
    confidence: float
    bounding_box: Dict[str, float]
    explanation: Optional[Dict[str, Any]] = None
    segmentation: Optional[List[List[float]]] = None
    heatmap: Optional[str] = None

    class Settings:
        name = "detections"

class Recommendation(Document):
    detection_id: str
    product_name: str
    reason: str
    affiliate_link: Optional[str] = None

    class Settings:
        name = "recommendations"
