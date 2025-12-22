"""
Upload API endpoints for images.
"""
import os
import uuid
from datetime import datetime

import aiofiles
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from pydantic import BaseModel

from app.core.config import settings
from app.core.deps import get_current_user_id
from app.models.user import User

router = APIRouter(prefix="/uploads", tags=["Uploads"])


class UploadResponse(BaseModel):
    """Response for successful upload."""
    url: str
    filename: str


@router.post("/image", response_model=UploadResponse)
async def upload_image(
    file: UploadFile = File(...),
    current_user_id: int = Depends(get_current_user_id),
):
    """
    Upload an image file.
    Returns the URL to access the uploaded image.
    """
    # Validate file type
    if file.content_type not in settings.ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type. Allowed: {', '.join(settings.ALLOWED_IMAGE_TYPES)}",
        )
    
    # Read file content
    content = await file.read()
    
    # Validate file size
    if len(content) > settings.MAX_UPLOAD_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File too large. Max size: {settings.MAX_UPLOAD_SIZE // 1024 // 1024}MB",
        )
    
    # Generate unique filename with date prefix for organization
    date_prefix = datetime.now().strftime("%Y/%m")
    ext = file.filename.split(".")[-1] if file.filename and "." in file.filename else "jpg"
    filename = f"{uuid.uuid4()}.{ext}"
    
    # Create directory path
    upload_dir = os.path.join(settings.UPLOAD_DIR, "images", date_prefix)
    os.makedirs(upload_dir, exist_ok=True)
    
    # Full file path
    filepath = os.path.join(upload_dir, filename)
    
    # Save file
    async with aiofiles.open(filepath, "wb") as f:
        await f.write(content)
    
    # Generate URL
    url = f"/uploads/images/{date_prefix}/{filename}"
    
    return UploadResponse(url=url, filename=filename)


@router.delete("/image/{year}/{month}/{filename}")
async def delete_image(
    year: str,
    month: str,
    filename: str,
    current_user_id: int = Depends(get_current_user_id),
):
    """
    Delete an uploaded image.
    Note: Only admins should be able to delete images not belonging to them.
    """
    filepath = os.path.join(settings.UPLOAD_DIR, "images", year, month, filename)
    
    if not os.path.exists(filepath):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Image not found",
        )
    
    try:
        os.remove(filepath)
    except OSError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete image: {str(e)}",
        )
    
    return {"message": "Image deleted successfully"}


