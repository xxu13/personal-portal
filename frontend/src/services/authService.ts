import api, { setToken, removeToken } from './api';
import { useAuthStore, User } from '../stores/authStore';

// Request types
interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

interface LoginRequest {
  username: string;
  password: string;
}

// Response types
interface TokenResponse {
  access_token: string;
  token_type: string;
}

// Auth service functions
export const authService = {
  /**
   * Register a new user
   */
  async register(data: RegisterRequest): Promise<User> {
    const response = await api.post<User>('/auth/register', data);
    return response.data;
  },
  
  /**
   * Login with username/email and password
   */
  async login(data: LoginRequest): Promise<{ user: User; token: string }> {
    // Use JSON login endpoint
    const tokenResponse = await api.post<TokenResponse>('/auth/login/json', data);
    const token = tokenResponse.data.access_token;
    
    // Set token for subsequent requests
    setToken(token);
    
    // Get user info
    const userResponse = await api.get<User>('/users/me');
    const user = userResponse.data;
    
    return { user, token };
  },
  
  /**
   * Logout current user
   */
  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore errors on logout
    } finally {
      removeToken();
      useAuthStore.getState().logout();
    }
  },
  
  /**
   * Refresh access token
   */
  async refreshToken(): Promise<string> {
    const response = await api.post<TokenResponse>('/auth/refresh');
    const token = response.data.access_token;
    setToken(token);
    useAuthStore.getState().setToken(token);
    return token;
  },
  
  /**
   * Get current user info
   */
  async getCurrentUser(): Promise<User> {
    const response = await api.get<User>('/users/me');
    return response.data;
  },
  
  /**
   * Update current user profile
   */
  async updateProfile(data: { nickname?: string; bio?: string; language_preference?: string }): Promise<User> {
    const response = await api.put<User>('/users/me', data);
    useAuthStore.getState().updateUser(response.data);
    return response.data;
  },
  
  /**
   * Update user avatar
   */
  async updateAvatar(file: File): Promise<User> {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.put<User>('/users/me/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    useAuthStore.getState().updateUser(response.data);
    return response.data;
  },
  
  /**
   * Change password
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await api.put('/users/me/password', {
      current_password: currentPassword,
      new_password: newPassword,
    });
  },
  
  /**
   * Check if user is authenticated (has valid token)
   */
  async checkAuth(): Promise<boolean> {
    const token = localStorage.getItem('access_token');
    if (!token) {
      return false;
    }
    
    try {
      const user = await authService.getCurrentUser();
      useAuthStore.getState().login(user, token);
      return true;
    } catch {
      removeToken();
      useAuthStore.getState().logout();
      return false;
    }
  },
};

export default authService;


