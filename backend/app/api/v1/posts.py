"""
Post API endpoints.
"""
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_db, get_current_user_id, get_current_user_id_optional
from app.models.user import User
from app.schemas.post import (
    PostCreate,
    PostUpdate,
    PostResponse,
    PostListResponse,
    PostPaginatedResponse,
    PostSearchParams,
)
from app.services.post_service import PostService
from app.api.v1.users import get_current_user

router = APIRouter(prefix="/posts", tags=["Posts"])


@router.get("", response_model=PostPaginatedResponse)
async def get_posts(
    q: Optional[str] = Query(None),
    category_id: Optional[int] = Query(None),
    tag_id: Optional[int] = Query(None),
    is_featured: Optional[bool] = Query(None),
    page: int = Query(default=1, ge=1),
    size: int = Query(default=10, ge=1, le=100),
    sort_by: str = Query(default="created_at"),
    sort_order: str = Query(default="desc"),
    db: AsyncSession = Depends(get_db),
):
    """
    Get paginated list of published posts.
    """
    params = PostSearchParams(
        q=q,
        category_id=category_id,
        tag_id=tag_id,
        is_featured=is_featured,
        page=page,
        size=size,
        sort_by=sort_by,
        sort_order=sort_order,
    )
    
    post_service = PostService(db)
    posts, total = await post_service.get_list(params, published_only=True)
    
    pages = (total + size - 1) // size
    
    return PostPaginatedResponse(
        items=[PostListResponse.model_validate(p) for p in posts],
        total=total,
        page=page,
        size=size,
        pages=pages,
    )


@router.get("/featured", response_model=list[PostListResponse])
async def get_featured_posts(
    limit: int = Query(default=5, ge=1, le=20),
    db: AsyncSession = Depends(get_db),
):
    """
    Get featured posts.
    """
    post_service = PostService(db)
    posts = await post_service.get_featured(limit=limit)
    return [PostListResponse.model_validate(p) for p in posts]


@router.get("/my", response_model=PostPaginatedResponse)
async def get_my_posts(
    status: Optional[str] = Query(None),
    page: int = Query(default=1, ge=1),
    size: int = Query(default=10, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get current user's posts.
    """
    params = PostSearchParams(
        user_id=current_user.id,
        status=status,
        page=page,
        size=size,
    )
    
    post_service = PostService(db)
    posts, total = await post_service.get_list(params, published_only=False)
    
    pages = (total + size - 1) // size
    
    return PostPaginatedResponse(
        items=[PostListResponse.model_validate(p) for p in posts],
        total=total,
        page=page,
        size=size,
        pages=pages,
    )


@router.get("/{post_id}", response_model=PostResponse)
async def get_post(
    post_id: int,
    current_user_id: Optional[int] = Depends(get_current_user_id_optional),
    db: AsyncSession = Depends(get_db),
):
    """
    Get post by ID.
    """
    post_service = PostService(db)
    post = await post_service.get_by_id(post_id)
    
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found",
        )
    
    # Check access for non-published posts
    if post.status != "published":
        if not current_user_id or post.user_id != current_user_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Post not found",
            )
    
    # Increment view count for published posts
    if post.status == "published":
        post = await post_service.increment_view_count(post)
        # Reload with all relationships
        post = await post_service.get_by_id(post.id)
    
    return PostResponse.model_validate(post)


@router.get("/slug/{slug}", response_model=PostResponse)
async def get_post_by_slug(
    slug: str,
    current_user_id: Optional[int] = Depends(get_current_user_id_optional),
    db: AsyncSession = Depends(get_db),
):
    """
    Get post by slug.
    """
    post_service = PostService(db)
    post = await post_service.get_by_slug(slug)
    
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found",
        )
    
    # Check access for non-published posts
    if post.status != "published":
        if not current_user_id or post.user_id != current_user_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Post not found",
            )
    
    # Increment view count for published posts
    if post.status == "published":
        post = await post_service.increment_view_count(post)
        # Reload with all relationships
        post = await post_service.get_by_id(post.id)
    
    return PostResponse.model_validate(post)


@router.post("", response_model=PostResponse, status_code=status.HTTP_201_CREATED)
async def create_post(
    post_create: PostCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Create a new post.
    """
    post_service = PostService(db)
    post = await post_service.create(current_user.id, post_create)
    return PostResponse.model_validate(post)


@router.put("/{post_id}", response_model=PostResponse)
async def update_post(
    post_id: int,
    post_update: PostUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Update a post.
    """
    post_service = PostService(db)
    post = await post_service.get_by_id(post_id)
    
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found",
        )
    
    # Check ownership
    if post.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this post",
        )
    
    updated_post = await post_service.update(post, post_update)
    return PostResponse.model_validate(updated_post)


@router.delete("/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_post(
    post_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Delete a post.
    """
    post_service = PostService(db)
    post = await post_service.get_by_id(post_id)
    
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found",
        )
    
    # Check ownership
    if post.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this post",
        )
    
    await post_service.delete(post)


