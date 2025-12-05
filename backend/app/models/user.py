"""
User model definition.
"""
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import String, Text, Boolean, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.post import Post
    from app.models.comment import Comment
    from app.models.interaction import Like, Favorite
    from app.models.notification import Notification
    from typing import List


class User(Base):
    """User model for authentication and profile."""
    
    __tablename__ = "users"
    
    # Primary key
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    
    # Authentication fields
    username: Mapped[str] = mapped_column(
        String(50), 
        unique=True, 
        index=True,
        nullable=False,
    )
    email: Mapped[str] = mapped_column(
        String(100), 
        unique=True, 
        index=True,
        nullable=False,
    )
    password_hash: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )
    
    # Profile fields
    nickname: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
    )
    avatar: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )
    bio: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )
    
    # Role and permissions
    role: Mapped[str] = mapped_column(
        String(20),
        default="user",
        nullable=False,
    )  # admin, user
    
    # Preferences
    language_preference: Mapped[str] = mapped_column(
        String(10),
        default="zh",
        nullable=False,
    )
    
    # Status
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
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
    
    # Relationships
    posts: Mapped[list["Post"]] = relationship(
        back_populates="user",
        lazy="selectin",
    )
    comments: Mapped[list["Comment"]] = relationship(
        back_populates="user",
        lazy="selectin",
    )
    likes: Mapped[list["Like"]] = relationship(
        back_populates="user",
        lazy="selectin",
    )
    favorites: Mapped[list["Favorite"]] = relationship(
        back_populates="user",
        lazy="selectin",
    )
    notifications: Mapped[list["Notification"]] = relationship(
        "Notification",
        foreign_keys="Notification.user_id",
        back_populates="user",
        lazy="selectin",
    )
    
    @property
    def is_admin(self) -> bool:
        """Check if user is an admin."""
        return self.role == "admin"
    
    @property
    def display_name(self) -> str:
        """Get display name (nickname or username)."""
        return self.nickname or self.username

