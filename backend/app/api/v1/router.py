"""
API v1 router aggregation.
"""
from fastapi import APIRouter

from app.api.v1.auth import router as auth_router
from app.api.v1.users import router as users_router
from app.api.v1.categories import router as categories_router
from app.api.v1.tags import router as tags_router
from app.api.v1.posts import router as posts_router
from app.api.v1.drafts import router as drafts_router
from app.api.v1.uploads import router as uploads_router
from app.api.v1.comments import router as comments_router
from app.api.v1.likes import router as likes_router
from app.api.v1.favorites import router as favorites_router
from app.api.v1.messages import router as messages_router
from app.api.v1.notifications import router as notifications_router
from app.api.v1.admin import router as admin_router
from app.api.v1.ai import router as ai_router

# Create main API router
api_router = APIRouter()

# Include all routers
api_router.include_router(auth_router)
api_router.include_router(users_router)
api_router.include_router(categories_router)
api_router.include_router(tags_router)
api_router.include_router(posts_router)
api_router.include_router(drafts_router)
api_router.include_router(uploads_router)
api_router.include_router(comments_router)
api_router.include_router(likes_router)
api_router.include_router(favorites_router)
api_router.include_router(messages_router)
api_router.include_router(notifications_router)
api_router.include_router(admin_router)
api_router.include_router(ai_router)
