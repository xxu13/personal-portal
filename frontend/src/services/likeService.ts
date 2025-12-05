import api from './api';

// Types
export type TargetType = 'post' | 'comment';

export interface Like {
  id: number;
  user_id: number;
  target_type: string;
  target_id: number;
  created_at: string;
}

export interface LikeStatus {
  liked: boolean;
  like_id: number | null;
}

export interface LikeCount {
  count: number;
  liked: boolean;
}

export interface LikeCreateData {
  target_type: TargetType;
  target_id: number;
}

// Service
export const likeService = {
  async create(data: LikeCreateData): Promise<Like> {
    const response = await api.post<Like>('/likes', data);
    return response.data;
  },

  async delete(likeId: number): Promise<void> {
    await api.delete(`/likes/${likeId}`);
  },

  async unlike(targetType: TargetType, targetId: number): Promise<void> {
    await api.delete(`/likes/target/${targetType}/${targetId}`);
  },

  async getStatus(targetType: TargetType, targetId: number): Promise<LikeStatus> {
    const response = await api.get<LikeStatus>(`/likes/status/${targetType}/${targetId}`);
    return response.data;
  },

  async getCount(targetType: TargetType, targetId: number): Promise<LikeCount> {
    const response = await api.get<LikeCount>(`/likes/count/${targetType}/${targetId}`);
    return response.data;
  },

  // Helper to toggle like
  async toggle(targetType: TargetType, targetId: number, currentlyLiked: boolean): Promise<boolean> {
    if (currentlyLiked) {
      await this.unlike(targetType, targetId);
      return false;
    } else {
      await this.create({ target_type: targetType, target_id: targetId });
      return true;
    }
  },
};

export default likeService;

