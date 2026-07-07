# DEPRECATED: This module has been moved to backend.inference.explainer
from backend.inference.explainer import generate_explanation, explain_detections, get_confidence_label
import warnings
warnings.warn("backend.services.explainer is deprecated. Use backend.inference.explainer instead.", DeprecationWarning)
