# API Routes
from fastapi import APIRouter

from app.api.routes import auth, users, vocabulary, listening, speaking, progress, reference

api_router = APIRouter()

# Include all route modules
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(vocabulary.router, prefix="/vocabulary", tags=["Vocabulary"])
api_router.include_router(listening.router, prefix="/listening", tags=["Listening"])
api_router.include_router(speaking.router, prefix="/speaking", tags=["Speaking"])
api_router.include_router(progress.router, prefix="/progress", tags=["Progress"])
api_router.include_router(reference.router, prefix="/reference", tags=["Reference"])

