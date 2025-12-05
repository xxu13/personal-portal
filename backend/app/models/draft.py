"""
Draft model definition for auto-saving.
"""
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import String, Integer, JSON, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.user import User


class Draft(Base):
    """Draft model for auto-saving posts during editing."""
    
    __tablename__ = "drafts"
    
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    
    # Owner
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    
    # Associated post (if editing existing post)
    post_id: Mapped[int | None] = mapped_column(
        ForeignKey("posts.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    
    # Draft content
    title: Mapped[str | None] = mapped_column(
        String(200),
        nullable=True,
    )
    
    content: Mapped[dict | None] = mapped_column(
        JSON,
        nullable=True,
    )
    
    excerpt: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
    )
    
    cover_image: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )
    
    # Category ID (stored as integer, not foreign key for flexibility)
    category_id: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )
    
    # Tag IDs (stored as JSON array)
    tag_ids: Mapped[list | None] = mapped_column(
        JSON,
        nullable=True,
    )
    
    # Timestamps
    auto_saved_at: Mapped[datetime] = mapped_column(
        default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        default=func.now(),
        nullable=False,
    )
    
    # Relationships
    user: Mapped["User"] = relationship(lazy="selectin")


