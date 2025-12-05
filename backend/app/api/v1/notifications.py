"""
Notification API endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_db
from app.models.user import User
from app.schemas.notification import (
    NotificationResponse,
    NotificationListResponse,
    UnreadCountResponse,
    MarkReadRequest,
)
from app.services.notification_service import NotificationService
from app.api.v1.users import get_current_user

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("", response_model=NotificationListResponse)
async def get_notifications(
    page: int = Query(default=1, ge=1),
    size: int = Query(default=20, ge=1, le=100),
    unread_only: bool = Query(default=False),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get current user's notifications.
    """
    notification_service = NotificationService(db)
    notifications, total, unread_count = await notification_service.get_list(
        current_user.id, page, size, unread_only
    )
    
    pages = (total + size - 1) // size
    
    return NotificationListResponse(
        items=[NotificationResponse.model_validate(n) for n in notifications],
        total=total,
        page=page,
        size=size,
        pages=pages,
        unread_count=unread_count,
    )


@router.get("/unread-count", response_model=UnreadCountResponse)
async def get_unread_count(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get unread notification count.
    """
    notification_service = NotificationService(db)
    count = await notification_service.get_unread_count(current_user.id)
    return UnreadCountResponse(count=count)


@router.post("/read")
async def mark_as_read(
    request: MarkReadRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Mark notifications as read.
    If notification_ids is not provided, marks all as read.
    """
    notification_service = NotificationService(db)
    count = await notification_service.mark_as_read(
        current_user.id,
        request.notification_ids,
    )
    return {"marked_read": count}


@router.delete("/{notification_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_notification(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Delete a notification.
    """
    notification_service = NotificationService(db)
    notification = await notification_service.get_by_id(notification_id)
    
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found",
        )
    
    if notification.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized",
        )
    
    await notification_service.delete(notification)


@router.delete("/cleanup")
async def cleanup_old_notifications(
    days: int = Query(default=30, ge=7, le=365),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Delete notifications older than specified days.
    """
    notification_service = NotificationService(db)
    count = await notification_service.delete_old(current_user.id, days)
    return {"deleted": count}

