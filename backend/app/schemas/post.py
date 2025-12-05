"""
Post schemas for request/response validation.
"""
from datetime import datetime
from typing import Optional, Any

from pydantic import BaseModel, Field

from app.schemas.category import CategorySimple
from app.schemas.tag import TagListResponse


class AuthorResponse(BaseModel):
    """Schema for post author info."""
    id: int
    username: str
    nickname: Optional[str] = None
    avatar: Optional[str] = None
    
    model_config = {"from_attributes": True}


class PostBase(BaseModel):
    """Base post schema."""
    title: str = Field(..., min_length=1, max_length=200)
    title_en: Optional[str] = Field(None, max_length=200)
    content: dict = Field(...)  # TipTap JSON
    content_en: Optional[dict] = None
    excerpt: Optional[str] = Field(None, max_length=500)
    cover_image: Optional[str] = Field(None, max_length=255)
    category_id: Optional[int] = None
    tag_ids: list[int] = Field(default_factory=list)


class PostCreate(PostBase):
    """Schema for creating a post."""
    status: str = Field(default="draft", pattern=r"^(draft|published)$")


class PostUpdate(BaseModel):
    """Schema for updating a post."""
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    title_en: Optional[str] = Field(None, max_length=200)
    content: Optional[dict] = None
    content_en: Optional[dict] = None
    excerpt: Optional[str] = Field(None, max_length=500)
    cover_image: Optional[str] = Field(None, max_length=255)
    category_id: Optional[int] = None
    tag_ids: Optional[list[int]] = None
    status: Optional[str] = Field(None, pattern=r"^(draft|published|archived)$")


class PostResponse(BaseModel):
    """Schema for full post response."""
    id: int
    title: str
    title_en: Optional[str] = None
    slug: str
    content: dict
    content_en: Optional[dict] = None
    excerpt: Optional[str] = None
    cover_image: Optional[str] = None
    status: str
    is_featured: bool
    view_count: int
    like_count: int
    comment_count: int
    created_at: datetime
    updated_at: datetime
    published_at: Optional[datetime] = None
    
    user: AuthorResponse
    category: Optional[CategorySimple] = None
    tags: list[TagListResponse] = []
    
    model_config = {"from_attributes": True}


class PostListResponse(BaseModel):
    """Schema for post list item."""
    id: int
    title: str
    title_en: Optional[str] = None
    slug: str
    excerpt: Optional[str] = None
    cover_image: Optional[str] = None
    status: str
    is_featured: bool
    view_count: int
    like_count: int
    comment_count: int
    created_at: datetime
    published_at: Optional[datetime] = None
    
    user: AuthorResponse
    category: Optional[CategorySimple] = None
    tags: list[TagListResponse] = []
    
    model_config = {"from_attributes": True}


class PostPaginatedResponse(BaseModel):
    """Schema for paginated post list."""
    items: list[PostListResponse]
    total: int
    page: int
    size: int
    pages: int


class PostSearchParams(BaseModel):
    """Schema for post search parameters."""
    q: Optional[str] = None
    category_id: Optional[int] = None
    category_slug: Optional[str] = None
    tag_id: Optional[int] = None
    tag_slug: Optional[str] = None
    user_id: Optional[int] = None
    status: Optional[str] = Field(None, pattern=r"^(draft|published|archived)$")
    is_featured: Optional[bool] = None
    page: int = Field(default=1, ge=1)
    size: int = Field(default=10, ge=1, le=100)
    sort_by: str = Field(default="created_at", pattern=r"^(created_at|updated_at|view_count|like_count)$")
    sort_order: str = Field(default="desc", pattern=r"^(asc|desc)$")

