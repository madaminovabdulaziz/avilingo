"""
AviLingo API - Main Application

Aviation English learning platform API.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
import logging
import time
import asyncio

from sqlalchemy import text

from app.core.config import settings
from app.api.routes import api_router
from app.db.session import engine
from app.db.base import Base
from app.core.rate_limiter import rate_limiter

# Configure logging
logging.basicConfig(
    level=logging.DEBUG if settings.DEBUG else logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


# =============================================================================
# Lifespan Events
# =============================================================================

async def cleanup_rate_limiter():
    """Periodically clean up old rate limit entries."""
    while True:
        await asyncio.sleep(3600)  # Every hour
        rate_limiter.cleanup(max_age_seconds=3600)
        logger.debug("Rate limiter cleanup completed")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan events.
    
    Startup: Verify database connection, start background tasks
    Shutdown: Clean up resources
    """
    # Startup
    logger.info("Starting AviLingo API...")
    
    try:
        # Verify database connection
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        logger.info("Database connection verified")
    except Exception as e:
        logger.error(f"Database connection failed: {e}")
        # Don't raise - allow app to start for health checks
    
    # Start background cleanup task for rate limiter
    cleanup_task = asyncio.create_task(cleanup_rate_limiter())
    logger.info("Rate limiter cleanup task started")
    
    yield
    
    # Shutdown
    logger.info("Shutting down AviLingo API...")
    
    # Cancel cleanup task
    cleanup_task.cancel()
    try:
        await cleanup_task
    except asyncio.CancelledError:
        pass
    
    engine.dispose()
    logger.info("Database connections closed")


# =============================================================================
# Application
# =============================================================================

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Aviation English learning platform API for ICAO certification preparation",
    openapi_url=f"{settings.API_V1_PREFIX}/openapi.json",
    docs_url=f"{settings.API_V1_PREFIX}/docs",
    redoc_url=f"{settings.API_V1_PREFIX}/redoc",
    lifespan=lifespan
)


# =============================================================================
# Middleware
# =============================================================================

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log all requests with timing."""
    start_time = time.time()
    
    response = await call_next(request)
    
    process_time = time.time() - start_time
    logger.debug(
        f"{request.method} {request.url.path} "
        f"- Status: {response.status_code} "
        f"- Time: {process_time:.3f}s"
    )
    
    response.headers["X-Process-Time"] = str(process_time)
    return response


# =============================================================================
# Exception Handlers
# =============================================================================

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle validation errors with clear messages."""
    errors = []
    for error in exc.errors():
        errors.append({
            "field": ".".join(str(loc) for loc in error["loc"]),
            "message": error["msg"],
            "type": error["type"]
        })
    
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "detail": "Validation error",
            "errors": errors
        }
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handle unexpected errors."""
    logger.exception(f"Unhandled exception: {exc}")
    
    # Don't expose internal errors in production
    if settings.DEBUG:
        detail = str(exc)
    else:
        detail = "An internal error occurred"
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": detail}
    )


# =============================================================================
# Routes
# =============================================================================

# Health check endpoint
@app.get("/health", tags=["Health"])
async def health_check():
    """
    Health check endpoint.
    
    Returns API status and version.
    Used by load balancers and monitoring.
    """
    return {
        "status": "healthy",
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT
    }


@app.get("/health/detailed", tags=["Health"])
async def detailed_health_check():
    """
    Detailed health check with dependency status.
    
    Checks database and Redis connectivity.
    """
    health = {
        "status": "healthy",
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
        "dependencies": {}
    }
    
    # Check database
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        health["dependencies"]["database"] = {"status": "healthy"}
    except Exception as e:
        health["dependencies"]["database"] = {
            "status": "unhealthy",
            "error": str(e) if settings.DEBUG else "Connection failed"
        }
        health["status"] = "degraded"
    
    # Check Redis (if configured)
    if settings.REDIS_URL:
        try:
            import redis
            r = redis.from_url(settings.REDIS_URL)
            r.ping()
            health["dependencies"]["redis"] = {"status": "healthy"}
        except Exception as e:
            health["dependencies"]["redis"] = {
                "status": "unhealthy",
                "error": str(e) if settings.DEBUG else "Connection failed"
            }
            health["status"] = "degraded"
    
    return health


# Include API routes
app.include_router(api_router, prefix=settings.API_V1_PREFIX)


# =============================================================================
# Development Server
# =============================================================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG
    )

