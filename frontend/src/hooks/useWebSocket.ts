import { useEffect, useRef, useCallback } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useNotificationStore } from '../stores/notificationStore';

interface WebSocketMessage {
  type: 'notification' | 'message' | 'unread_count' | 'connected';
  data: any;
}

export const useWebSocket = () => {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { token, isAuthenticated } = useAuthStore();
  const { 
    setWsConnected, 
    setUnreadNotifications, 
    setUnreadMessages,
    incrementNotifications,
    incrementMessages,
  } = useNotificationStore();

  const connect = useCallback(() => {
    if (!token || !isAuthenticated) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const wsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws/notifications?token=${token}`;
    
    try {
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('WebSocket connected');
        setWsConnected(true);
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          
          switch (message.type) {
            case 'notification':
              incrementNotifications();
              // Could dispatch custom event for UI updates
              window.dispatchEvent(new CustomEvent('ws:notification', { detail: message.data }));
              break;
            case 'message':
              incrementMessages();
              window.dispatchEvent(new CustomEvent('ws:message', { detail: message.data }));
              break;
            case 'unread_count':
              setUnreadNotifications(message.data.notifications);
              setUnreadMessages(message.data.messages);
              break;
            case 'connected':
              console.log('WebSocket authenticated:', message.data);
              break;
          }
        } catch (e) {
          console.error('Failed to parse WebSocket message:', e);
        }
      };

      wsRef.current.onclose = () => {
        console.log('WebSocket disconnected');
        setWsConnected(false);
        
        // Attempt to reconnect after 5 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 5000);
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
    }
  }, [token, isAuthenticated, setWsConnected, setUnreadNotifications, setUnreadMessages, incrementNotifications, incrementMessages]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setWsConnected(false);
  }, [setWsConnected]);

  // Connect on mount if authenticated
  useEffect(() => {
    if (isAuthenticated && token) {
      connect();
    }
    
    return () => {
      disconnect();
    };
  }, [isAuthenticated, token, connect, disconnect]);

  // Ping to keep connection alive
  useEffect(() => {
    const pingInterval = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send('ping');
      }
    }, 30000);

    return () => clearInterval(pingInterval);
  }, []);

  return { connect, disconnect };
};

export default useWebSocket;

