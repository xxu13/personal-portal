import api from './api';

// Types
export interface FavoritePost {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  cover_image: string | null;
}

export interface Favorite {
  id: number;
  user_id: number;
  post_id: number;
  note: string | null;
  created_at: string;
  post: FavoritePost | null;
}

export interface FavoriteStatus {
  favorited: boolean;
  favorite_id: number | null;
}

export interface FavoriteCreateData {
  post_id: number;
  note?: string;
}

export interface FavoriteUpdateData {
  note?: string;
}

export interface FavoriteListResponse {
  items: Favorite[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

// Service
export const favoriteService = {
  async getMyFavorites(page = 1, size = 20): Promise<FavoriteListResponse> {
    const response = await api.get<FavoriteListResponse>('/favorites', {
      params: { page, size },
    });
    return response.data;
  },

  async create(data: FavoriteCreateData): Promise<Favorite> {
    const response = await api.post<Favorite>('/favorites', data);
    return response.data;
  },

  async update(favoriteId: number, data: FavoriteUpdateData): Promise<Favorite> {
    const response = await api.put<Favorite>(`/favorites/${favoriteId}`, data);
    return response.data;
  },

  async delete(favoriteId: number): Promise<void> {
    await api.delete(`/favorites/${favoriteId}`);
  },

  async unfavoritePost(postId: number): Promise<void> {
    await api.delete(`/favorites/post/${postId}`);
  },

  async getStatus(postId: number): Promise<FavoriteStatus> {
    const response = await api.get<FavoriteStatus>(`/favorites/status/${postId}`);
    return response.data;
  },

  // Helper to toggle favorite
  async toggle(postId: number, currentlyFavorited: boolean): Promise<boolean> {
    if (currentlyFavorited) {
      await this.unfavoritePost(postId);
      return false;
    } else {
      await this.create({ post_id: postId });
      return true;
    }
  },
};

export default favoriteService;

