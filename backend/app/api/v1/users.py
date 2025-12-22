"""
User API endpoints.
"""
import os
import uuid
from typing import Optional

import aiofiles
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.deps import get_db, get_current_user_id
from app.models.user import User
from app.schemas.user import UserResponse, UserUpdate, UserPublicResponse, UserUpdatePassword
from app.services.user_service import UserService

router = APIRouter(prefix="/users", tags=["Users"])


async def get_current_user(
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
) -> User:
    """Get current authenticated user."""
    user_service = UserService(db)
    user = await user_service.get_by_id(user_id)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is deactivated",
        )
    
    return user


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_user),
):
    """
    Get current user information.
    """
    return current_user


@router.put("/me", response_model=UserResponse)
async def update_current_user(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Update current user profile.
    """
    user_service = UserService(db)
    updated_user = await user_service.update(current_user, user_update)
    return updated_user


@router.put("/me/password")
async def change_password(
    password_data: UserUpdatePassword,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Change current user password.
    """
    user_service = UserService(db)
    
    success = await user_service.update_password(
        current_user,
        password_data.current_password,
        password_data.new_password,
    )
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect",
        )
    
    return {"message": "Password updated successfully"}


@router.put("/me/avatar", response_model=UserResponse)
async def update_avatar(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Update current user avatar.
    """
    # Validate file type
    if file.content_type not in settings.ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file type. Allowed: jpeg, png, gif, webp",
        )
    
    # Validate file size
    content = await file.read()
    if len(content) > settings.MAX_UPLOAD_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File too large. Max size: {settings.MAX_UPLOAD_SIZE // 1024 // 1024}MB",
        )
    
    # Generate unique filename
    ext = file.filename.split(".")[-1] if file.filename else "jpg"
    filename = f"{uuid.uuid4()}.{ext}"
    filepath = os.path.join(settings.UPLOAD_DIR, "avatars", filename)
    
    # Ensure directory exists
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    
    # Save file
    async with aiofiles.open(filepath, "wb") as f:
        await f.write(content)
    
    # Delete old avatar if exists
    if current_user.avatar:
        old_path = os.path.join(settings.UPLOAD_DIR, current_user.avatar.lstrip("/uploads/"))
        if os.path.exists(old_path):
            os.remove(old_path)
    
    # Update user avatar URL
    avatar_url = f"/uploads/avatars/{filename}"
    user_service = UserService(db)
    updated_user = await user_service.update_avatar(current_user, avatar_url)
    
    return updated_user


@router.get("/{user_id}", response_model=UserPublicResponse)
async def get_user_by_id(
    user_id: int,
    db: AsyncSession = Depends(get_db),
):
    """
    Get public user information by ID.
    """
    user_service = UserService(db)
    user = await user_service.get_by_id(user_id)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    
    return user


@router.get("/username/{username}", response_model=UserPublicResponse)
async def get_user_by_username(
    username: str,
    db: AsyncSession = Depends(get_db),
):
    """
    Get public user information by username.
    """
    user_service = UserService(db)
    user = await user_service.get_by_username(username)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    
    return user



