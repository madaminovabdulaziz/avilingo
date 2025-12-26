"""
Database Session Management

Creates SQLAlchemy engine and session factory.
Provides get_db dependency for FastAPI routes.
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from typing import Generator

from app.core.config import settings

# =============================================================================
# Engine Configuration
# =============================================================================

engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,  # Check connection health before using
    pool_size=10,        # Number of connections to keep open
    max_overflow=20,     # Max additional connections when pool is full
    pool_recycle=3600,   # Recycle connections after 1 hour
    echo=settings.DEBUG  # Log SQL statements in debug mode
)

# =============================================================================
# Session Factory
# =============================================================================

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)


# =============================================================================
# Dependency
# =============================================================================

def get_db() -> Generator[Session, None, None]:
    """
    FastAPI dependency that provides a database session.
    
    Automatically closes the session when the request is complete.
    
    Usage:
        @router.get("/items")
        async def get_items(db: Session = Depends(get_db)):
            ...
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

