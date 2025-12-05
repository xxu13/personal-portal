"""
Admin API endpoints for backend management.
"""
from datetime import datetime, timedelta
from typing import Optional, Literal

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy import select, func, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.deps import get_db
from app.models.user import User
from app.models.post import Post
from app.models.comment import Comment
from app.models.category import Category
from app.models.tag import Tag
from app.api.v1.users import get_current_user

router = APIRouter(prefix="/admin", tags=["Admin"])


# --- Admin Authentication Dependency ---

async def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """Require admin role."""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return current_user


# --- Dashboard Statistics ---

@router.get("/stats")
async def get_dashboard_stats(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    """Get dashboard statistics."""
    # User stats
    total_users = await db.scalar(select(func.count()).select_from(User))
    new_users_today = await db.scalar(
        select(func.count()).where(
            User.created_at >= datetime.utcnow().date()
        )
    )
    
    # Post stats
    total_posts = await db.scalar(select(func.count()).select_from(Post))
    published_posts = await db.scalar(
        select(func.count()).where(Post.status == "published")
    )
    
    # Comment stats
    total_comments = await db.scalar(select(func.count()).select_from(Comment))
    
    # Category/Tag stats
    total_categories = await db.scalar(select(func.count()).select_from(Category))
    total_tags = await db.scalar(select(func.count()).select_from(Tag))
    
    # Recent activity (last 7 days)
    week_ago = datetime.utcnow() - timedelta(days=7)
    posts_this_week = await db.scalar(
        select(func.count()).where(Post.created_at >= week_ago)
    )
    comments_this_week = await db.scalar(
        select(func.count()).where(Comment.created_at >= week_ago)
    )
    
    return {
        "users": {
            "total": total_users or 0,
            "new_today": new_users_today or 0,
        },
        "posts": {
            "total": total_posts or 0,
            "published": published_posts or 0,
            "this_week": posts_this_week or 0,
        },
        "comments": {
            "total": total_comments or 0,
            "this_week": comments_this_week or 0,
        },
        "categories": total_categories or 0,
        "tags": total_tags or 0,
    }


# --- User Management ---

@router.get("/users")
async def list_users(
    page: int = Query(default=1, ge=1),
    size: int = Query(default=20, ge=1, le=100),
    search: Optional[str] = None,
    role: Optional[str] = None,
    is_active: Optional[bool] = None,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    """List all users with filtering."""
    query = select(User).order_by(User.created_at.desc())
    
    if search:
        query = query.where(
            or_(
                User.username.ilike(f"%{search}%"),
                User.email.ilike(f"%{search}%"),
                User.nickname.ilike(f"%{search}%"),
            )
        )
    if role:
        query = query.where(User.role == role)
    if is_active is not None:
        query = query.where(User.is_active == is_active)
    
    # Count
    count_query = select(func.count()).select_from(query.subquery())
    total = await db.scalar(count_query) or 0
    
    # Paginate
    offset = (page - 1) * size
    result = await db.execute(query.offset(offset).limit(size))
    users = result.scalars().all()
    
    return {
        "items": [
            {
                "id": u.id,
                "username": u.username,
                "email": u.email,
                "nickname": u.nickname,
                "avatar": u.avatar,
                "role": u.role,
                "is_active": u.is_active,
                "created_at": u.created_at,
            }
            for u in users
        ],
        "total": total,
        "page": page,
        "size": size,
        "pages": (total + size - 1) // size,
    }


@router.patch("/users/{user_id}")
async def update_user(
    user_id: int,
    role: Optional[str] = None,
    is_active: Optional[bool] = None,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """Update user role or status."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.id == admin.id:
        raise HTTPException(status_code=400, detail="Cannot modify yourself")
    
    if role:
        user.role = role
    if is_active is not None:
        user.is_active = is_active
    
    await db.commit()
    return {"message": "User updated"}


# --- Post Management ---

@router.get("/posts")
async def list_posts(
    page: int = Query(default=1, ge=1),
    size: int = Query(default=20, ge=1, le=100),
    search: Optional[str] = None,
    status: Optional[str] = None,
    author_id: Optional[int] = None,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    """List all posts with filtering."""
    query = (
        select(Post)
        .options(selectinload(Post.author), selectinload(Post.category))
        .order_by(Post.created_at.desc())
    )
    
    if search:
        query = query.where(
            or_(
                Post.title.ilike(f"%{search}%"),
                Post.slug.ilike(f"%{search}%"),
            )
        )
    if status:
        query = query.where(Post.status == status)
    if author_id:
        query = query.where(Post.author_id == author_id)
    
    # Count
    count_query = select(func.count()).select_from(query.subquery())
    total = await db.scalar(count_query) or 0
    
    # Paginate
    offset = (page - 1) * size
    result = await db.execute(query.offset(offset).limit(size))
    posts = result.scalars().all()
    
    return {
        "items": [
            {
                "id": p.id,
                "title": p.title,
                "slug": p.slug,
                "status": p.status,
                "view_count": p.view_count,
                "like_count": p.like_count,
                "comment_count": p.comment_count,
                "author": {
                    "id": p.author.id,
                    "username": p.author.username,
                    "nickname": p.author.nickname,
                } if p.author else None,
                "category": {
                    "id": p.category.id,
                    "name": p.category.name,
                } if p.category else None,
                "created_at": p.created_at,
            }
            for p in posts
        ],
        "total": total,
        "page": page,
        "size": size,
        "pages": (total + size - 1) // size,
    }


@router.patch("/posts/{post_id}")
async def update_post_status(
    post_id: int,
    status: Literal["published", "draft", "archived"],
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    """Update post status (publish/archive/draft)."""
    result = await db.execute(select(Post).where(Post.id == post_id))
    post = result.scalar_one_or_none()
    
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    post.status = status
    if status == "published" and not post.published_at:
        post.published_at = datetime.utcnow()
    
    await db.commit()
    return {"message": "Post updated"}


@router.delete("/posts/{post_id}")
async def delete_post(
    post_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    """Delete a post."""
    result = await db.execute(select(Post).where(Post.id == post_id))
    post = result.scalar_one_or_none()
    
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    await db.delete(post)
    await db.commit()
    return {"message": "Post deleted"}


# --- Comment Management ---

@router.get("/comments")
async def list_comments(
    page: int = Query(default=1, ge=1),
    size: int = Query(default=20, ge=1, le=100),
    post_id: Optional[int] = None,
    user_id: Optional[int] = None,
    is_deleted: Optional[bool] = None,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    """List all comments with filtering."""
    query = (
        select(Comment)
        .options(selectinload(Comment.user), selectinload(Comment.post))
        .order_by(Comment.created_at.desc())
    )
    
    if post_id:
        query = query.where(Comment.post_id == post_id)
    if user_id:
        query = query.where(Comment.user_id == user_id)
    if is_deleted is not None:
        query = query.where(Comment.is_deleted == is_deleted)
    
    # Count
    count_query = select(func.count()).select_from(query.subquery())
    total = await db.scalar(count_query) or 0
    
    # Paginate
    offset = (page - 1) * size
    result = await db.execute(query.offset(offset).limit(size))
    comments = result.scalars().all()
    
    return {
        "items": [
            {
                "id": c.id,
                "content_text": c.content_text[:100] + "..." if len(c.content_text) > 100 else c.content_text,
                "is_deleted": c.is_deleted,
                "like_count": c.like_count,
                "user": {
                    "id": c.user.id,
                    "username": c.user.username,
                    "nickname": c.user.nickname,
                } if c.user else None,
                "post": {
                    "id": c.post.id,
                    "title": c.post.title,
                } if c.post else None,
                "created_at": c.created_at,
            }
            for c in comments
        ],
        "total": total,
        "page": page,
        "size": size,
        "pages": (total + size - 1) // size,
    }


@router.delete("/comments/{comment_id}")
async def delete_comment(
    comment_id: int,
    hard: bool = Query(default=False),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    """Delete a comment (soft or hard delete)."""
    result = await db.execute(select(Comment).where(Comment.id == comment_id))
    comment = result.scalar_one_or_none()
    
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    if hard:
        await db.delete(comment)
    else:
        comment.is_deleted = True
    
    await db.commit()
    return {"message": "Comment deleted"}


@router.patch("/comments/{comment_id}/restore")
async def restore_comment(
    comment_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    """Restore a soft-deleted comment."""
    result = await db.execute(select(Comment).where(Comment.id == comment_id))
    comment = result.scalar_one_or_none()
    
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    comment.is_deleted = False
    await db.commit()
    return {"message": "Comment restored"}


# --- Category Management ---

@router.post("/categories")
async def create_category(
    name: str,
    slug: str,
    description: Optional[str] = None,
    parent_id: Optional[int] = None,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    """Create a category."""
    # Check if slug exists
    existing = await db.execute(select(Category).where(Category.slug == slug))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Slug already exists")
    
    category = Category(
        name=name,
        slug=slug,
        description=description,
        parent_id=parent_id,
    )
    db.add(category)
    await db.commit()
    await db.refresh(category)
    
    return {
        "id": category.id,
        "name": category.name,
        "slug": category.slug,
    }


@router.patch("/categories/{category_id}")
async def update_category(
    category_id: int,
    name: Optional[str] = None,
    slug: Optional[str] = None,
    description: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    """Update a category."""
    result = await db.execute(select(Category).where(Category.id == category_id))
    category = result.scalar_one_or_none()
    
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    if name:
        category.name = name
    if slug:
        # Check if new slug is unique
        existing = await db.execute(
            select(Category).where(Category.slug == slug, Category.id != category_id)
        )
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Slug already exists")
        category.slug = slug
    if description is not None:
        category.description = description
    
    await db.commit()
    return {"message": "Category updated"}


@router.delete("/categories/{category_id}")
async def delete_category(
    category_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    """Delete a category."""
    result = await db.execute(select(Category).where(Category.id == category_id))
    category = result.scalar_one_or_none()
    
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    # Check if category has posts
    post_count = await db.scalar(
        select(func.count()).where(Post.category_id == category_id)
    )
    if post_count and post_count > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete category with {post_count} posts"
        )
    
    await db.delete(category)
    await db.commit()
    return {"message": "Category deleted"}


# --- Tag Management ---

@router.get("/tags")
async def list_tags(
    page: int = Query(default=1, ge=1),
    size: int = Query(default=50, ge=1, le=100),
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    """List all tags."""
    query = select(Tag).order_by(Tag.post_count.desc())
    
    if search:
        query = query.where(Tag.name.ilike(f"%{search}%"))
    
    # Count
    count_query = select(func.count()).select_from(query.subquery())
    total = await db.scalar(count_query) or 0
    
    # Paginate
    offset = (page - 1) * size
    result = await db.execute(query.offset(offset).limit(size))
    tags = result.scalars().all()
    
    return {
        "items": [
            {
                "id": t.id,
                "name": t.name,
                "slug": t.slug,
                "post_count": t.post_count,
            }
            for t in tags
        ],
        "total": total,
        "page": page,
        "size": size,
        "pages": (total + size - 1) // size,
    }


@router.patch("/tags/{tag_id}")
async def update_tag(
    tag_id: int,
    name: Optional[str] = None,
    slug: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    """Update a tag."""
    result = await db.execute(select(Tag).where(Tag.id == tag_id))
    tag = result.scalar_one_or_none()
    
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")
    
    if name:
        tag.name = name
    if slug:
        tag.slug = slug
    
    await db.commit()
    return {"message": "Tag updated"}


@router.delete("/tags/{tag_id}")
async def delete_tag(
    tag_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    """Delete a tag."""
    result = await db.execute(select(Tag).where(Tag.id == tag_id))
    tag = result.scalar_one_or_none()
    
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")
    
    await db.delete(tag)
    await db.commit()
    return {"message": "Tag deleted"}

