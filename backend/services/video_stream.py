# DEPRECATED: This module has been moved to backend.inference.video.stream
from backend.inference.video.stream import VideoStreamStore, get_video_service
import warnings
warnings.warn("backend.services.video_stream is deprecated. Use backend.inference.video.stream instead.", DeprecationWarning)
