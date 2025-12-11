"""
AI API endpoints for text-to-image generation and chat completion.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse

from app.core.deps import get_current_user_id
from app.schemas.ai import (
    Text2ImageRequest,
    Text2ImageTaskResponse,
    Text2ImageStatusResponse,
    SaveImageRequest,
    SaveImageResponse,
    ChatRequest,
    ChatResponse,
)
from app.services.ai_service import ai_service


router = APIRouter(prefix="/ai", tags=["AI"])


# ============================================================
# Text-to-Image Endpoints
# ============================================================

@router.post("/text2image", response_model=Text2ImageTaskResponse)
async def submit_text2image(
    request: Text2ImageRequest,
    current_user_id: int = Depends(get_current_user_id),
):
    """
    Submit a text-to-image generation task.
    Returns a task_id for polling the status.
    
    Requires authentication.
    """
    try:
        result = await ai_service.submit_text2image_task(request)
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to submit text-to-image task: {str(e)}",
        )


@router.get("/text2image/{task_id}", response_model=Text2ImageStatusResponse)
async def get_text2image_status(
    task_id: str,
    current_user_id: int = Depends(get_current_user_id),
):
    """
    Query the status of a text-to-image task.
    
    Returns:
    - PENDING: Task is queued
    - RUNNING: Task is being processed
    - SUCCEEDED: Task completed, results available
    - FAILED: Task failed, check message
    
    Requires authentication.
    """
    try:
        result = await ai_service.get_task_status(task_id)
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get task status: {str(e)}",
        )


@router.post("/text2image/save", response_model=SaveImageResponse)
async def save_generated_image(
    request: SaveImageRequest,
    current_user_id: int = Depends(get_current_user_id),
):
    """
    Download and save a generated image to the server.
    Returns the local URL path for the saved image.
    
    Requires authentication.
    """
    try:
        result = await ai_service.download_and_save_image(request.url)
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save image: {str(e)}",
        )


# ============================================================
# Chat Endpoints
# ============================================================

@router.post("/chat")
async def chat_completion(
    request: ChatRequest,
    current_user_id: int = Depends(get_current_user_id),
):
    """
    Stream chat completion using Server-Sent Events (SSE).
    
    Returns a stream of text chunks as they are generated.
    
    Requires authentication.
    """
    async def generate():
        try:
            async for chunk in ai_service.chat_stream(
                message=request.message,
                history=request.history,
            ):
                # SSE format: data: <content>\n\n
                yield f"data: {chunk}\n\n"
            yield "data: [DONE]\n\n"
        except Exception as e:
            yield f"data: [ERROR] {str(e)}\n\n"
    
    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # Disable nginx buffering
        },
    )


@router.post("/chat/sync", response_model=ChatResponse)
async def chat_completion_sync(
    request: ChatRequest,
    current_user_id: int = Depends(get_current_user_id),
):
    """
    Non-streaming chat completion.
    Returns the complete response at once.
    
    Requires authentication.
    """
    try:
        content = await ai_service.chat(
            message=request.message,
            history=request.history,
        )
        return ChatResponse(content=content)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get chat response: {str(e)}",
        )

