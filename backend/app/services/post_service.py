"""
Post service for business logic.
"""
import re
from datetime import datetime
from typing import Optional, Tuple
from slugify import slugify as python_slugify

from sqlalchemy import select, func, or_, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.post import Post
from app.models.category import Category
from app.models.tag import Tag
from app.schemas.post import PostCreate, PostUpdate, PostSearchParams


def generate_slug(title: str) -> str:
    """Generate URL-friendly slug from title."""
    # Try python-slugify for better CJK support
    try:
        slug = python_slugify(title, lowercase=True, max_length=100)
        if slug:
            return slug
    except:
        pass
    
    # Fallback: simple slug generation
    slug = re.sub(r'[^\w\s-]', '', title.lower())
    slug = re.sub(r'[-\s]+', '-', slug).strip('-')
    return slug[:100] if slug else f"post-{datetime.now().timestamp()}"


class PostService:
    """Service class for post operations."""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def get_by_id(self, post_id: int) -> Optional[Post]:
        """Get post by ID with relationships."""
        result = await self.db.execute(
            select(Post)
            .options(
                selectinload(Post.user),
                selectinload(Post.category),
                selectinload(Post.tags),
            )
            .where(Post.id == post_id)
        )
        return result.scalar_one_or_none()
    
    async def get_by_slug(self, slug: str) -> Optional[Post]:
        """Get post by slug with relationships."""
        result = await self.db.execute(
            select(Post)
            .options(
                selectinload(Post.user),
                selectinload(Post.category),
                selectinload(Post.tags),
            )
            .where(Post.slug == slug)
        )
        return result.scalar_one_or_none()
    
    async def get_list(
        self,
        params: PostSearchParams,
        published_only: bool = True,
    ) -> Tuple[list[Post], int]:
        """Get paginated post list with filters."""
        # Base query
        query = select(Post).options(
            selectinload(Post.user),
            selectinload(Post.category),
            selectinload(Post.tags),
        )
        
        # Apply filters
        conditions = []
        
        if published_only:
            conditions.append(Post.status == "published")
        elif params.status:
            conditions.append(Post.status == params.status)
        
        if params.q:
            search_term = f"%{params.q}%"
            conditions.append(
                or_(
                    Post.title.ilike(search_term),
                    Post.title_en.ilike(search_term),
                    Post.excerpt.ilike(search_term),
                )
            )
        
        if params.category_id:
            conditions.append(Post.category_id == params.category_id)
        
        if params.user_id:
            conditions.append(Post.user_id == params.user_id)
        
        if params.is_featured is not None:
            conditions.append(Post.is_featured == params.is_featured)
        
        if params.tag_id:
            query = query.join(Post.tags).where(Tag.id == params.tag_id)
        
        if conditions:
            query = query.where(and_(*conditions))
        
        # Count total
        count_query = select(func.count()).select_from(
            query.with_only_columns(Post.id).subquery()
        )
        total = await self.db.scalar(count_query) or 0
        
        # Apply sorting
        sort_column = getattr(Post, params.sort_by, Post.created_at)
        if params.sort_order == "desc":
            query = query.order_by(sort_column.desc())
        else:
            query = query.order_by(sort_column.asc())
        
        # Apply pagination
        offset = (params.page - 1) * params.size
        query = query.offset(offset).limit(params.size)
        
        # Execute
        result = await self.db.execute(query)
        posts = list(result.scalars().all())
        
        return posts, total
    
    async def create(
        self,
        user_id: int,
        post_create: PostCreate,
    ) -> Post:
        """Create a new post."""
        # Generate unique slug
        base_slug = generate_slug(post_create.title)
        slug = base_slug
        counter = 1
        while await self.get_by_slug(slug):
            slug = f"{base_slug}-{counter}"
            counter += 1
        
        # Create post
        post = Post(
            title=post_create.title,
            title_en=post_create.title_en,
            slug=slug,
            content=post_create.content,
            content_en=post_create.content_en,
            excerpt=post_create.excerpt,
            cover_image=post_create.cover_image,
            user_id=user_id,
            category_id=post_create.category_id,
            status=post_create.status,
        )
        
        # Set published_at if publishing
        if post.status == "published":
            post.published_at = datetime.utcnow()
        
        # Add tags
        if post_create.tag_ids:
            tags_result = await self.db.execute(
                select(Tag).where(Tag.id.in_(post_create.tag_ids))
            )
            post.tags = list(tags_result.scalars().all())
        
        self.db.add(post)
        await self.db.commit()
        await self.db.refresh(post)
        
        # Reload with relationships
        return await self.get_by_id(post.id)
    
    async def update(
        self,
        post: Post,
        post_update: PostUpdate,
    ) -> Post:
        """Update a post."""
        update_data = post_update.model_dump(exclude_unset=True)
        
        # Handle tag_ids separately
        tag_ids = update_data.pop("tag_ids", None)
        
        # Update fields
        for field, value in update_data.items():
            setattr(post, field, value)
        
        # Handle status change to published
        if post_update.status == "published" and not post.published_at:
            post.published_at = datetime.utcnow()
        
        # Update tags
        if tag_ids is not None:
            tags_result = await self.db.execute(
                select(Tag).where(Tag.id.in_(tag_ids))
            )
            post.tags = list(tags_result.scalars().all())
        
        await self.db.commit()
        await self.db.refresh(post)
        
        return await self.get_by_id(post.id)
    
    async def delete(self, post: Post) -> None:
        """Delete a post."""
        await self.db.delete(post)
        await self.db.commit()
    
    async def increment_view_count(self, post: Post) -> Post:
        """Increment post view count."""
        post.view_count += 1
        await self.db.commit()
        await self.db.refresh(post)
        return post
    
    async def get_featured(self, limit: int = 5) -> list[Post]:
        """Get featured posts."""
        result = await self.db.execute(
            select(Post)
            .options(
                selectinload(Post.user),
                selectinload(Post.category),
                selectinload(Post.tags),
            )
            .where(Post.status == "published", Post.is_featured == True)
            .order_by(Post.published_at.desc())
            .limit(limit)
        )
        return list(result.scalars().all())
    
    async def set_featured(self, post: Post, is_featured: bool) -> Post:
        """Set post featured status."""
        post.is_featured = is_featured
        await self.db.commit()
        await self.db.refresh(post)
        return post


