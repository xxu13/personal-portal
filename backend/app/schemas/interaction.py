"""
Interaction schemas for likes and favorites.
"""
from datetime import datetime
from typing import Optional, Literal

from pydantic import BaseModel, Field


# ============ Like Schemas ============

class LikeCreate(BaseModel):
    """Schema for creating a like."""
    target_type: Literal["post", "comment"]
    target_id: int


class LikeResponse(BaseModel):
    """Schema for like response."""
    id: int
    user_id: int
    target_type: str
    target_id: int
    created_at: datetime
    
    model_config = {"from_attributes": True}


class LikeStatusResponse(BaseModel):
    """Schema for checking if user liked something."""
    liked: bool
    like_id: Optional[int] = None


class LikeCountResponse(BaseModel):
    """Schema for like count."""
    count: int
    liked: bool = False


# ============ Favorite Schemas ============

class FavoriteCreate(BaseModel):
    """Schema for creating a favorite."""
    post_id: int
    note: Optional[str] = Field(None, max_length=255)


class FavoriteUpdate(BaseModel):
    """Schema for updating a favorite."""
    note: Optional[str] = Field(None, max_length=255)


class FavoritePostInfo(BaseModel):
    """Schema for post info in favorites."""
    id: int
    title: str
    slug: str
    excerpt: Optional[str] = None
    cover_image: Optional[str] = None
    
    model_config = {"from_attributes": True}


class FavoriteResponse(BaseModel):
    """Schema for favorite response."""
    id: int
    user_id: int
    post_id: int
    note: Optional[str] = None
    created_at: datetime
    post: Optional[FavoritePostInfo] = None
    
    model_config = {"from_attributes": True}


class FavoriteStatusResponse(BaseModel):
    """Schema for checking if user favorited something."""
    favorited: bool
    favorite_id: Optional[int] = None


class FavoriteListResponse(BaseModel):
    """Schema for paginated favorites list."""
    items: list[FavoriteResponse]
    total: int
    page: int
    size: int
    pages: int


