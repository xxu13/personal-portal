"""
Interaction models for likes and favorites.
"""
from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import ForeignKey, String, UniqueConstraint, func, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.post import Post
    from app.models.comment import Comment


class Like(Base):
    """
    Like model for posts and comments.
    Uses target_type to distinguish between post likes and comment likes.
    """
    __tablename__ = "likes"
    
    __table_args__ = (
        UniqueConstraint('user_id', 'target_type', 'target_id', name='uq_like_user_target'),
        Index('ix_like_target', 'target_type', 'target_id'),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    
    # User who liked
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    
    # Target type: 'post' or 'comment'
    target_type: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
    )
    
    # Target ID (post_id or comment_id)
    target_id: Mapped[int] = mapped_column(
        nullable=False,
    )
    
    # Timestamp
    created_at: Mapped[datetime] = mapped_column(
        default=func.now(),
        nullable=False,
    )
    
    # Relationships
    user: Mapped["User"] = relationship(
        "User",
        back_populates="likes",
        lazy="joined",
    )
    
    def __repr__(self) -> str:
        return f"<Like(id={self.id}, user_id={self.user_id}, target={self.target_type}:{self.target_id})>"


class Favorite(Base):
    """
    Favorite model for bookmarking posts.
    """
    __tablename__ = "favorites"
    
    __table_args__ = (
        UniqueConstraint('user_id', 'post_id', name='uq_favorite_user_post'),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    
    # User who favorited
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    
    # Post that was favorited
    post_id: Mapped[int] = mapped_column(
        ForeignKey("posts.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    
    # Optional note/tag for organization
    note: Mapped[Optional[str]] = mapped_column(
        String(255),
        nullable=True,
    )
    
    # Timestamp
    created_at: Mapped[datetime] = mapped_column(
        default=func.now(),
        nullable=False,
    )
    
    # Relationships
    user: Mapped["User"] = relationship(
        "User",
        back_populates="favorites",
        lazy="joined",
    )
    post: Mapped["Post"] = relationship(
        "Post",
        back_populates="favorites",
        lazy="joined",
    )
    
    def __repr__(self) -> str:
        return f"<Favorite(id={self.id}, user_id={self.user_id}, post_id={self.post_id})>"


