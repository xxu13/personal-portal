"""
Comment service for business logic.
"""
from typing import Optional, Tuple, List
import re

from sqlalchemy import select, func, and_, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.comment import Comment
from app.models.post import Post
from app.schemas.comment import CommentCreate, CommentUpdate


def extract_text_from_tiptap(content: dict) -> str:
    """Extract plain text from TipTap JSON for search/preview."""
    if not content:
        return ""
    
    text_parts = []
    
    def traverse(node: dict):
        if node.get("type") == "text":
            text_parts.append(node.get("text", ""))
        for child in node.get("content", []):
            traverse(child)
    
    traverse(content)
    return " ".join(text_parts)


class CommentService:
    """Service class for comment operations."""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def get_by_id(self, comment_id: int) -> Optional[Comment]:
        """Get comment by ID with user."""
        result = await self.db.execute(
            select(Comment)
            .options(selectinload(Comment.user))
            .where(Comment.id == comment_id)
        )
        return result.scalar_one_or_none()
    
    async def get_by_post_flat(
        self,
        post_id: int,
        page: int = 1,
        size: int = 50,
    ) -> Tuple[List[Comment], int]:
        """Get flat list of comments for a post (for pagination)."""
        # Count total
        count_query = select(func.count()).where(Comment.post_id == post_id)
        total = await self.db.scalar(count_query) or 0
        
        # Get comments ordered by path for tree structure
        offset = (page - 1) * size
        result = await self.db.execute(
            select(Comment)
            .options(selectinload(Comment.user))
            .where(Comment.post_id == post_id)
            .order_by(Comment.path.asc(), Comment.created_at.asc())
            .offset(offset)
            .limit(size)
        )
        comments = list(result.scalars().all())
        
        return comments, total
    
    async def get_by_post_tree(self, post_id: int) -> List[Comment]:
        """
        Get comment tree for a post.
        Returns root-level comments with nested replies loaded.
        """
        # Get all comments for the post
        result = await self.db.execute(
            select(Comment)
            .options(selectinload(Comment.user))
            .where(Comment.post_id == post_id)
            .order_by(Comment.path.asc(), Comment.created_at.asc())
        )
        all_comments = list(result.scalars().all())
        
        # Build tree structure
        comment_dict = {c.id: c for c in all_comments}
        root_comments = []
        
        for comment in all_comments:
            # Initialize replies list if not exists
            if not hasattr(comment, '_replies'):
                comment._replies = []
            
            if comment.parent_id is None:
                root_comments.append(comment)
            else:
                parent = comment_dict.get(comment.parent_id)
                if parent:
                    if not hasattr(parent, '_replies'):
                        parent._replies = []
                    parent._replies.append(comment)
        
        # Convert _replies to replies for serialization
        def set_replies(comment):
            comment.replies = getattr(comment, '_replies', [])
            for reply in comment.replies:
                set_replies(reply)
        
        for comment in root_comments:
            set_replies(comment)
        
        return root_comments
    
    async def create(
        self,
        user_id: int,
        comment_create: CommentCreate,
    ) -> Comment:
        """Create a new comment."""
        # Get parent comment if replying
        parent = None
        depth = 0
        path_prefix = ""
        
        if comment_create.parent_id:
            parent = await self.get_by_id(comment_create.parent_id)
            if parent:
                depth = parent.depth + 1
                path_prefix = parent.path + "." if parent.path else ""
        
        # Extract plain text
        content_text = extract_text_from_tiptap(comment_create.content)
        
        # Create comment
        comment = Comment(
            content=comment_create.content,
            content_text=content_text,
            post_id=comment_create.post_id,
            user_id=user_id,
            parent_id=comment_create.parent_id,
            depth=depth,
            path="",  # Will update after insert
        )
        
        self.db.add(comment)
        await self.db.flush()  # Get the ID
        
        # Update path with the new comment's ID
        comment.path = f"{path_prefix}{comment.id}"
        
        # Update parent's reply_count
        if parent:
            parent.reply_count += 1
        
        # Update post's comment_count
        await self.db.execute(
            update(Post)
            .where(Post.id == comment_create.post_id)
            .values(comment_count=Post.comment_count + 1)
        )
        
        await self.db.commit()
        await self.db.refresh(comment)
        
        # Reload with user
        return await self.get_by_id(comment.id)
    
    async def update(
        self,
        comment: Comment,
        comment_update: CommentUpdate,
    ) -> Comment:
        """Update a comment."""
        comment.content = comment_update.content
        comment.content_text = extract_text_from_tiptap(comment_update.content)
        
        await self.db.commit()
        await self.db.refresh(comment)
        
        return await self.get_by_id(comment.id)
    
    async def delete(self, comment: Comment, soft: bool = True) -> None:
        """Delete a comment (soft delete by default)."""
        if soft:
            # Soft delete - mark as deleted
            comment.is_deleted = True
            comment.content = {"type": "doc", "content": []}
            comment.content_text = "[已删除]"
        else:
            # Hard delete
            await self.db.delete(comment)
            
            # Update post's comment_count
            await self.db.execute(
                update(Post)
                .where(Post.id == comment.post_id)
                .values(comment_count=Post.comment_count - 1)
            )
        
        await self.db.commit()
    
    async def get_user_comments(
        self,
        user_id: int,
        page: int = 1,
        size: int = 20,
    ) -> Tuple[List[Comment], int]:
        """Get comments by a user."""
        count_query = select(func.count()).where(
            Comment.user_id == user_id,
            Comment.is_deleted == False,
        )
        total = await self.db.scalar(count_query) or 0
        
        offset = (page - 1) * size
        result = await self.db.execute(
            select(Comment)
            .options(selectinload(Comment.user))
            .where(Comment.user_id == user_id, Comment.is_deleted == False)
            .order_by(Comment.created_at.desc())
            .offset(offset)
            .limit(size)
        )
        comments = list(result.scalars().all())
        
        return comments, total

