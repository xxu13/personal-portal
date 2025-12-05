import api from './api';

// Types
export interface UserBrief {
  id: number;
  username: string;
  nickname: string | null;
  avatar: string | null;
}

export interface Message {
  id: number;
  conversation_id: number;
  sender_id: number;
  content: string;
  is_read: boolean;
  created_at: string;
  read_at: string | null;
  sender: UserBrief;
}

export interface Conversation {
  id: number;
  other_user: UserBrief;
  last_message_at: string;
  last_message_preview: string | null;
  unread_count: number;
  created_at: string;
}

export interface ConversationListResponse {
  items: Conversation[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface MessageListResponse {
  items: Message[];
  total: number;
  page: number;
  size: number;
  pages: number;
  has_more: boolean;
}

export interface MessageCreateData {
  recipient_id: number;
  content: string;
}

// Service
export const messageService = {
  async getConversations(page = 1, size = 20): Promise<ConversationListResponse> {
    const response = await api.get<ConversationListResponse>('/messages/conversations', {
      params: { page, size },
    });
    return response.data;
  },

  async getMessages(conversationId: number, page = 1, size = 50): Promise<MessageListResponse> {
    const response = await api.get<MessageListResponse>(`/messages/conversations/${conversationId}`, {
      params: { page, size },
    });
    return response.data;
  },

  async sendMessage(data: MessageCreateData): Promise<Message> {
    const response = await api.post<Message>('/messages', data);
    return response.data;
  },

  async markConversationRead(conversationId: number): Promise<{ marked_read: number }> {
    const response = await api.post<{ marked_read: number }>(`/messages/conversations/${conversationId}/read`);
    return response.data;
  },

  async getUnreadCount(): Promise<number> {
    const response = await api.get<{ count: number }>('/messages/unread-count');
    return response.data.count;
  },
};

export default messageService;

