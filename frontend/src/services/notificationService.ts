import api from './api';

// Types
export interface ActorBrief {
  id: number;
  username: string;
  nickname: string | null;
  avatar: string | null;
}

export interface Notification {
  id: number;
  type: string;
  title: string;
  content: string | null;
  entity_type: string | null;
  entity_id: number | null;
  is_read: boolean;
  created_at: string;
  read_at: string | null;
  actor: ActorBrief | null;
  data: Record<string, any> | null;
}

export interface NotificationListResponse {
  items: Notification[];
  total: number;
  page: number;
  size: number;
  pages: number;
  unread_count: number;
}

// Service
export const notificationService = {
  async getNotifications(
    page = 1,
    size = 20,
    unreadOnly = false
  ): Promise<NotificationListResponse> {
    const response = await api.get<NotificationListResponse>('/notifications', {
      params: { page, size, unread_only: unreadOnly },
    });
    return response.data;
  },

  async getUnreadCount(): Promise<number> {
    const response = await api.get<{ count: number }>('/notifications/unread-count');
    return response.data.count;
  },

  async markAsRead(notificationIds?: number[]): Promise<{ marked_read: number }> {
    const response = await api.post<{ marked_read: number }>('/notifications/read', {
      notification_ids: notificationIds,
    });
    return response.data;
  },

  async deleteNotification(notificationId: number): Promise<void> {
    await api.delete(`/notifications/${notificationId}`);
  },

  async cleanupOld(days = 30): Promise<{ deleted: number }> {
    const response = await api.delete<{ deleted: number }>('/notifications/cleanup', {
      params: { days },
    });
    return response.data;
  },
};

export default notificationService;


