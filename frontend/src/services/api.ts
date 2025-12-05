import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { message } from 'antd';

// API base URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

// Token storage key
const TOKEN_KEY = 'access_token';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Get token from localStorage
    const token = localStorage.getItem(TOKEN_KEY);
    
    // Add Authorization header if token exists
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    // Return data directly for successful responses
    return response;
  },
  (error: AxiosError<{ detail?: string; message?: string }>) => {
    // Handle different error scenarios
    if (error.response) {
      const { status, data } = error.response;
      const errorMessage = data?.detail || data?.message || 'An error occurred';
      
      switch (status) {
        case 401:
          // Unauthorized - clear token and redirect to login
          localStorage.removeItem(TOKEN_KEY);
          // Only show message if not already on login page
          if (!window.location.pathname.includes('/auth/login')) {
            message.error('Session expired, please login again');
            window.location.href = '/auth/login';
          }
          break;
          
        case 403:
          message.error('You do not have permission to perform this action');
          break;
          
        case 404:
          message.error('Resource not found');
          break;
          
        case 422:
          // Validation error
          message.error(errorMessage);
          break;
          
        case 500:
          message.error('Server error, please try again later');
          break;
          
        default:
          message.error(errorMessage);
      }
    } else if (error.request) {
      // Network error
      message.error('Network error, please check your connection');
    } else {
      message.error('Request failed');
    }
    
    return Promise.reject(error);
  }
);

// Token management utilities
export const setToken = (token: string) => {
  localStorage.setItem(TOKEN_KEY, token);
};

export const getToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

export const removeToken = () => {
  localStorage.removeItem(TOKEN_KEY);
};

export const isAuthenticated = (): boolean => {
  return !!getToken();
};

// Export the api instance
export default api;

// Type for API response wrapper
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

// Type for paginated response
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

// Common query parameters type
export interface QueryParams {
  page?: number;
  size?: number;
  search?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  [key: string]: string | number | boolean | undefined;
}

