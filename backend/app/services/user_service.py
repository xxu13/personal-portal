"""
User service for business logic.
"""
from typing import Optional

from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate
from app.core.security import get_password_hash, verify_password


class UserService:
    """Service class for user operations."""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def get_by_id(self, user_id: int) -> Optional[User]:
        """Get user by ID."""
        result = await self.db.execute(
            select(User).where(User.id == user_id)
        )
        return result.scalar_one_or_none()
    
    async def get_by_username(self, username: str) -> Optional[User]:
        """Get user by username."""
        result = await self.db.execute(
            select(User).where(User.username == username.lower())
        )
        return result.scalar_one_or_none()
    
    async def get_by_email(self, email: str) -> Optional[User]:
        """Get user by email."""
        result = await self.db.execute(
            select(User).where(User.email == email.lower())
        )
        return result.scalar_one_or_none()
    
    async def get_by_username_or_email(self, identifier: str) -> Optional[User]:
        """Get user by username or email."""
        identifier_lower = identifier.lower()
        result = await self.db.execute(
            select(User).where(
                or_(
                    User.username == identifier_lower,
                    User.email == identifier_lower,
                )
            )
        )
        return result.scalar_one_or_none()
    
    async def create(self, user_create: UserCreate) -> User:
        """Create a new user."""
        user = User(
            username=user_create.username.lower(),
            email=user_create.email.lower(),
            password_hash=get_password_hash(user_create.password),
            nickname=user_create.username,  # Default nickname to username
        )
        self.db.add(user)
        await self.db.commit()
        await self.db.refresh(user)
        return user
    
    async def update(self, user: User, user_update: UserUpdate) -> User:
        """Update user profile."""
        update_data = user_update.model_dump(exclude_unset=True)
        
        for field, value in update_data.items():
            setattr(user, field, value)
        
        await self.db.commit()
        await self.db.refresh(user)
        return user
    
    async def update_avatar(self, user: User, avatar_url: str) -> User:
        """Update user avatar."""
        user.avatar = avatar_url
        await self.db.commit()
        await self.db.refresh(user)
        return user
    
    async def update_password(
        self, 
        user: User, 
        current_password: str, 
        new_password: str
    ) -> bool:
        """Update user password."""
        if not verify_password(current_password, user.password_hash):
            return False
        
        user.password_hash = get_password_hash(new_password)
        await self.db.commit()
        return True
    
    async def authenticate(
        self, 
        username: str, 
        password: str
    ) -> Optional[User]:
        """Authenticate user by username/email and password."""
        user = await self.get_by_username_or_email(username)
        
        if not user:
            return None
        
        if not user.is_active:
            return None
        
        if not verify_password(password, user.password_hash):
            return None
        
        return user
    
    async def check_username_exists(self, username: str) -> bool:
        """Check if username already exists."""
        user = await self.get_by_username(username)
        return user is not None
    
    async def check_email_exists(self, email: str) -> bool:
        """Check if email already exists."""
        user = await self.get_by_email(email)
        return user is not None
    
    async def deactivate(self, user: User) -> User:
        """Deactivate user account."""
        user.is_active = False
        await self.db.commit()
        await self.db.refresh(user)
        return user
    
    async def activate(self, user: User) -> User:
        """Activate user account."""
        user.is_active = True
        await self.db.commit()
        await self.db.refresh(user)
        return user
    
    async def set_role(self, user: User, role: str) -> User:
        """Set user role."""
        if role not in ("admin", "user"):
            raise ValueError("Invalid role")
        
        user.role = role
        await self.db.commit()
        await self.db.refresh(user)
        return user



