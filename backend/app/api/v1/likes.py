"""
Like API endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, func, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_db, get_current_user_id, get_current_user_id_optional
from app.models.user import User
from app.models.interaction import Like
from app.models.post import Post
from app.models.comment import Comment
from app.schemas.interaction import (
    LikeCreate,
    LikeResponse,
    LikeStatusResponse,
    LikeCountResponse,
)
from app.api.v1.users import get_current_user

router = APIRouter(prefix="/likes", tags=["Likes"])


@router.post("", response_model=LikeResponse, status_code=status.HTTP_201_CREATED)
async def create_like(
    like_create: LikeCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Like a post or comment.
    """
    # Check if already liked
    result = await db.execute(
        select(Like).where(
            Like.user_id == current_user.id,
            Like.target_type == like_create.target_type,
            Like.target_id == like_create.target_id,
        )
    )
    existing = result.scalar_one_or_none()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Already liked",
        )
    
    # Verify target exists
    if like_create.target_type == "post":
        post_result = await db.execute(
            select(Post).where(Post.id == like_create.target_id)
        )
        if not post_result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Post not found",
            )
        # Update post like_count
        await db.execute(
            update(Post)
            .where(Post.id == like_create.target_id)
            .values(like_count=Post.like_count + 1)
        )
    elif like_create.target_type == "comment":
        comment_result = await db.execute(
            select(Comment).where(Comment.id == like_create.target_id)
        )
        if not comment_result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Comment not found",
            )
        # Update comment like_count
        await db.execute(
            update(Comment)
            .where(Comment.id == like_create.target_id)
            .values(like_count=Comment.like_count + 1)
        )
    
    # Create like
    like = Like(
        user_id=current_user.id,
        target_type=like_create.target_type,
        target_id=like_create.target_id,
    )
    db.add(like)
    await db.commit()
    await db.refresh(like)
    
    return LikeResponse.model_validate(like)


@router.delete("/{like_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_like(
    like_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Remove a like.
    """
    result = await db.execute(
        select(Like).where(Like.id == like_id)
    )
    like = result.scalar_one_or_none()
    
    if not like:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Like not found",
        )
    
    if like.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized",
        )
    
    # Update target like_count
    if like.target_type == "post":
        await db.execute(
            update(Post)
            .where(Post.id == like.target_id)
            .values(like_count=Post.like_count - 1)
        )
    elif like.target_type == "comment":
        await db.execute(
            update(Comment)
            .where(Comment.id == like.target_id)
            .values(like_count=Comment.like_count - 1)
        )
    
    await db.delete(like)
    await db.commit()


@router.delete("/target/{target_type}/{target_id}", status_code=status.HTTP_204_NO_CONTENT)
async def unlike_target(
    target_type: str,
    target_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Unlike a post or comment by target.
    """
    result = await db.execute(
        select(Like).where(
            Like.user_id == current_user.id,
            Like.target_type == target_type,
            Like.target_id == target_id,
        )
    )
    like = result.scalar_one_or_none()
    
    if not like:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Like not found",
        )
    
    # Update target like_count
    if target_type == "post":
        await db.execute(
            update(Post)
            .where(Post.id == target_id)
            .values(like_count=Post.like_count - 1)
        )
    elif target_type == "comment":
        await db.execute(
            update(Comment)
            .where(Comment.id == target_id)
            .values(like_count=Comment.like_count - 1)
        )
    
    await db.delete(like)
    await db.commit()


@router.get("/status/{target_type}/{target_id}", response_model=LikeStatusResponse)
async def get_like_status(
    target_type: str,
    target_id: int,
    current_user_id: int = Depends(get_current_user_id_optional),
    db: AsyncSession = Depends(get_db),
):
    """
    Check if current user liked a target.
    """
    if not current_user_id:
        return LikeStatusResponse(liked=False)
    
    result = await db.execute(
        select(Like).where(
            Like.user_id == current_user_id,
            Like.target_type == target_type,
            Like.target_id == target_id,
        )
    )
    like = result.scalar_one_or_none()
    
    return LikeStatusResponse(
        liked=like is not None,
        like_id=like.id if like else None,
    )


@router.get("/count/{target_type}/{target_id}", response_model=LikeCountResponse)
async def get_like_count(
    target_type: str,
    target_id: int,
    current_user_id: int = Depends(get_current_user_id_optional),
    db: AsyncSession = Depends(get_db),
):
    """
    Get like count for a target.
    """
    # Get count
    count_result = await db.execute(
        select(func.count()).where(
            Like.target_type == target_type,
            Like.target_id == target_id,
        )
    )
    count = count_result.scalar() or 0
    
    # Check if current user liked
    liked = False
    if current_user_id:
        like_result = await db.execute(
            select(Like).where(
                Like.user_id == current_user_id,
                Like.target_type == target_type,
                Like.target_id == target_id,
            )
        )
        liked = like_result.scalar_one_or_none() is not None
    
    return LikeCountResponse(count=count, liked=liked)

