"""
Notification service for business logic.
"""
from datetime import datetime
from typing import Optional, Tuple, List

from sqlalchemy import select, func, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.notification import Notification
from app.schemas.notification import NotificationCreate


class NotificationService:
    """Service class for notification operations."""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def create(
        self,
        notification_data: NotificationCreate,
    ) -> Notification:
        """Create a notification."""
        notification = Notification(
            user_id=notification_data.user_id,
            type=notification_data.type,
            title=notification_data.title,
            content=notification_data.content,
            entity_type=notification_data.entity_type,
            entity_id=notification_data.entity_id,
            actor_id=notification_data.actor_id,
            data=notification_data.data,
        )
        self.db.add(notification)
        await self.db.commit()
        await self.db.refresh(notification)
        
        # Reload with actor
        if notification_data.actor_id:
            result = await self.db.execute(
                select(Notification)
                .options(selectinload(Notification.actor))
                .where(Notification.id == notification.id)
            )
            return result.scalar_one()
        
        return notification
    
    async def get_list(
        self,
        user_id: int,
        page: int = 1,
        size: int = 20,
        unread_only: bool = False,
    ) -> Tuple[List[Notification], int, int]:
        """Get user's notifications."""
        # Base query
        query = (
            select(Notification)
            .options(selectinload(Notification.actor))
            .where(Notification.user_id == user_id)
        )
        
        if unread_only:
            query = query.where(Notification.is_read == False)
        
        query = query.order_by(Notification.created_at.desc())
        
        # Count total
        count_query = select(func.count()).select_from(query.subquery())
        total = await self.db.scalar(count_query) or 0
        
        # Count unread
        unread_query = select(func.count()).where(
            Notification.user_id == user_id,
            Notification.is_read == False,
        )
        unread_count = await self.db.scalar(unread_query) or 0
        
        # Paginate
        offset = (page - 1) * size
        result = await self.db.execute(query.offset(offset).limit(size))
        notifications = list(result.scalars().all())
        
        return notifications, total, unread_count
    
    async def get_by_id(self, notification_id: int) -> Optional[Notification]:
        """Get notification by ID."""
        result = await self.db.execute(
            select(Notification)
            .options(selectinload(Notification.actor))
            .where(Notification.id == notification_id)
        )
        return result.scalar_one_or_none()
    
    async def mark_as_read(
        self,
        user_id: int,
        notification_ids: Optional[List[int]] = None,
    ) -> int:
        """Mark notifications as read."""
        query = (
            update(Notification)
            .where(
                Notification.user_id == user_id,
                Notification.is_read == False,
            )
            .values(is_read=True, read_at=datetime.utcnow())
        )
        
        if notification_ids:
            query = query.where(Notification.id.in_(notification_ids))
        
        result = await self.db.execute(query)
        await self.db.commit()
        return result.rowcount
    
    async def get_unread_count(self, user_id: int) -> int:
        """Get unread notification count."""
        result = await self.db.execute(
            select(func.count()).where(
                Notification.user_id == user_id,
                Notification.is_read == False,
            )
        )
        return result.scalar() or 0
    
    async def delete(self, notification: Notification) -> None:
        """Delete a notification."""
        await self.db.delete(notification)
        await self.db.commit()
    
    async def delete_old(self, user_id: int, days: int = 30) -> int:
        """Delete notifications older than specified days."""
        from datetime import timedelta
        cutoff = datetime.utcnow() - timedelta(days=days)
        
        # Get IDs to delete
        result = await self.db.execute(
            select(Notification.id).where(
                Notification.user_id == user_id,
                Notification.created_at < cutoff,
            )
        )
        ids_to_delete = list(result.scalars().all())
        
        if ids_to_delete:
            await self.db.execute(
                Notification.__table__.delete().where(
                    Notification.id.in_(ids_to_delete)
                )
            )
            await self.db.commit()
        
        return len(ids_to_delete)


# Helper functions to create specific notifications
async def notify_comment(
    db: AsyncSession,
    post_author_id: int,
    commenter_id: int,
    post_id: int,
    post_title: str,
) -> Optional[Notification]:
    """Create notification for new comment on post."""
    if post_author_id == commenter_id:
        return None  # Don't notify yourself
    
    service = NotificationService(db)
    return await service.create(NotificationCreate(
        user_id=post_author_id,
        type="comment",
        title="New comment on your post",
        content=f'Someone commented on "{post_title}"',
        entity_type="post",
        entity_id=post_id,
        actor_id=commenter_id,
    ))


async def notify_reply(
    db: AsyncSession,
    parent_author_id: int,
    replier_id: int,
    post_id: int,
    comment_id: int,
) -> Optional[Notification]:
    """Create notification for reply to comment."""
    if parent_author_id == replier_id:
        return None
    
    service = NotificationService(db)
    return await service.create(NotificationCreate(
        user_id=parent_author_id,
        type="reply",
        title="New reply to your comment",
        content="Someone replied to your comment",
        entity_type="comment",
        entity_id=comment_id,
        actor_id=replier_id,
        data={"post_id": post_id},
    ))


async def notify_like(
    db: AsyncSession,
    target_author_id: int,
    liker_id: int,
    target_type: str,
    target_id: int,
) -> Optional[Notification]:
    """Create notification for like."""
    if target_author_id == liker_id:
        return None
    
    service = NotificationService(db)
    notif_type = f"like_{target_type}"
    return await service.create(NotificationCreate(
        user_id=target_author_id,
        type=notif_type,
        title=f"Someone liked your {target_type}",
        entity_type=target_type,
        entity_id=target_id,
        actor_id=liker_id,
    ))

