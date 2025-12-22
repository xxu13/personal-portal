"""
Comment model for nested comments.
"""
from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import ForeignKey, String, JSON, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.post import Post


class Comment(Base):
    """
    Comment model with support for nested replies.
    Uses path-based hierarchy for efficient tree queries.
    """
    __tablename__ = "comments"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    
    # Content - supports rich text JSON from TipTap
    content: Mapped[dict] = mapped_column(JSON, nullable=False)
    
    # Plain text version for search/preview
    content_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Foreign keys
    post_id: Mapped[int] = mapped_column(
        ForeignKey("posts.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    parent_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("comments.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    
    # Hierarchy tracking
    depth: Mapped[int] = mapped_column(default=0)
    path: Mapped[str] = mapped_column(
        String(255),
        default="",
        index=True,
        comment="Materialized path like '1.3.7' for tree queries",
    )
    
    # Stats
    like_count: Mapped[int] = mapped_column(default=0)
    reply_count: Mapped[int] = mapped_column(default=0)
    
    # Soft delete
    is_deleted: Mapped[bool] = mapped_column(default=False)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
    
    # Relationships
    user: Mapped["User"] = relationship(
        "User",
        back_populates="comments",
        lazy="joined",
    )
    post: Mapped["Post"] = relationship(
        "Post",
        back_populates="comments",
    )
    parent: Mapped[Optional["Comment"]] = relationship(
        "Comment",
        remote_side=[id],
        back_populates="replies",
    )
    replies: Mapped[list["Comment"]] = relationship(
        "Comment",
        back_populates="parent",
        lazy="selectin",
    )
    
    def __repr__(self) -> str:
        return f"<Comment(id={self.id}, post_id={self.post_id}, depth={self.depth})>"


