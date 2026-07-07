# DEPRECATED: This module has been moved to backend.inference.onnx_engine
from backend.inference.onnx.engine import get_onnx_engine
import warnings
warnings.warn("backend.services.onnx_engine is deprecated. Use backend.inference.onnx_engine instead.", DeprecationWarning)
