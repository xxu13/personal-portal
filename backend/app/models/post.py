"""
Post model definition.
"""
from datetime import datetime
from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import String, Text, Integer, Boolean, JSON, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.tag import post_tags

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.category import Category
    from app.models.tag import Tag
    from app.models.comment import Comment
    from app.models.interaction import Favorite


class Post(Base):
    """Post model for articles/blog posts."""
    
    __tablename__ = "posts"
    
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    
    # Title
    title: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
    )
    
    # Title in English (optional)
    title_en: Mapped[str | None] = mapped_column(
        String(200),
        nullable=True,
    )
    
    # URL-friendly slug
    slug: Mapped[str] = mapped_column(
        String(200),
        unique=True,
        index=True,
        nullable=False,
    )
    
    # Content (TipTap JSON format)
    content: Mapped[dict] = mapped_column(
        JSON,
        nullable=False,
    )
    
    # Content in English (optional)
    content_en: Mapped[dict | None] = mapped_column(
        JSON,
        nullable=True,
    )
    
    # Excerpt/summary
    excerpt: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
    )
    
    # Cover image URL
    cover_image: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )
    
    # Author
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    
    # Category
    category_id: Mapped[int | None] = mapped_column(
        ForeignKey("categories.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    
    # Status: draft, published, archived
    status: Mapped[str] = mapped_column(
        String(20),
        default="draft",
        nullable=False,
        index=True,
    )
    
    # Featured post flag
    is_featured: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )
    
    # View count
    view_count: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )
    
    # Like count (denormalized for performance)
    like_count: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )
    
    # Comment count (denormalized for performance)
    comment_count: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )
    
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
    published_at: Mapped[datetime | None] = mapped_column(
        nullable=True,
    )
    
    # Relationships
    user: Mapped["User"] = relationship(
        back_populates="posts",
        lazy="selectin",
    )
    category: Mapped[Optional["Category"]] = relationship(
        back_populates="posts",
        lazy="selectin",
    )
    tags: Mapped[List["Tag"]] = relationship(
        secondary=post_tags,
        back_populates="posts",
        lazy="selectin",
    )
    comments: Mapped[List["Comment"]] = relationship(
        back_populates="post",
        lazy="selectin",
        cascade="all, delete-orphan",
    )
    favorites: Mapped[List["Favorite"]] = relationship(
        back_populates="post",
        lazy="selectin",
        cascade="all, delete-orphan",
    )
    
    @property
    def is_published(self) -> bool:
        """Check if post is published."""
        return self.status == "published"
    
    @property
    def is_draft(self) -> bool:
        """Check if post is a draft."""
        return self.status == "draft"


