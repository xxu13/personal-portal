"""
Comment schemas for request/response validation.
"""
from datetime import datetime
from typing import Optional, List, ForwardRef

from pydantic import BaseModel, Field


class CommentAuthor(BaseModel):
    """Schema for comment author info."""
    id: int
    username: str
    nickname: Optional[str] = None
    avatar: Optional[str] = None
    
    model_config = {"from_attributes": True}


class CommentBase(BaseModel):
    """Base comment schema."""
    content: dict = Field(..., description="TipTap JSON content")


class CommentCreate(CommentBase):
    """Schema for creating a comment."""
    post_id: int
    parent_id: Optional[int] = None


class CommentUpdate(BaseModel):
    """Schema for updating a comment."""
    content: dict


class CommentResponse(BaseModel):
    """Schema for comment response (without nested replies)."""
    id: int
    content: dict
    content_text: Optional[str] = None
    post_id: int
    user_id: int
    parent_id: Optional[int] = None
    depth: int
    path: str
    like_count: int
    reply_count: int
    is_deleted: bool
    created_at: datetime
    updated_at: datetime
    
    user: CommentAuthor
    
    model_config = {"from_attributes": True}


# Forward reference for nested comments
CommentWithRepliesRef = ForwardRef('CommentWithReplies')


class CommentWithReplies(BaseModel):
    """Schema for comment with nested replies."""
    id: int
    content: dict
    content_text: Optional[str] = None
    post_id: int
    user_id: int
    parent_id: Optional[int] = None
    depth: int
    path: str
    like_count: int
    reply_count: int
    is_deleted: bool
    created_at: datetime
    updated_at: datetime
    
    user: CommentAuthor
    replies: List['CommentWithReplies'] = []
    
    model_config = {"from_attributes": True}


# Update forward references
CommentWithReplies.model_rebuild()


class CommentTreeResponse(BaseModel):
    """Schema for comment tree response."""
    comments: List[CommentWithReplies]
    total: int


class CommentListResponse(BaseModel):
    """Schema for flat comment list with pagination."""
    items: List[CommentResponse]
    total: int
    page: int
    size: int
    pages: int

