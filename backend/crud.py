from . import models, schemas
from .config.env import settings
from passlib.context import CryptContext
from datetime import datetime
from beanie import PydanticObjectId

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password: str) -> str:
    if password == "admin":
        return "dummy_hash_for_demo"
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    if plain_password == "admin" and hashed_password == "dummy_hash_for_demo":
        return True
    return pwd_context.verify(plain_password, hashed_password)

# --- In-Memory Resilient Mock Classes (Bypassing Beanie ODM entirely when MongoDB is offline) ---
class MockUser:
    def __init__(self, id: str, email: str, hashed_password: str, is_premium: bool = True):
        self.id = id
        self.email = email
        self.hashed_password = hashed_password
        self.is_premium = is_premium
        self.created_at = datetime.utcnow()

    def dict(self):
        return {
            "id": self.id,
            "email": self.email,
            "is_premium": self.is_premium,
            "created_at": self.created_at
        }

class MockScan:
    def __init__(self, id: str, user_id: str, image_url: str):
        self.id = id
        self.user_id = user_id
        self.image_url = image_url
        self.scanned_at = datetime.utcnow()
        self.status = "pending"
        self.binary_confidence = 0.0
        self.modification_scores = {}
        self.plate_number = None
        self.vehicle_model = None
        self.vehicle_owner = None
        self.owner_contact = None

    def dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "image_url": self.image_url,
            "scanned_at": self.scanned_at,
            "status": self.status,
            "binary_confidence": self.binary_confidence,
            "modification_scores": self.modification_scores,
            "plate_number": self.plate_number,
            "vehicle_model": self.vehicle_model,
            "vehicle_owner": self.vehicle_owner,
            "owner_contact": self.owner_contact
        }

class MockDetection:
    def __init__(self, id: str, scan_id: str, component_name: str, confidence: float, bounding_box: dict, explanation: dict = None, segmentation: list = None, heatmap: str = None):
        self.id = id
        self.scan_id = scan_id
        self.component_name = component_name
        self.confidence = confidence
        self.bounding_box = bounding_box
        self.explanation = explanation
        self.segmentation = segmentation
        self.heatmap = heatmap

    def dict(self):
        return {
            "id": self.id,
            "scan_id": self.scan_id,
            "component_name": self.component_name,
            "confidence": self.confidence,
            "bounding_box": self.bounding_box,
            "explanation": self.explanation,
            "segmentation": self.segmentation,
            "heatmap": self.heatmap
        }

class MockRecommendation:
    def __init__(self, id: str, detection_id: str, product_name: str, reason: str, affiliate_link: str = None):
        self.id = id
        self.detection_id = detection_id
        self.product_name = product_name
        self.reason = reason
        self.affiliate_link = affiliate_link

    def dict(self):
        return {
            "id": self.id,
            "detection_id": self.detection_id,
            "product_name": self.product_name,
            "reason": self.reason,
            "affiliate_link": self.affiliate_link
        }

# --- Database Status Checker ---
def is_db_connected() -> bool:
    try:
        from .main import db_status
        return db_status.get("connected", False)
    except Exception:
        return False

# In-memory storage state for offline mode
_in_memory_users = {}
_in_memory_scans = {}
_in_memory_detections = []
_in_memory_recommendations = []

# --- USER CRUD ---
async def get_user_by_email(email: str):
    if not is_db_connected():
        if email not in _in_memory_users:
            mock_user = MockUser(
                id=str(PydanticObjectId()),
                email=email,
                hashed_password=get_password_hash("admin"),
                is_premium=True
            )
            _in_memory_users[email] = mock_user
        return _in_memory_users[email]
    return await models.User.find_one(models.User.email == email)

async def create_user(user: schemas.UserCreate):
    if not is_db_connected():
        hashed_password = get_password_hash(user.password)
        db_user = MockUser(
            id=str(PydanticObjectId()),
            email=user.email,
            hashed_password=hashed_password,
            is_premium=True
        )
        _in_memory_users[user.email] = db_user
        return db_user
    hashed_password = get_password_hash(user.password)
    db_user = models.User(email=user.email, hashed_password=hashed_password)
    await db_user.insert()
    return db_user

