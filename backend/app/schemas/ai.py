"""
AI-related Pydantic schemas for request/response models.
"""
from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, Field


class ImageSize(str, Enum):
    """Available image sizes for text-to-image generation."""
    SQUARE = "1024*1024"
    PORTRAIT = "720*1280"
    LANDSCAPE = "1280*720"


class TaskStatus(str, Enum):
    """Task status for async operations."""
    PENDING = "PENDING"
    RUNNING = "RUNNING"
    SUCCEEDED = "SUCCEEDED"
    FAILED = "FAILED"


# ============================================================
# Text-to-Image Schemas
# ============================================================

class Text2ImageRequest(BaseModel):
    """Request body for text-to-image generation."""
    prompt: str = Field(..., min_length=1, max_length=2000, description="Image description prompt")
    negative_prompt: Optional[str] = Field(None, max_length=2000, description="Negative prompt")
    size: ImageSize = Field(default=ImageSize.SQUARE, description="Image size")
    n: int = Field(default=1, ge=1, le=4, description="Number of images to generate (1-4)")


class Text2ImageTaskResponse(BaseModel):
    """Response after submitting a text-to-image task."""
    task_id: str
    status: TaskStatus


class Text2ImageResult(BaseModel):
    """Single image result from text-to-image generation."""
    url: str


class Text2ImageStatusResponse(BaseModel):
    """Response for text-to-image task status query."""
    task_id: str
    status: TaskStatus
    results: Optional[List[Text2ImageResult]] = None
    message: Optional[str] = None


class SaveImageRequest(BaseModel):
    """Request to save an image from URL to server."""
    url: str = Field(..., description="Image URL to download and save")


class SaveImageResponse(BaseModel):
    """Response after saving an image."""
    url: str = Field(..., description="Local URL path to the saved image")
    filename: str = Field(..., description="Saved filename")


# ============================================================
# Chat Schemas
# ============================================================

class ChatMessage(BaseModel):
    """Single message in chat history."""
    role: str = Field(..., pattern="^(user|assistant|system)$")
    content: str


class ChatRequest(BaseModel):
    """Request body for chat completion."""
    message: str = Field(..., min_length=1, max_length=10000, description="User message")
    history: Optional[List[ChatMessage]] = Field(default=None, description="Chat history")


class ChatResponse(BaseModel):
    """Response for chat completion (non-streaming)."""
    content: str
    usage: Optional[dict] = None

