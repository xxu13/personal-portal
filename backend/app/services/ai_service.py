"""
AI Service for DashScope API integration.
Handles text-to-image generation and chat completion.
"""
import os
import uuid
from datetime import datetime
from typing import AsyncGenerator, Optional, List

import aiofiles
import httpx

from app.core.config import settings
from app.schemas.ai import (
    Text2ImageRequest,
    Text2ImageTaskResponse,
    Text2ImageStatusResponse,
    Text2ImageResult,
    TaskStatus,
    ChatMessage,
    SaveImageResponse,
)


class AIService:
    """Service class for AI operations using DashScope API."""
    
    def __init__(self):
        self.api_key = settings.DASHSCOPE_API_KEY or os.getenv("DASHSCOPE_API_KEY", "")
        self.base_url = settings.DASHSCOPE_BASE_URL
        self.text2image_model = settings.DASHSCOPE_TEXT2IMAGE_MODEL
        self.chat_model = settings.DASHSCOPE_CHAT_MODEL
        
    def _get_headers(self, async_mode: bool = False) -> dict:
        """Get common headers for API requests."""
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        if async_mode:
            headers["X-DashScope-Async"] = "enable"
        return headers
    
    # ============================================================
    # Text-to-Image Methods
    # ============================================================
    
    async def submit_text2image_task(
        self,
        request: Text2ImageRequest
    ) -> Text2ImageTaskResponse:
        """
        Submit a text-to-image generation task.
        Returns task_id for status polling.
        """
        url = f"{self.base_url}/services/aigc/text2image/image-synthesis"
        
        payload = {
            "model": self.text2image_model,
            "input": {
                "prompt": request.prompt,
            },
            "parameters": {
                "size": request.size.value,
                "n": request.n,
            }
        }
        
        if request.negative_prompt:
            payload["input"]["negative_prompt"] = request.negative_prompt
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                url,
                headers=self._get_headers(async_mode=True),
                json=payload,
            )
            response.raise_for_status()
            data = response.json()
        
        # Extract task_id from response
        output = data.get("output", {})
        task_id = output.get("task_id", "")
        task_status = output.get("task_status", "PENDING")
        
        return Text2ImageTaskResponse(
            task_id=task_id,
            status=TaskStatus(task_status),
        )
    
    async def get_task_status(self, task_id: str) -> Text2ImageStatusResponse:
        """
        Query the status of a text-to-image task.
        """
        url = f"{self.base_url}/tasks/{task_id}"
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(
                url,
                headers=self._get_headers(),
            )
            response.raise_for_status()
            data = response.json()
        
        output = data.get("output", {})
        task_status = output.get("task_status", "PENDING")
        task_id = output.get("task_id", task_id)
        
        # Parse results if task succeeded
        results = None
        if task_status == "SUCCEEDED":
            raw_results = output.get("results", [])
            results = [Text2ImageResult(url=r.get("url", "")) for r in raw_results if r.get("url")]
        
        # Get error message if failed
        message = None
        if task_status == "FAILED":
            message = output.get("message") or data.get("message", "Task failed")
        
        return Text2ImageStatusResponse(
            task_id=task_id,
            status=TaskStatus(task_status),
            results=results,
            message=message,
        )
    
    async def download_and_save_image(self, image_url: str) -> SaveImageResponse:
        """
        Download an image from URL and save it to the local uploads directory.
        Returns the local URL path.
        """
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.get(image_url)
            response.raise_for_status()
            content = response.content
        
        # Determine file extension from content type
        content_type = response.headers.get("content-type", "image/png")
        ext_map = {
            "image/png": "png",
            "image/jpeg": "jpg",
            "image/jpg": "jpg",
            "image/webp": "webp",
            "image/gif": "gif",
        }
        ext = ext_map.get(content_type, "png")
        
        # Generate unique filename with date prefix
        date_prefix = datetime.now().strftime("%Y/%m")
        filename = f"ai_{uuid.uuid4()}.{ext}"
        
        # Create directory path
        upload_dir = os.path.join(settings.UPLOAD_DIR, "images", date_prefix)
        os.makedirs(upload_dir, exist_ok=True)
        
        # Full file path
        filepath = os.path.join(upload_dir, filename)
        
        # Save file
        async with aiofiles.open(filepath, "wb") as f:
            await f.write(content)
        
        # Generate local URL
        local_url = f"/uploads/images/{date_prefix}/{filename}"
        
        return SaveImageResponse(url=local_url, filename=filename)
    
    # ============================================================
    # Chat Methods
    # ============================================================
    
    async def chat_stream(
        self,
        message: str,
        history: Optional[List[ChatMessage]] = None,
    ) -> AsyncGenerator[str, None]:
        """
        Stream chat completion response using SSE.
        Yields content chunks as they arrive.
        """
        url = f"{self.base_url}/services/aigc/text-generation/generation"
        
        # Build messages array
        messages = []
        if history:
            for msg in history:
                messages.append({
                    "role": msg.role,
                    "content": msg.content,
                })
        messages.append({
            "role": "user",
            "content": message,
        })
        
        payload = {
            "model": self.chat_model,
            "input": {
                "messages": messages,
            },
            "parameters": {
                "result_format": "message",
                "incremental_output": True,
            }
        }
        
        headers = self._get_headers()
        headers["Accept"] = "text/event-stream"
        headers["X-DashScope-SSE"] = "enable"
        
        async with httpx.AsyncClient(timeout=120.0) as client:
            async with client.stream(
                "POST",
                url,
                headers=headers,
                json=payload,
            ) as response:
                response.raise_for_status()
                
                async for line in response.aiter_lines():
                    if not line:
                        continue
                    
                    # Parse SSE format: "data: {...}"
                    if line.startswith("data:"):
                        data_str = line[5:].strip()
                        if data_str == "[DONE]":
                            break
                        
                        try:
                            import json
                            data = json.loads(data_str)
                            output = data.get("output", {})
                            choices = output.get("choices", [])
                            if choices:
                                message_content = choices[0].get("message", {}).get("content", "")
                                if message_content:
                                    yield message_content
                        except (json.JSONDecodeError, KeyError, IndexError):
                            continue
    
    async def chat(
        self,
        message: str,
        history: Optional[List[ChatMessage]] = None,
    ) -> str:
        """
        Non-streaming chat completion.
        Returns the complete response content.
        """
        url = f"{self.base_url}/services/aigc/text-generation/generation"
        
        # Build messages array
        messages = []
        if history:
            for msg in history:
                messages.append({
                    "role": msg.role,
                    "content": msg.content,
                })
        messages.append({
            "role": "user",
            "content": message,
        })
        
        payload = {
            "model": self.chat_model,
            "input": {
                "messages": messages,
            },
            "parameters": {
                "result_format": "message",
            }
        }
        
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(
                url,
                headers=self._get_headers(),
                json=payload,
            )
            response.raise_for_status()
            data = response.json()
        
        output = data.get("output", {})
        choices = output.get("choices", [])
        if choices:
            return choices[0].get("message", {}).get("content", "")
        
        return ""


# Singleton instance
ai_service = AIService()

