import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from .env import settings

# Determine Storage Root and Database URL
STORAGE_DIR = os.getenv("AXION_STORAGE_DIR", ".")
DEFAULT_SQLITE_PATH = os.path.join(STORAGE_DIR, "modai.db")
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{DEFAULT_SQLITE_PATH}")

# Ensure required storage directory exists before SQLite attempts to connect/create files
def _ensure_storage_dir():
    if STORAGE_DIR and STORAGE_DIR != ".":
        try:
            os.makedirs(STORAGE_DIR, exist_ok=True)
        except Exception:
            pass

    if DATABASE_URL.startswith("sqlite"):
        try:
            db_path = DATABASE_URL[len("sqlite:///"):]
            db_dir = os.path.dirname(db_path)
            if db_dir:
                os.makedirs(db_dir, exist_ok=True)
        except Exception:
            pass

_ensure_storage_dir()

# SQLite requires connect_args check_same_thread=False
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}


engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, expire_on_commit=False, bind=engine)
Base = declarative_base()


def get_db():
    """FastAPI Dependency for database sessions."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

async def init_db():
    """
    Initialize SQLAlchemy database tables on startup.
    """
    _ensure_storage_dir()
    from ..models import Base as ModelsBase
    ModelsBase.metadata.create_all(bind=engine)
    print("[OK] SQLALCHEMY PERSISTENCE INITIALIZED SUCCESSFULLY (modai.db)")


async def close_db():
    """
    Dispose engine connections on shutdown.
    """
    engine.dispose()


