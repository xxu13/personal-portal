"""
Category model definition.
"""
from datetime import datetime
from typing import TYPE_CHECKING, List

from sqlalchemy import String, Text, Integer, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.post import Post


class Category(Base):
    """Category model for organizing posts."""
    
    __tablename__ = "categories"
    
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    
    # Name in Chinese
    name: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )
    
    # Name in English
    name_en: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )
    
    # URL-friendly slug
    slug: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        index=True,
        nullable=False,
    )
    
    # Icon name (for display)
    icon: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
    )
    
    # Sort order
    sort_order: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )
    
    # Description
    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        default=func.now(),
        nullable=False,
    )
    
    # Relationships
    posts: Mapped[List["Post"]] = relationship(
        back_populates="category",
        lazy="selectin",
    )
    
    @property
    def post_count(self) -> int:
        """Get the number of posts in this category."""
        return len(self.posts) if self.posts else 0


