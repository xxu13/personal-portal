"""
Message API endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_db
from app.models.user import User
from app.schemas.message import (
    MessageCreate,
    MessageResponse,
    ConversationResponse,
    ConversationListResponse,
    MessageListResponse,
    UnreadCountResponse,
    UserBrief,
)
from app.services.message_service import MessageService
from app.api.v1.users import get_current_user

router = APIRouter(prefix="/messages", tags=["Messages"])


@router.get("/conversations", response_model=ConversationListResponse)
async def get_conversations(
    page: int = Query(default=1, ge=1),
    size: int = Query(default=20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get current user's conversations.
    """
    message_service = MessageService(db)
    conversations, total, unread_counts = await message_service.get_conversations(
        current_user.id, page, size
    )
    
    pages = (total + size - 1) // size
    
    items = []
    for conv in conversations:
        other_user = conv.get_other_user(current_user.id)
        items.append(ConversationResponse(
            id=conv.id,
            other_user=UserBrief.model_validate(other_user),
            last_message_at=conv.last_message_at,
            last_message_preview=conv.last_message_preview,
            unread_count=unread_counts.get(conv.id, 0),
            created_at=conv.created_at,
        ))
    
    return ConversationListResponse(
        items=items,
        total=total,
        page=page,
        size=size,
        pages=pages,
    )


@router.get("/conversations/{conversation_id}", response_model=MessageListResponse)
async def get_conversation_messages(
    conversation_id: int,
    page: int = Query(default=1, ge=1),
    size: int = Query(default=50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get messages in a conversation.
    """
    message_service = MessageService(db)
    messages, total = await message_service.get_messages(
        conversation_id, current_user.id, page, size
    )
    
    if not messages and total == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found or access denied",
        )
    
    pages = (total + size - 1) // size
    
    return MessageListResponse(
        items=[MessageResponse.model_validate(m) for m in messages],
        total=total,
        page=page,
        size=size,
        pages=pages,
        has_more=page < pages,
    )


@router.post("", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
async def send_message(
    message_create: MessageCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Send a message to another user.
    """
    if message_create.recipient_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot send message to yourself",
        )
    
    message_service = MessageService(db)
    message = await message_service.send_message(
        current_user.id,
        message_create.recipient_id,
        message_create.content,
    )
    
    return MessageResponse.model_validate(message)


@router.post("/conversations/{conversation_id}/read")
async def mark_conversation_read(
    conversation_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Mark all messages in conversation as read.
    """
    message_service = MessageService(db)
    count = await message_service.mark_as_read(conversation_id, current_user.id)
    return {"marked_read": count}


@router.get("/unread-count", response_model=UnreadCountResponse)
async def get_unread_count(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get unread message count.
    """
    message_service = MessageService(db)
    count = await message_service.get_unread_count(current_user.id)
    return UnreadCountResponse(count=count)

