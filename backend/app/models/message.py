"""
Message model for private messaging.
"""
from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import ForeignKey, String, Text, Boolean, func, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.user import User


class Conversation(Base):
    """
    Conversation model to group messages between two users.
    """
    __tablename__ = "conversations"
    
    __table_args__ = (
        Index('ix_conversation_users', 'user1_id', 'user2_id'),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    
    # Participants (user1_id < user2_id to ensure uniqueness)
    user1_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    user2_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    
    # Last message info for sorting
    last_message_at: Mapped[datetime] = mapped_column(
        default=func.now(),
        nullable=False,
    )
    last_message_preview: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True,
    )
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        default=func.now(),
        nullable=False,
    )
    
    # Relationships
    user1: Mapped["User"] = relationship(
        "User",
        foreign_keys=[user1_id],
        lazy="joined",
    )
    user2: Mapped["User"] = relationship(
        "User",
        foreign_keys=[user2_id],
        lazy="joined",
    )
    messages: Mapped[list["Message"]] = relationship(
        "Message",
        back_populates="conversation",
        lazy="selectin",
        order_by="Message.created_at.desc()",
    )
    
    def get_other_user(self, user_id: int) -> "User":
        """Get the other participant in the conversation."""
        return self.user2 if self.user1_id == user_id else self.user1
    
    def __repr__(self) -> str:
        return f"<Conversation(id={self.id}, users={self.user1_id},{self.user2_id})>"


class Message(Base):
    """
    Message model for private messages.
    """
    __tablename__ = "messages"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    
    # Conversation
    conversation_id: Mapped[int] = mapped_column(
        ForeignKey("conversations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    
    # Sender
    sender_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    
    # Content
    content: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )
    
    # Read status
    is_read: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
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
    conversation: Mapped["Conversation"] = relationship(
        "Conversation",
        back_populates="messages",
    )
    sender: Mapped["User"] = relationship(
        "User",
        lazy="joined",
    )
    
    def __repr__(self) -> str:
        return f"<Message(id={self.id}, sender={self.sender_id})>"


