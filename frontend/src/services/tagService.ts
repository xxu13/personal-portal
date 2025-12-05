import api from './api';
import { Tag } from './postService';

export interface TagDetail extends Tag {
  created_at: string;
}

export const tagService = {
  async getAll(): Promise<Tag[]> {
    const response = await api.get<Tag[]>('/tags');
    return response.data;
  },

  async getPopular(limit = 20): Promise<Tag[]> {
    const response = await api.get<Tag[]>('/tags/popular', { params: { limit } });
    return response.data;
  },

  async getBySlug(slug: string): Promise<TagDetail> {
    const response = await api.get<TagDetail>(`/tags/${slug}`);
    return response.data;
  },
};

export default tagService;

