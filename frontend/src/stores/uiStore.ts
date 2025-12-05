import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Locale = 'zh' | 'en';
export type Theme = 'dark' | 'light';

interface UIState {
  // Language
  locale: Locale;
  setLocale: (locale: Locale) => void;
  
  // Theme (currently only dark is supported)
  theme: Theme;
  setTheme: (theme: Theme) => void;
  
  // Sidebar
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;
  
  // Mobile menu
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  toggleMobileMenu: () => void;
  
  // Global loading
  loading: boolean;
  setLoading: (loading: boolean) => void;
  
  // Page loading (for route transitions)
  pageLoading: boolean;
  setPageLoading: (loading: boolean) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      // Language - default to Chinese
      locale: 'zh',
      setLocale: (locale) => set({ locale }),
      
      // Theme - default to dark
      theme: 'dark',
      setTheme: (theme) => set({ theme }),
      
      // Sidebar - default expanded
      sidebarCollapsed: false,
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      
      // Mobile menu - default closed
      mobileMenuOpen: false,
      setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),
      toggleMobileMenu: () => set((state) => ({ mobileMenuOpen: !state.mobileMenuOpen })),
      
      // Global loading
      loading: false,
      setLoading: (loading) => set({ loading }),
      
      // Page loading
      pageLoading: false,
      setPageLoading: (loading) => set({ pageLoading: loading }),
    }),
    {
      name: 'ui-storage',
      partialize: (state) => ({
        locale: state.locale,
        theme: state.theme,
        sidebarCollapsed: state.sidebarCollapsed,
      }),
    }
  )
);

// Selector hooks for common use cases
export const useLocale = () => useUIStore((state) => state.locale);
export const useTheme = () => useUIStore((state) => state.theme);
export const useSidebarCollapsed = () => useUIStore((state) => state.sidebarCollapsed);
export const useLoading = () => useUIStore((state) => state.loading);

