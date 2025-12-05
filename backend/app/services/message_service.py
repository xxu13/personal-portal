"""
Message service for business logic.
"""
from datetime import datetime
from typing import Optional, Tuple, List

from sqlalchemy import select, func, or_, and_, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.message import Conversation, Message
from app.models.user import User


class MessageService:
    """Service class for message operations."""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def get_or_create_conversation(
        self,
        user1_id: int,
        user2_id: int,
    ) -> Conversation:
        """Get or create a conversation between two users."""
        # Ensure user1_id < user2_id for consistency
        if user1_id > user2_id:
            user1_id, user2_id = user2_id, user1_id
        
        # Try to find existing conversation
        result = await self.db.execute(
            select(Conversation)
            .options(
                selectinload(Conversation.user1),
                selectinload(Conversation.user2),
            )
            .where(
                Conversation.user1_id == user1_id,
                Conversation.user2_id == user2_id,
            )
        )
        conversation = result.scalar_one_or_none()
        
        if conversation:
            return conversation
        
        # Create new conversation
        conversation = Conversation(
            user1_id=user1_id,
            user2_id=user2_id,
        )
        self.db.add(conversation)
        await self.db.commit()
        await self.db.refresh(conversation)
        
        # Reload with users
        result = await self.db.execute(
            select(Conversation)
            .options(
                selectinload(Conversation.user1),
                selectinload(Conversation.user2),
            )
            .where(Conversation.id == conversation.id)
        )
        return result.scalar_one()
    
    async def get_conversations(
        self,
        user_id: int,
        page: int = 1,
        size: int = 20,
    ) -> Tuple[List[Conversation], int, dict]:
        """Get user's conversations with unread counts."""
        # Get conversations where user is participant
        query = (
            select(Conversation)
            .options(
                selectinload(Conversation.user1),
                selectinload(Conversation.user2),
            )
            .where(
                or_(
                    Conversation.user1_id == user_id,
                    Conversation.user2_id == user_id,
                )
            )
            .order_by(Conversation.last_message_at.desc())
        )
        
        # Count total
        count_query = select(func.count()).select_from(query.subquery())
        total = await self.db.scalar(count_query) or 0
        
        # Paginate
        offset = (page - 1) * size
        result = await self.db.execute(query.offset(offset).limit(size))
        conversations = list(result.scalars().all())
        
        # Get unread counts for each conversation
        unread_counts = {}
        for conv in conversations:
            count_result = await self.db.execute(
                select(func.count()).where(
                    Message.conversation_id == conv.id,
                    Message.sender_id != user_id,
                    Message.is_read == False,
                )
            )
            unread_counts[conv.id] = count_result.scalar() or 0
        
        return conversations, total, unread_counts
    
    async def get_messages(
        self,
        conversation_id: int,
        user_id: int,
        page: int = 1,
        size: int = 50,
    ) -> Tuple[List[Message], int]:
        """Get messages in a conversation."""
        # Verify user is participant
        conv_result = await self.db.execute(
            select(Conversation).where(Conversation.id == conversation_id)
        )
        conv = conv_result.scalar_one_or_none()
        if not conv or (conv.user1_id != user_id and conv.user2_id != user_id):
            return [], 0
        
        # Count total
        count_result = await self.db.execute(
            select(func.count()).where(Message.conversation_id == conversation_id)
        )
        total = count_result.scalar() or 0
        
        # Get messages
        offset = (page - 1) * size
        result = await self.db.execute(
            select(Message)
            .options(selectinload(Message.sender))
            .where(Message.conversation_id == conversation_id)
            .order_by(Message.created_at.desc())
            .offset(offset)
            .limit(size)
        )
        messages = list(result.scalars().all())
        
        return messages, total
    
    async def send_message(
        self,
        sender_id: int,
        recipient_id: int,
        content: str,
    ) -> Message:
        """Send a message."""
        # Get or create conversation
        conversation = await self.get_or_create_conversation(sender_id, recipient_id)
        
        # Create message
        message = Message(
            conversation_id=conversation.id,
            sender_id=sender_id,
            content=content,
        )
        self.db.add(message)
        
        # Update conversation
        conversation.last_message_at = datetime.utcnow()
        conversation.last_message_preview = content[:100] if len(content) > 100 else content
        
        await self.db.commit()
        await self.db.refresh(message)
        
        # Reload with sender
        result = await self.db.execute(
            select(Message)
            .options(selectinload(Message.sender))
            .where(Message.id == message.id)
        )
        return result.scalar_one()
    
    async def mark_as_read(
        self,
        conversation_id: int,
        user_id: int,
    ) -> int:
        """Mark all messages in conversation as read for user."""
        result = await self.db.execute(
            update(Message)
            .where(
                Message.conversation_id == conversation_id,
                Message.sender_id != user_id,
                Message.is_read == False,
            )
            .values(is_read=True, read_at=datetime.utcnow())
        )
        await self.db.commit()
        return result.rowcount
    
    async def get_unread_count(self, user_id: int) -> int:
        """Get total unread message count for user."""
        # Get all conversations for user
        conv_result = await self.db.execute(
            select(Conversation.id).where(
                or_(
                    Conversation.user1_id == user_id,
                    Conversation.user2_id == user_id,
                )
            )
        )
        conv_ids = [c for c in conv_result.scalars().all()]
        
        if not conv_ids:
            return 0
        
        # Count unread messages
        count_result = await self.db.execute(
            select(func.count()).where(
                Message.conversation_id.in_(conv_ids),
                Message.sender_id != user_id,
                Message.is_read == False,
            )
        )
        return count_result.scalar() or 0

