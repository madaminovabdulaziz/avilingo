"""
Application Configuration

Loads settings from environment variables with sensible defaults.
Uses pydantic-settings for validation and type conversion.
"""

from typing import List
from pydantic_settings import BaseSettings
from pydantic import field_validator
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # ==========================================================================
    # Application
    # ==========================================================================
    APP_NAME: str = "AviLingo API"
    APP_VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    API_V1_PREFIX: str = "/api/v1"
    
    # ==========================================================================
    # Database
    # ==========================================================================
    DATABASE_URL: str = "mysql+pymysql://root:root@localhost:3306/avilingo_db"
    
    # ==========================================================================
    # Security
    # ==========================================================================
    SECRET_KEY: str = "your-super-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30
    
    # ==========================================================================
    # Redis
    # ==========================================================================
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # ==========================================================================
    # CORS
    # ==========================================================================
    CORS_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000"
    
    @property
    def cors_origins_list(self) -> List[str]:
        """Parse CORS_ORIGINS string into list."""
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]
    
    # ==========================================================================
    # External Services (optional)
    # ==========================================================================
    OPENAI_API_KEY: str = ""
    
    # ==========================================================================
    # AWS S3 / MinIO Storage
    # ==========================================================================
    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""
    AWS_S3_BUCKET: str = "avilingo-audio"
    AWS_S3_REGION: str = "us-east-1"
    AWS_S3_ENDPOINT_URL: str = ""  # Leave empty for AWS, set for MinIO (e.g., "http://localhost:9000")
    AWS_S3_PUBLIC_URL: str = ""  # Optional CDN/public URL prefix
    
    # ==========================================================================
    # Celery / Background Tasks
    # ==========================================================================
    CELERY_BROKER_URL: str = "redis://localhost:6379/1"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/2"
    
    # ==========================================================================
    # Whisper / Speech-to-Text
    # ==========================================================================
    WHISPER_MODEL: str = "base"  # tiny, base, small, medium, large
    USE_OPENAI_WHISPER_API: bool = False  # If True, use OpenAI API instead of local model
    
    # ==========================================================================
    # Rate Limiting
    # ==========================================================================
    RATE_LIMIT_LOGIN_PER_MINUTE: int = 5
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    """
    Get cached settings instance.
    
    Uses lru_cache to avoid re-reading env variables on every request.
    """
    return Settings()


# Convenience instance
settings = get_settings()

