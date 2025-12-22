"""
Tag schemas for request/response validation.
"""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class TagBase(BaseModel):
    """Base tag schema."""
    name: str = Field(..., min_length=1, max_length=50)
    name_en: Optional[str] = Field(None, max_length=50)
    slug: str = Field(..., min_length=1, max_length=50, pattern=r"^[a-z0-9-]+$")


class TagCreate(TagBase):
    """Schema for creating a tag."""
    pass


class TagUpdate(BaseModel):
    """Schema for updating a tag."""
    name: Optional[str] = Field(None, min_length=1, max_length=50)
    name_en: Optional[str] = Field(None, max_length=50)
    slug: Optional[str] = Field(None, min_length=1, max_length=50, pattern=r"^[a-z0-9-]+$")


class TagResponse(TagBase):
    """Schema for tag response."""
    id: int
    post_count: int = 0
    created_at: datetime
    
    model_config = {"from_attributes": True}


class TagListResponse(BaseModel):
    """Schema for tag list response."""
    id: int
    name: str
    name_en: Optional[str] = None
    slug: str
    post_count: int = 0
    
    model_config = {"from_attributes": True}


class TagMerge(BaseModel):
    """Schema for merging tags."""
    source_tag_ids: list[int] = Field(..., min_length=1)
    target_tag_id: int



