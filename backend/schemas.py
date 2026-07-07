from pydantic import BaseModel, EmailStr
from typing import List, Optional, Any
from datetime import datetime

# --- USERS ---
class UserCreate(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: EmailStr
    is_premium: bool
    created_at: datetime

    class Config:
        from_attributes = True

# --- RECOMMENDATIONS ---
class RecommendationResponse(BaseModel):
    id: str
    product_name: str
    reason: str
    affiliate_link: Optional[str] = None

    class Config:
        from_attributes = True

# --- DETECTIONS ---
class DetectionResponse(BaseModel):
    id: str
    component_name: str
    confidence: float
    bounding_box: Any
    explanation: Optional[dict] = None
    segmentation: Optional[List[List[float]]] = None
    heatmap: Optional[str] = None

    recommendations: List[RecommendationResponse] = []

    class Config:
        from_attributes = True

# --- SCANS ---
class ScanResponse(BaseModel):
    id: str
    image_url: str
    scanned_at: datetime
    status: str
    binary_confidence: float
    modification_scores: Optional[dict] = None
    
    # Automated Metadata
    plate_number: Optional[str] = None
    vehicle_model: Optional[str] = None
    vehicle_owner: Optional[str] = None
    owner_contact: Optional[str] = None
    
    detections: List[DetectionResponse] = []

    class Config:
        from_attributes = True

# --- TOKENS (AUTH) ---
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

# --- PRODUCTION PREDICT RESPONSE ---
class PredictResponse(BaseModel):
    status: str
    inference_time_ms: float
    detections: List[DetectionResponse]
    ocr_output: Optional[str] = None
    system_load: Optional[float] = None
    scanned_at: datetime = datetime.now()