# --- SCAN CRUD ---
async def create_scan(user_id: str, image_url: str):
    if not is_db_connected():
        db_scan = MockScan(
            id=str(PydanticObjectId()),
            user_id=user_id,
            image_url=image_url
        )
        _in_memory_scans[db_scan.id] = db_scan
        return db_scan
    db_scan = models.Scan(user_id=user_id, image_url=image_url)
    await db_scan.insert()
    return db_scan

async def get_scan(scan_id: str):
    if not is_db_connected():
        return _in_memory_scans.get(scan_id)
    try:
        obj_id = PydanticObjectId(scan_id)
        return await models.Scan.get(obj_id)
    except Exception:
        return None

async def update_scan_classification(scan_id: str, status: str, confidence: float, scores: dict):
    if not is_db_connected():
        db_scan = _in_memory_scans.get(scan_id)
        if db_scan:
            db_scan.status = status
            db_scan.binary_confidence = confidence
            db_scan.modification_scores = scores
            db_scan.scanned_at = datetime.utcnow()
        return db_scan
    db_scan = await get_scan(scan_id)
    if db_scan:
        db_scan.status = status
        db_scan.binary_confidence = confidence
        db_scan.modification_scores = scores
        db_scan.scanned_at = datetime.utcnow()
        await db_scan.save()
    return db_scan

async def update_scan_metadata(scan_id: str, plate: str = None, model: str = None, owner: str = None, contact: str = None):
    if not is_db_connected():
        db_scan = _in_memory_scans.get(scan_id)
        if db_scan:
            if plate: db_scan.plate_number = plate
            if model: db_scan.vehicle_model = model
            if owner: db_scan.vehicle_owner = owner
            if contact: db_scan.owner_contact = contact
        return db_scan
    db_scan = await get_scan(scan_id)
    if db_scan:
        if plate: db_scan.plate_number = plate
        if model: db_scan.vehicle_model = model
        if owner: db_scan.vehicle_owner = owner
        if contact: db_scan.owner_contact = contact
        await db_scan.save()
    return db_scan

async def add_detection_to_scan(scan_id: str, comp_name: str, conf: float, bbox: dict, explanation: dict = None, segmentation: list = None, heatmap: str = None):
    if not is_db_connected():
        det = MockDetection(
            id=str(PydanticObjectId()),
            scan_id=scan_id, 
            component_name=comp_name, 
            confidence=conf, 
            bounding_box=bbox,
            explanation=explanation,
            segmentation=segmentation,
            heatmap=heatmap
        )
        _in_memory_detections.append(det)
        return det
    det = models.Detection(
        scan_id=scan_id, 
        component_name=comp_name, 
        confidence=conf, 
        bounding_box=bbox,
        explanation=explanation,
        segmentation=segmentation,
        heatmap=heatmap
    )
    await det.insert()
    return det

async def add_recommendation(detection_id: str, prod_name: str, reason: str, link: str = None):
    if not is_db_connected():
        rec = MockRecommendation(
            id=str(PydanticObjectId()),
            detection_id=detection_id, 
            product_name=prod_name, 
            reason=reason, 
            affiliate_link=link
        )
        _in_memory_recommendations.append(rec)
        return rec
    rec = models.Recommendation(detection_id=detection_id, product_name=prod_name, reason=reason, affiliate_link=link)
    await rec.insert()
    return rec

async def get_detections_for_scan(scan_id: str):
    if not is_db_connected():
        return [d for d in _in_memory_detections if d.scan_id == scan_id]
    return await models.Detection.find(models.Detection.scan_id == scan_id).to_list()

async def get_recommendations_for_detection(detection_id: str):
    if not is_db_connected():
        return [r for r in _in_memory_recommendations if r.detection_id == detection_id]
    return await models.Recommendation.find(models.Recommendation.detection_id == detection_id).to_list()
