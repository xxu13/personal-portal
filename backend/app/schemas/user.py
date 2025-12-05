"""
User schemas for request/response validation.
"""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field, field_validator
import re


class UserBase(BaseModel):
    """Base user schema with common fields."""
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    
    @field_validator("username")
    @classmethod
    def validate_username(cls, v: str) -> str:
        """Validate username format."""
        if not re.match(r"^[a-zA-Z0-9_-]+$", v):
            raise ValueError("Username can only contain letters, numbers, underscores and hyphens")
        return v.lower()


class UserCreate(UserBase):
    """Schema for user registration."""
    password: str = Field(..., min_length=6, max_length=100)
    
    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        """Validate password strength."""
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters")
        return v


class UserLogin(BaseModel):
    """Schema for user login."""
    username: str  # Can be username or email
    password: str


class UserUpdate(BaseModel):
    """Schema for updating user profile."""
    nickname: Optional[str] = Field(None, max_length=50)
    bio: Optional[str] = Field(None, max_length=500)
    language_preference: Optional[str] = Field(None, pattern=r"^(zh|en)$")


class UserUpdatePassword(BaseModel):
    """Schema for changing password."""
    current_password: str
    new_password: str = Field(..., min_length=6, max_length=100)


class UserResponse(BaseModel):
    """Schema for user response (public info)."""
    id: int
    username: str
    email: EmailStr
    nickname: Optional[str] = None
    avatar: Optional[str] = None
    bio: Optional[str] = None
    role: str
    language_preference: str
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    model_config = {"from_attributes": True}


class UserPublicResponse(BaseModel):
    """Schema for public user info (for other users to see)."""
    id: int
    username: str
    nickname: Optional[str] = None
    avatar: Optional[str] = None
    bio: Optional[str] = None
    created_at: datetime
    
    model_config = {"from_attributes": True}


class UserInDB(UserResponse):
    """Schema for user in database (includes password hash)."""
    password_hash: str


