"""
Category schemas for request/response validation.
"""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class CategoryBase(BaseModel):
    """Base category schema."""
    name: str = Field(..., min_length=1, max_length=50)
    name_en: str = Field(..., min_length=1, max_length=50)
    slug: str = Field(..., min_length=1, max_length=50, pattern=r"^[a-z0-9-]+$")
    icon: Optional[str] = Field(None, max_length=50)
    description: Optional[str] = Field(None, max_length=500)
    sort_order: int = Field(default=0)


class CategoryCreate(CategoryBase):
    """Schema for creating a category."""
    pass


class CategoryUpdate(BaseModel):
    """Schema for updating a category."""
    name: Optional[str] = Field(None, min_length=1, max_length=50)
    name_en: Optional[str] = Field(None, min_length=1, max_length=50)
    slug: Optional[str] = Field(None, min_length=1, max_length=50, pattern=r"^[a-z0-9-]+$")
    icon: Optional[str] = Field(None, max_length=50)
    description: Optional[str] = Field(None, max_length=500)
    sort_order: Optional[int] = None


class CategoryResponse(CategoryBase):
    """Schema for category response."""
    id: int
    post_count: int = 0
    created_at: datetime
    
    model_config = {"from_attributes": True}


class CategoryListResponse(BaseModel):
    """Schema for category list response."""
    id: int
    name: str
    name_en: str
    slug: str
    icon: Optional[str] = None
    post_count: int = 0
    
    model_config = {"from_attributes": True}


class CategorySimple(BaseModel):
    """Simplified category schema for embedding in post responses."""
    id: int
    name: str
    name_en: str
    slug: str
    icon: Optional[str] = None
    
    model_config = {"from_attributes": True}


