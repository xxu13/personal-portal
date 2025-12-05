"""
Notification schemas for request/response validation.
"""
from datetime import datetime
from typing import Optional, List, Literal

from pydantic import BaseModel


class ActorBrief(BaseModel):
    """Brief actor info for notifications."""
    id: int
    username: str
    nickname: Optional[str] = None
    avatar: Optional[str] = None
    
    model_config = {"from_attributes": True}


class NotificationCreate(BaseModel):
    """Schema for creating a notification (internal use)."""
    user_id: int
    type: str
    title: str
    content: Optional[str] = None
    entity_type: Optional[str] = None
    entity_id: Optional[int] = None
    actor_id: Optional[int] = None
    data: Optional[dict] = None


class NotificationResponse(BaseModel):
    """Schema for notification response."""
    id: int
    type: str
    title: str
    content: Optional[str] = None
    entity_type: Optional[str] = None
    entity_id: Optional[int] = None
    is_read: bool
    created_at: datetime
    read_at: Optional[datetime] = None
    actor: Optional[ActorBrief] = None
    data: Optional[dict] = None
    
    model_config = {"from_attributes": True}


class NotificationListResponse(BaseModel):
    """Schema for paginated notification list."""
    items: List[NotificationResponse]
    total: int
    page: int
    size: int
    pages: int
    unread_count: int = 0


class UnreadCountResponse(BaseModel):
    """Schema for unread notification count."""
    count: int


class MarkReadRequest(BaseModel):
    """Schema for marking notifications as read."""
    notification_ids: Optional[List[int]] = None  # None means mark all


class NotificationSettings(BaseModel):
    """Schema for notification settings."""
    comment: bool = True
    reply: bool = True
    like_post: bool = True
    like_comment: bool = True
    follow: bool = True
    mention: bool = True
    system: bool = True

