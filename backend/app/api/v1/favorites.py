"""
Favorite API endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.deps import get_db, get_current_user_id_optional
from app.models.user import User
from app.models.post import Post
from app.models.interaction import Favorite
from app.schemas.interaction import (
    FavoriteCreate,
    FavoriteUpdate,
    FavoriteResponse,
    FavoriteStatusResponse,
    FavoriteListResponse,
)
from app.api.v1.users import get_current_user

router = APIRouter(prefix="/favorites", tags=["Favorites"])


@router.get("", response_model=FavoriteListResponse)
async def get_my_favorites(
    page: int = Query(default=1, ge=1),
    size: int = Query(default=20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get current user's favorites.
    """
    # Count total
    count_result = await db.execute(
        select(func.count()).where(Favorite.user_id == current_user.id)
    )
    total = count_result.scalar() or 0
    
    # Get favorites with posts
    offset = (page - 1) * size
    result = await db.execute(
        select(Favorite)
        .options(selectinload(Favorite.post))
        .where(Favorite.user_id == current_user.id)
        .order_by(Favorite.created_at.desc())
        .offset(offset)
        .limit(size)
    )
    favorites = list(result.scalars().all())
    
    pages = (total + size - 1) // size
    
    return FavoriteListResponse(
        items=[FavoriteResponse.model_validate(f) for f in favorites],
        total=total,
        page=page,
        size=size,
        pages=pages,
    )


@router.post("", response_model=FavoriteResponse, status_code=status.HTTP_201_CREATED)
async def create_favorite(
    favorite_create: FavoriteCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Add a post to favorites.
    """
    # Check if already favorited
    result = await db.execute(
        select(Favorite).where(
            Favorite.user_id == current_user.id,
            Favorite.post_id == favorite_create.post_id,
        )
    )
    existing = result.scalar_one_or_none()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Already favorited",
        )
    
    # Verify post exists
    post_result = await db.execute(
        select(Post).where(Post.id == favorite_create.post_id)
    )
    post = post_result.scalar_one_or_none()
    
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found",
        )
    
    # Create favorite
    favorite = Favorite(
        user_id=current_user.id,
        post_id=favorite_create.post_id,
        note=favorite_create.note,
    )
    db.add(favorite)
    await db.commit()
    
    # Reload with post
    result = await db.execute(
        select(Favorite)
        .options(selectinload(Favorite.post))
        .where(Favorite.id == favorite.id)
    )
    favorite = result.scalar_one()
    
    return FavoriteResponse.model_validate(favorite)


@router.put("/{favorite_id}", response_model=FavoriteResponse)
async def update_favorite(
    favorite_id: int,
    favorite_update: FavoriteUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Update a favorite (e.g., add/update note).
    """
    result = await db.execute(
        select(Favorite)
        .options(selectinload(Favorite.post))
        .where(Favorite.id == favorite_id)
    )
    favorite = result.scalar_one_or_none()
    
    if not favorite:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Favorite not found",
        )
    
    if favorite.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized",
        )
    
    favorite.note = favorite_update.note
    await db.commit()
    await db.refresh(favorite)
    
    return FavoriteResponse.model_validate(favorite)


@router.delete("/{favorite_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_favorite(
    favorite_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Remove a post from favorites.
    """
    result = await db.execute(
        select(Favorite).where(Favorite.id == favorite_id)
    )
    favorite = result.scalar_one_or_none()
    
    if not favorite:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Favorite not found",
        )
    
    if favorite.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized",
        )
    
    await db.delete(favorite)
    await db.commit()


@router.delete("/post/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
async def unfavorite_post(
    post_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Remove a post from favorites by post ID.
    """
    result = await db.execute(
        select(Favorite).where(
            Favorite.user_id == current_user.id,
            Favorite.post_id == post_id,
        )
    )
    favorite = result.scalar_one_or_none()
    
    if not favorite:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Favorite not found",
        )
    
    await db.delete(favorite)
    await db.commit()


@router.get("/status/{post_id}", response_model=FavoriteStatusResponse)
async def get_favorite_status(
    post_id: int,
    current_user_id: int = Depends(get_current_user_id_optional),
    db: AsyncSession = Depends(get_db),
):
    """
    Check if current user favorited a post.
    """
    if not current_user_id:
        return FavoriteStatusResponse(favorited=False)
    
    result = await db.execute(
        select(Favorite).where(
            Favorite.user_id == current_user_id,
            Favorite.post_id == post_id,
        )
    )
    favorite = result.scalar_one_or_none()
    
    return FavoriteStatusResponse(
        favorited=favorite is not None,
        favorite_id=favorite.id if favorite else None,
    )

