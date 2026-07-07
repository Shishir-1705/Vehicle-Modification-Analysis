# DEPRECATED: This module has been moved to backend.inference.ocr_engine
from backend.inference.ocr.engine import get_ocr_engine
import warnings
warnings.warn("backend.services.ocr_engine is deprecated. Use backend.inference.ocr_engine instead.", DeprecationWarning)
