import api from './api';
import { Category } from './postService';

// Re-export Category for convenience
export type { Category };

export interface CategoryDetail extends Category {
  description: string | null;
  sort_order: number;
  created_at: string;
}

export const categoryService = {
  async getAll(): Promise<Category[]> {
    const response = await api.get<Category[]>('/categories');
    return response.data;
  },

  async getBySlug(slug: string): Promise<CategoryDetail> {
    const response = await api.get<CategoryDetail>(`/categories/${slug}`);
    return response.data;
  },
};

export default categoryService;

