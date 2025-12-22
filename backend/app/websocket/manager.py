"""
WebSocket connection manager.
"""
import json
from typing import Dict, Set
from fastapi import WebSocket


class ConnectionManager:
    """
    Manages WebSocket connections for real-time notifications.
    """
    
    def __init__(self):
        # Map of user_id to set of WebSocket connections
        self.active_connections: Dict[int, Set[WebSocket]] = {}
    
    async def connect(self, websocket: WebSocket, user_id: int):
        """Accept and register a new WebSocket connection."""
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = set()
        self.active_connections[user_id].add(websocket)
    
    def disconnect(self, websocket: WebSocket, user_id: int):
        """Remove a WebSocket connection."""
        if user_id in self.active_connections:
            self.active_connections[user_id].discard(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
    
    async def send_personal_message(self, message: dict, user_id: int):
        """Send a message to a specific user's connections."""
        if user_id in self.active_connections:
            disconnected = set()
            for connection in self.active_connections[user_id]:
                try:
                    await connection.send_json(message)
                except Exception:
                    disconnected.add(connection)
            
            # Clean up disconnected
            for conn in disconnected:
                self.active_connections[user_id].discard(conn)
    
    async def broadcast(self, message: dict):
        """Broadcast a message to all connected users."""
        for user_id in list(self.active_connections.keys()):
            await self.send_personal_message(message, user_id)
    
    def is_user_online(self, user_id: int) -> bool:
        """Check if a user has active connections."""
        return user_id in self.active_connections and len(self.active_connections[user_id]) > 0
    
    def get_online_count(self) -> int:
        """Get the number of online users."""
        return len(self.active_connections)


# Global connection manager instance
manager = ConnectionManager()


# Helper functions for sending notifications
async def send_notification(user_id: int, notification_data: dict):
    """Send a notification to a user via WebSocket."""
    message = {
        "type": "notification",
        "data": notification_data,
    }
    await manager.send_personal_message(message, user_id)


async def send_message_notification(user_id: int, message_data: dict):
    """Send a new message notification to a user."""
    message = {
        "type": "message",
        "data": message_data,
    }
    await manager.send_personal_message(message, user_id)


async def send_unread_count(user_id: int, notifications: int = 0, messages: int = 0):
    """Send updated unread counts to a user."""
    message = {
        "type": "unread_count",
        "data": {
            "notifications": notifications,
            "messages": messages,
        },
    }
    await manager.send_personal_message(message, user_id)


