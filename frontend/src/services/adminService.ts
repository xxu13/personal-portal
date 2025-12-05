import api from './api';

// Types
export interface DashboardStats {
  users: { total: number; new_today: number };
  posts: { total: number; published: number; this_week: number };
  comments: { total: number; this_week: number };
  categories: number;
  tags: number;
}

export interface AdminUser {
  id: number;
  username: string;
  email: string;
  nickname: string | null;
  avatar: string | null;
  role: string;
  is_active: boolean;
  created_at: string;
}

export interface AdminPost {
  id: number;
  title: string;
  slug: string;
  status: string;
  view_count: number;
  like_count: number;
  comment_count: number;
  author: { id: number; username: string; nickname: string | null } | null;
  category: { id: number; name: string } | null;
  created_at: string;
}

export interface AdminComment {
  id: number;
  content_text: string;
  is_deleted: boolean;
  like_count: number;
  user: { id: number; username: string; nickname: string | null } | null;
  post: { id: number; title: string } | null;
  created_at: string;
}

export interface AdminTag {
  id: number;
  name: string;
  slug: string;
  post_count: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

// Service
export const adminService = {
  // Dashboard
  async getStats(): Promise<DashboardStats> {
    const response = await api.get<DashboardStats>('/admin/stats');
    return response.data;
  },

  // Users
  async getUsers(params: {
    page?: number;
    size?: number;
    search?: string;
    role?: string;
    is_active?: boolean;
  } = {}): Promise<PaginatedResponse<AdminUser>> {
    const response = await api.get<PaginatedResponse<AdminUser>>('/admin/users', { params });
    return response.data;
  },

  async updateUser(userId: number, data: { role?: string; is_active?: boolean }): Promise<void> {
    await api.patch(`/admin/users/${userId}`, null, { params: data });
  },

  // Posts
  async getPosts(params: {
    page?: number;
    size?: number;
    search?: string;
    status?: string;
    author_id?: number;
  } = {}): Promise<PaginatedResponse<AdminPost>> {
    const response = await api.get<PaginatedResponse<AdminPost>>('/admin/posts', { params });
    return response.data;
  },

  async updatePostStatus(postId: number, status: 'published' | 'draft' | 'archived'): Promise<void> {
    await api.patch(`/admin/posts/${postId}`, null, { params: { status } });
  },

  async deletePost(postId: number): Promise<void> {
    await api.delete(`/admin/posts/${postId}`);
  },

  // Comments
  async getComments(params: {
    page?: number;
    size?: number;
    post_id?: number;
    user_id?: number;
    is_deleted?: boolean;
  } = {}): Promise<PaginatedResponse<AdminComment>> {
    const response = await api.get<PaginatedResponse<AdminComment>>('/admin/comments', { params });
    return response.data;
  },

  async deleteComment(commentId: number, hard = false): Promise<void> {
    await api.delete(`/admin/comments/${commentId}`, { params: { hard } });
  },

  async restoreComment(commentId: number): Promise<void> {
    await api.patch(`/admin/comments/${commentId}/restore`);
  },

  // Categories
  async createCategory(data: {
    name: string;
    slug: string;
    description?: string;
    parent_id?: number;
  }): Promise<{ id: number; name: string; slug: string }> {
    const response = await api.post('/admin/categories', null, { params: data });
    return response.data;
  },

  async updateCategory(
    categoryId: number,
    data: { name?: string; slug?: string; description?: string }
  ): Promise<void> {
    await api.patch(`/admin/categories/${categoryId}`, null, { params: data });
  },

  async deleteCategory(categoryId: number): Promise<void> {
    await api.delete(`/admin/categories/${categoryId}`);
  },

  // Tags
  async getTags(params: {
    page?: number;
    size?: number;
    search?: string;
  } = {}): Promise<PaginatedResponse<AdminTag>> {
    const response = await api.get<PaginatedResponse<AdminTag>>('/admin/tags', { params });
    return response.data;
  },

  async updateTag(tagId: number, data: { name?: string; slug?: string }): Promise<void> {
    await api.patch(`/admin/tags/${tagId}`, null, { params: data });
  },

  async deleteTag(tagId: number): Promise<void> {
    await api.delete(`/admin/tags/${tagId}`);
  },
};

export default adminService;

