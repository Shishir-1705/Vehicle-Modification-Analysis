# DEPRECATED: This module has been moved to backend.inference.yolo_engine
from backend.inference.yolo.engine import get_yolo_engine
import warnings
warnings.warn("backend.services.yolo_engine is deprecated. Use backend.inference.yolo_engine instead.", DeprecationWarning)
