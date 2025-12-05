"""
Dependency injection utilities for FastAPI.
"""
from typing import AsyncGenerator, Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from redis import asyncio as aioredis
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import verify_token
from app.db.session import async_session_maker

# OAuth2 scheme for token authentication
oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/login",
    auto_error=False,
)

# Optional OAuth2 scheme (doesn't raise error if no token)
oauth2_scheme_optional = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/login",
    auto_error=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Dependency that provides a database session.
    
    Yields:
        AsyncSession: Database session
    """
    async with async_session_maker() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise


# Redis connection pool
_redis_pool: Optional[aioredis.Redis] = None


async def get_redis() -> aioredis.Redis:
    """
    Dependency that provides a Redis connection.
    
    Returns:
        Redis connection instance
    """
    global _redis_pool
    if _redis_pool is None:
        _redis_pool = aioredis.from_url(
            settings.REDIS_URL,
            encoding="utf-8",
            decode_responses=True,
        )
    return _redis_pool


async def close_redis() -> None:
    """Close Redis connection pool."""
    global _redis_pool
    if _redis_pool is not None:
        await _redis_pool.close()
        _redis_pool = None


async def get_current_user_id(
    token: Optional[str] = Depends(oauth2_scheme),
) -> int:
    """
    Get the current user ID from the JWT token.
    
    Args:
        token: JWT token from the Authorization header
    
    Returns:
        User ID extracted from the token
    
    Raises:
        HTTPException: If token is invalid or missing
    """
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    payload = verify_token(token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return int(user_id)


async def get_current_user_id_optional(
    token: Optional[str] = Depends(oauth2_scheme_optional),
) -> Optional[int]:
    """
    Get the current user ID from the JWT token (optional).
    
    Returns None if no token is provided or token is invalid.
    
    Args:
        token: JWT token from the Authorization header
    
    Returns:
        User ID or None
    """
    if not token:
        return None
    
    payload = verify_token(token)
    if payload is None:
        return None
    
    user_id = payload.get("sub")
    if user_id is None:
        return None
    
    return int(user_id)


# Note: get_current_user and get_current_admin will be added in M3
# after the User model is created. They will look like:
#
# async def get_current_user(
#     user_id: int = Depends(get_current_user_id),
#     db: AsyncSession = Depends(get_db),
# ) -> User:
#     """Get the current authenticated user."""
#     ...
#
# async def get_current_admin(
#     current_user: User = Depends(get_current_user),
# ) -> User:
#     """Get the current user and verify they are an admin."""
#     ...

