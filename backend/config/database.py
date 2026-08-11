import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from .env import settings

# Determine Database URL: Use SQLite for local development (modai.db) or PostgreSQL in production
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./modai.db")

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
    from ..models import Base as ModelsBase
    ModelsBase.metadata.create_all(bind=engine)
    print("[OK] SQLALCHEMY PERSISTENCE INITIALIZED SUCCESSFULLY (modai.db)")


async def close_db():
    """
    Dispose engine connections on shutdown.
    """
    engine.dispose()


