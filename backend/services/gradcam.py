# DEPRECATED: This module has been moved to backend.inference.gradcam
from backend.inference.gradcam.engine import get_gradcam_engine
import warnings
warnings.warn("backend.services.gradcam is deprecated. Use backend.inference.gradcam instead.", DeprecationWarning)
