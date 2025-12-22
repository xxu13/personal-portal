"""
Notification model for user notifications.
"""
from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import ForeignKey, String, Text, Boolean, JSON, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.user import User


class Notification(Base):
    """
    Notification model for various user notifications.
    
    Types:
    - comment: Someone commented on your post
    - reply: Someone replied to your comment
    - like_post: Someone liked your post
    - like_comment: Someone liked your comment
    - follow: Someone followed you
    - mention: Someone mentioned you
    - system: System notification
    """
    __tablename__ = "notifications"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    
    # Recipient
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    
    # Notification type
    type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        index=True,
    )
    
    # Title and content
    title: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
    )
    content: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
    )
    
    # Related entity (for linking)
    entity_type: Mapped[Optional[str]] = mapped_column(
        String(50),
        nullable=True,
    )  # post, comment, user
    entity_id: Mapped[Optional[int]] = mapped_column(
        nullable=True,
    )
    
    # Actor (who triggered the notification)
    actor_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    
    # Extra data (JSON)
    data: Mapped[Optional[dict]] = mapped_column(
        JSON,
        nullable=True,
    )
    
    # Read status
    is_read: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
        index=True,
    )
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        default=func.now(),
        nullable=False,
    )
    read_at: Mapped[Optional[datetime]] = mapped_column(
        nullable=True,
    )
    
    # Relationships
    user: Mapped["User"] = relationship(
        "User",
        foreign_keys=[user_id],
        back_populates="notifications",
    )
    actor: Mapped[Optional["User"]] = relationship(
        "User",
        foreign_keys=[actor_id],
        lazy="joined",
    )
    
    def __repr__(self) -> str:
        return f"<Notification(id={self.id}, type={self.type}, user={self.user_id})>"


