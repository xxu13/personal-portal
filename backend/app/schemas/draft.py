"""
Draft schemas for request/response validation.
"""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class DraftBase(BaseModel):
    """Base draft schema."""
    title: Optional[str] = Field(None, max_length=200)
    content: Optional[dict] = None
    excerpt: Optional[str] = Field(None, max_length=500)
    cover_image: Optional[str] = Field(None, max_length=255)
    category_id: Optional[int] = None
    tag_ids: Optional[list[int]] = None


class DraftCreate(DraftBase):
    """Schema for creating a draft."""
    post_id: Optional[int] = None  # If editing existing post


class DraftUpdate(DraftBase):
    """Schema for updating a draft."""
    pass


class DraftResponse(DraftBase):
    """Schema for draft response."""
    id: int
    user_id: int
    post_id: Optional[int] = None
    auto_saved_at: datetime
    created_at: datetime
    
    model_config = {"from_attributes": True}


