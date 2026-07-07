# DEPRECATED: This module has been moved to backend.inference.classifier
from backend.inference.classifier import classify_bike, get_models
import warnings
warnings.warn("backend.services.classifier is deprecated. Use backend.inference.classifier instead.", DeprecationWarning)
