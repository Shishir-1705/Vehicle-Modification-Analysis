# DEPRECATED: This module has been moved to backend.config.database
from backend.config.database import engine, SessionLocal, Base, get_db
import warnings
warnings.warn("backend.database is deprecated. Use backend.config.database instead.", DeprecationWarning)
