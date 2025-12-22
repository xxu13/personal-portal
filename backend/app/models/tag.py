"""
Tag model definition.
"""
from datetime import datetime
from typing import TYPE_CHECKING, List

from sqlalchemy import String, func, ForeignKey, Table, Column, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.post import Post


# Association table for many-to-many relationship between posts and tags
post_tags = Table(
    "post_tags",
    Base.metadata,
    Column("post_id", Integer, ForeignKey("posts.id", ondelete="CASCADE"), primary_key=True),
    Column("tag_id", Integer, ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True),
)


class Tag(Base):
    """Tag model for labeling posts."""
    
    __tablename__ = "tags"
    
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    
    # Name in Chinese
    name: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )
    
    # Name in English (optional)
    name_en: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
    )
    
    # URL-friendly slug
    slug: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        index=True,
        nullable=False,
    )
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        default=func.now(),
        nullable=False,
    )
    
    # Relationships
    posts: Mapped[List["Post"]] = relationship(
        secondary=post_tags,
        back_populates="tags",
        lazy="selectin",
    )
    
    @property
    def post_count(self) -> int:
        """Get the number of posts with this tag."""
        return len(self.posts) if self.posts else 0



