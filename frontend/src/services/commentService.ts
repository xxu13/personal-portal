import api from './api';

// Types
export interface CommentAuthor {
  id: number;
  username: string;
  nickname: string | null;
  avatar: string | null;
}

export interface Comment {
  id: number;
  content: Record<string, any>;
  content_text: string | null;
  post_id: number;
  user_id: number;
  parent_id: number | null;
  depth: number;
  path: string;
  like_count: number;
  reply_count: number;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  user: CommentAuthor;
}

export interface CommentWithReplies extends Comment {
  replies: CommentWithReplies[];
}

export interface CommentTreeResponse {
  comments: CommentWithReplies[];
  total: number;
}

export interface CommentListResponse {
  items: Comment[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface CommentCreateData {
  post_id: number;
  content: Record<string, any>;
  parent_id?: number;
}

export interface CommentUpdateData {
  content: Record<string, any>;
}

// Service
export const commentService = {
  async getByPost(postId: number): Promise<CommentTreeResponse> {
    const response = await api.get<CommentTreeResponse>(`/comments/post/${postId}`);
    return response.data;
  },

  async getByPostFlat(postId: number, page = 1, size = 50): Promise<CommentListResponse> {
    const response = await api.get<CommentListResponse>(`/comments/post/${postId}/flat`, {
      params: { page, size },
    });
    return response.data;
  },

  async getById(commentId: number): Promise<Comment> {
    const response = await api.get<Comment>(`/comments/${commentId}`);
    return response.data;
  },

  async create(data: CommentCreateData): Promise<Comment> {
    const response = await api.post<Comment>('/comments', data);
    return response.data;
  },

  async update(commentId: number, data: CommentUpdateData): Promise<Comment> {
    const response = await api.put<Comment>(`/comments/${commentId}`, data);
    return response.data;
  },

  async delete(commentId: number, hard = false): Promise<void> {
    await api.delete(`/comments/${commentId}`, { params: { hard } });
  },

  async getByUser(userId: number, page = 1, size = 20): Promise<CommentListResponse> {
    const response = await api.get<CommentListResponse>(`/comments/user/${userId}`, {
      params: { page, size },
    });
    return response.data;
  },
};

export default commentService;

