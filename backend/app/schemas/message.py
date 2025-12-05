"""
Message schemas for request/response validation.
"""
from datetime import datetime
from typing import Optional, List

from pydantic import BaseModel, Field


class UserBrief(BaseModel):
    """Brief user info for messages."""
    id: int
    username: str
    nickname: Optional[str] = None
    avatar: Optional[str] = None
    
    model_config = {"from_attributes": True}


class MessageCreate(BaseModel):
    """Schema for creating a message."""
    recipient_id: int
    content: str = Field(..., min_length=1, max_length=5000)


class MessageResponse(BaseModel):
    """Schema for message response."""
    id: int
    conversation_id: int
    sender_id: int
    content: str
    is_read: bool
    created_at: datetime
    read_at: Optional[datetime] = None
    sender: UserBrief
    
    model_config = {"from_attributes": True}


class ConversationResponse(BaseModel):
    """Schema for conversation response."""
    id: int
    other_user: UserBrief
    last_message_at: datetime
    last_message_preview: Optional[str] = None
    unread_count: int = 0
    created_at: datetime
    
    model_config = {"from_attributes": True}


class ConversationDetailResponse(BaseModel):
    """Schema for conversation with messages."""
    id: int
    other_user: UserBrief
    messages: List[MessageResponse] = []
    
    model_config = {"from_attributes": True}


class ConversationListResponse(BaseModel):
    """Schema for paginated conversation list."""
    items: List[ConversationResponse]
    total: int
    page: int
    size: int
    pages: int


class MessageListResponse(BaseModel):
    """Schema for paginated message list."""
    items: List[MessageResponse]
    total: int
    page: int
    size: int
    pages: int
    has_more: bool = False


class UnreadCountResponse(BaseModel):
    """Schema for unread message count."""
    count: int

