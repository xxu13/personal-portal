import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// User type definition
export interface User {
  id: number;
  username: string;
  email: string;
  nickname: string | null;
  avatar: string | null;
  bio: string | null;
  role: string;
  language_preference: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface AuthState {
  // State
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Actions
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  login: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      
      // Set user
      setUser: (user) => set({ 
        user, 
        isAuthenticated: user !== null,
      }),
      
      // Set token
      setToken: (token) => {
        if (token) {
          localStorage.setItem('access_token', token);
        } else {
          localStorage.removeItem('access_token');
        }
        set({ token });
      },
      
      // Login - set both user and token
      login: (user, token) => {
        localStorage.setItem('access_token', token);
        set({ 
          user, 
          token, 
          isAuthenticated: true,
          isLoading: false,
        });
      },
      
      // Logout - clear all auth state
      logout: () => {
        localStorage.removeItem('access_token');
        set({ 
          user: null, 
          token: null, 
          isAuthenticated: false,
          isLoading: false,
        });
      },
      
      // Update user partially
      updateUser: (updates) => {
        const currentUser = get().user;
        if (currentUser) {
          set({ user: { ...currentUser, ...updates } });
        }
      },
      
      // Set loading state
      setLoading: (loading) => set({ isLoading: loading }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Selector hooks for common use cases
export const useUser = () => useAuthStore((state) => state.user);
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated);
export const useIsAdmin = () => useAuthStore((state) => state.user?.role === 'admin');



