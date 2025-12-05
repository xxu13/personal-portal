"""
Comment API endpoints.
"""
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_db, get_current_user_id, get_current_user_id_optional
from app.models.user import User
from app.schemas.comment import (
    CommentCreate,
    CommentUpdate,
    CommentResponse,
    CommentWithReplies,
    CommentTreeResponse,
    CommentListResponse,
)
from app.services.comment_service import CommentService
from app.api.v1.users import get_current_user

router = APIRouter(prefix="/comments", tags=["Comments"])


@router.get("/post/{post_id}", response_model=CommentTreeResponse)
async def get_comments_by_post(
    post_id: int,
    db: AsyncSession = Depends(get_db),
):
    """
    Get comment tree for a post.
    Returns nested structure with all replies.
    """
    comment_service = CommentService(db)
    comments = await comment_service.get_by_post_tree(post_id)
    
    # Convert to response model
    def to_response(comment) -> CommentWithReplies:
        return CommentWithReplies(
            id=comment.id,
            content=comment.content,
            content_text=comment.content_text,
            post_id=comment.post_id,
            user_id=comment.user_id,
            parent_id=comment.parent_id,
            depth=comment.depth,
            path=comment.path,
            like_count=comment.like_count,
            reply_count=comment.reply_count,
            is_deleted=comment.is_deleted,
            created_at=comment.created_at,
            updated_at=comment.updated_at,
            user=comment.user,
            replies=[to_response(r) for r in getattr(comment, 'replies', [])],
        )
    
    return CommentTreeResponse(
        comments=[to_response(c) for c in comments],
        total=sum(1 + len(getattr(c, 'replies', [])) for c in comments),
    )


@router.get("/post/{post_id}/flat", response_model=CommentListResponse)
async def get_comments_flat(
    post_id: int,
    page: int = Query(default=1, ge=1),
    size: int = Query(default=50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """
    Get flat list of comments for a post (paginated).
    Useful for large comment sections.
    """
    comment_service = CommentService(db)
    comments, total = await comment_service.get_by_post_flat(post_id, page, size)
    
    pages = (total + size - 1) // size
    
    return CommentListResponse(
        items=[CommentResponse.model_validate(c) for c in comments],
        total=total,
        page=page,
        size=size,
        pages=pages,
    )


@router.get("/{comment_id}", response_model=CommentResponse)
async def get_comment(
    comment_id: int,
    db: AsyncSession = Depends(get_db),
):
    """
    Get a single comment by ID.
    """
    comment_service = CommentService(db)
    comment = await comment_service.get_by_id(comment_id)
    
    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comment not found",
        )
    
    return CommentResponse.model_validate(comment)


@router.post("", response_model=CommentResponse, status_code=status.HTTP_201_CREATED)
async def create_comment(
    comment_create: CommentCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Create a new comment.
    Set parent_id to reply to another comment.
    """
    comment_service = CommentService(db)
    
    # Validate parent comment exists if replying
    if comment_create.parent_id:
        parent = await comment_service.get_by_id(comment_create.parent_id)
        if not parent:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Parent comment not found",
            )
        # Ensure parent belongs to the same post
        if parent.post_id != comment_create.post_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Parent comment belongs to a different post",
            )
    
    comment = await comment_service.create(current_user.id, comment_create)
    return CommentResponse.model_validate(comment)


@router.put("/{comment_id}", response_model=CommentResponse)
async def update_comment(
    comment_id: int,
    comment_update: CommentUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Update a comment.
    Only the author can update their comment.
    """
    comment_service = CommentService(db)
    comment = await comment_service.get_by_id(comment_id)
    
    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comment not found",
        )
    
    if comment.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this comment",
        )
    
    if comment.is_deleted:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot update a deleted comment",
        )
    
    updated = await comment_service.update(comment, comment_update)
    return CommentResponse.model_validate(updated)


@router.delete("/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_comment(
    comment_id: int,
    hard: bool = Query(default=False, description="Hard delete (admin only)"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Delete a comment.
    By default, soft deletes (marks as deleted but preserves structure).
    Admin can hard delete.
    """
    comment_service = CommentService(db)
    comment = await comment_service.get_by_id(comment_id)
    
    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comment not found",
        )
    
    if comment.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this comment",
        )
    
    # Only admin can hard delete
    if hard and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin can hard delete comments",
        )
    
    await comment_service.delete(comment, soft=not hard)


@router.get("/user/{user_id}", response_model=CommentListResponse)
async def get_user_comments(
    user_id: int,
    page: int = Query(default=1, ge=1),
    size: int = Query(default=20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """
    Get comments by a user.
    """
    comment_service = CommentService(db)
    comments, total = await comment_service.get_user_comments(user_id, page, size)
    
    pages = (total + size - 1) // size
    
    return CommentListResponse(
        items=[CommentResponse.model_validate(c) for c in comments],
        total=total,
        page=page,
        size=size,
        pages=pages,
    )

