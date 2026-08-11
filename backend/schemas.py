from pydantic import BaseModel, EmailStr
from typing import List, Optional, Any
from datetime import datetime

# --- USERS ---
class UserCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    full_name: str
    email: EmailStr
    is_premium: bool
    created_at: datetime

    class Config:
        from_attributes = True

class UserProfileResponse(BaseModel):
    id: str
    full_name: str
    email: EmailStr
    created_at: datetime
    role: str = "Verified Inspector"
    total_scans: int = 0
    reports_generated: int = 0

    class Config:
        from_attributes = True

class PredictResponse(BaseModel):
    is_modified: bool
    binary_confidence: float
    status: str
    plate_number: Optional[str] = None
    vehicle_model: Optional[str] = None
    detections: List[dict] = []
    gradcam_image: Optional[str] = None
    pdf_report: Optional[str] = None
    latency_ms: float



# --- RECOMMENDATIONS ---
class RecommendationResponse(BaseModel):
    id: str
    component_name: str
    type: str
    title: str
    description: str
    estimated_cost_inr: float
    urgency: str
    legal_reference: str

# --- SCANS & DETECTIONS ---
class DetectionCreate(BaseModel):
    component_name: str
    confidence: float = 0.0

    bounding_box: List[float]
    explanation: Optional[dict] = None
    segmentation: Optional[List[List[float]]] = None
    heatmap: Optional[str] = None

class DetectionResponse(BaseModel):
    id: str
    scan_id: str
    component_name: str
    confidence: float
    bounding_box: List[float]
    explanation: Optional[dict] = None
    segmentation: Optional[List[List[float]]] = None
    heatmap: Optional[str] = None

    class Config:
        from_attributes = True

class ScanResponse(BaseModel):
    id: str
    user_id: str
    image_url: str
    scanned_at: datetime
    status: str
    binary_confidence: float
    modification_scores: Optional[dict] = None
    plate_number: Optional[str] = None
    vehicle_model: Optional[str] = None
    vehicle_owner: Optional[str] = None
    owner_contact: Optional[str] = None
    gradcam_image: Optional[str] = None
    pdf_path: Optional[str] = None
    detections: List[DetectionResponse] = []

    class Config:
        from_attributes = True

# --- AUTH ---
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
