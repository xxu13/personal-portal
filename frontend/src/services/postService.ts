import api, { PaginatedResponse } from './api';

// Types
export interface Author {
  id: number;
  username: string;
  nickname: string | null;
  avatar: string | null;
}

export interface Category {
  id: number;
  name: string;
  name_en: string;
  slug: string;
  icon: string | null;
  post_count?: number;
}

export interface Tag {
  id: number;
  name: string;
  name_en: string | null;
  slug: string;
  post_count?: number;
}

export interface Post {
  id: number;
  title: string;
  title_en: string | null;
  slug: string;
  content: Record<string, any>;
  content_en: Record<string, any> | null;
  excerpt: string | null;
  cover_image: string | null;
  status: 'draft' | 'published' | 'archived';
  is_featured: boolean;
  view_count: number;
  like_count: number;
  comment_count: number;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  user: Author;
  category: Category | null;
  tags: Tag[];
}

export interface PostListItem {
  id: number;
  title: string;
  title_en: string | null;
  slug: string;
  excerpt: string | null;
  cover_image: string | null;
  status: string;
  is_featured: boolean;
  view_count: number;
  like_count: number;
  comment_count: number;
  created_at: string;
  published_at: string | null;
  user: Author;
  category: Category | null;
  tags: Tag[];
}

export interface PostCreateData {
  title: string;
  title_en?: string;
  content: Record<string, any>;
  content_en?: Record<string, any>;
  excerpt?: string;
  cover_image?: string;
  category_id?: number;
  tag_ids?: number[];
  status?: 'draft' | 'published';
}

export interface PostUpdateData {
  title?: string;
  title_en?: string;
  content?: Record<string, any>;
  content_en?: Record<string, any>;
  excerpt?: string;
  cover_image?: string;
  category_id?: number;
  tag_ids?: number[];
  status?: 'draft' | 'published' | 'archived';
}

export interface PostSearchParams {
  q?: string;
  category_id?: number;
  tag_id?: number;
  is_featured?: boolean;
  page?: number;
  size?: number;
  sort_by?: 'created_at' | 'updated_at' | 'view_count' | 'like_count';
  sort_order?: 'asc' | 'desc';
}

// Service
export const postService = {
  async getList(params: PostSearchParams = {}): Promise<PaginatedResponse<PostListItem>> {
    const response = await api.get<PaginatedResponse<PostListItem>>('/posts', { params });
    return response.data;
  },

  async getFeatured(limit = 5): Promise<PostListItem[]> {
    const response = await api.get<PostListItem[]>('/posts/featured', { params: { limit } });
    return response.data;
  },

  async getMyPosts(params: { status?: string; page?: number; size?: number } = {}): Promise<PaginatedResponse<PostListItem>> {
    const response = await api.get<PaginatedResponse<PostListItem>>('/posts/my', { params });
    return response.data;
  },

  async getById(id: number): Promise<Post> {
    const response = await api.get<Post>(`/posts/${id}`);
    return response.data;
  },

  async getBySlug(slug: string): Promise<Post> {
    const response = await api.get<Post>(`/posts/slug/${slug}`);
    return response.data;
  },

  async create(data: PostCreateData): Promise<Post> {
    const response = await api.post<Post>('/posts', data);
    return response.data;
  },

  async update(id: number, data: PostUpdateData): Promise<Post> {
    const response = await api.put<Post>(`/posts/${id}`, data);
    return response.data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/posts/${id}`);
  },
};

export default postService;

