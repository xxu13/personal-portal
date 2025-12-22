"""
WebSocket route handlers.
"""
from fastapi import WebSocket, WebSocketDisconnect, Depends, Query
from jose import JWTError, jwt

from app.core.config import settings
from app.websocket.manager import manager


async def get_user_id_from_token(token: str) -> int | None:
    """Extract user_id from JWT token."""
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
        )
        user_id = payload.get("sub")
        if user_id:
            return int(user_id)
    except (JWTError, ValueError):
        pass
    return None


async def websocket_endpoint(
    websocket: WebSocket,
    token: str = Query(...),
):
    """
    WebSocket endpoint for real-time notifications.
    
    Connect with: ws://localhost:8000/ws/notifications?token=<jwt_token>
    
    Messages sent to client:
    - {"type": "notification", "data": {...}}
    - {"type": "message", "data": {...}}
    - {"type": "unread_count", "data": {"notifications": N, "messages": M}}
    """
    # Authenticate
    user_id = await get_user_id_from_token(token)
    if not user_id:
        await websocket.close(code=4001, reason="Unauthorized")
        return
    
    # Connect
    await manager.connect(websocket, user_id)
    
    try:
        # Send initial connection success
        await websocket.send_json({
            "type": "connected",
            "data": {"user_id": user_id},
        })
        
        # Keep connection alive and handle incoming messages
        while True:
            data = await websocket.receive_text()
            
            # Handle ping/pong for keeping connection alive
            if data == "ping":
                await websocket.send_text("pong")
            
    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id)
    except Exception:
        manager.disconnect(websocket, user_id)


