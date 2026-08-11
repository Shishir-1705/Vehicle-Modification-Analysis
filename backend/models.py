from sqlalchemy import Column, String, Float, DateTime, Boolean, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from .config.database import Base

class UserDB(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    full_name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_premium = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class ScanDB(Base):
    __tablename__ = "scans"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, index=True, nullable=False)
    image_url = Column(Text, nullable=False)
    scanned_at = Column(DateTime, default=datetime.utcnow, index=True)
    
    status = Column(String, default="pending", index=True)  # stock or modified
    binary_confidence = Column(Float, default=0.0)
    modification_scores = Column(JSON, nullable=True)
    
    # Metadata Fields
    plate_number = Column(String, index=True, nullable=True)
    vehicle_model = Column(String, nullable=True)
    vehicle_owner = Column(String, nullable=True)
    owner_contact = Column(String, nullable=True)
    gradcam_image = Column(Text, nullable=True)
    pdf_path = Column(Text, nullable=True)

    # Relationships
    detections = relationship("DetectionDB", back_populates="scan", cascade="all, delete-orphan")

class DetectionDB(Base):
    __tablename__ = "detections"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    scan_id = Column(String, ForeignKey("scans.id", ondelete="CASCADE"), nullable=False, index=True)
    component_name = Column(String, nullable=False)
    confidence = Column(Float, default=0.0)
    bounding_box = Column(JSON, nullable=False)
    explanation = Column(JSON, nullable=True)
    segmentation = Column(JSON, nullable=True)
    heatmap = Column(Text, nullable=True)

    scan = relationship("ScanDB", back_populates="detections")

class RCDataDB(Base):
    __tablename__ = "rc_data"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    plate_number = Column(String, unique=True, index=True, nullable=False)
    owner_masked = Column(String, nullable=True)
    manufacturer = Column(String, nullable=True)
    vehicle_model = Column(String, nullable=True)
    fuel_type = Column(String, nullable=True)
    registration_date = Column(String, nullable=True)
    insurance_valid_till = Column(String, nullable=True)
    vehicle_class = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
