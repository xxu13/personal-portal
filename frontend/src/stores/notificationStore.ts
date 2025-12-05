import { create } from 'zustand';

interface NotificationState {
  unreadNotifications: number;
  unreadMessages: number;
  wsConnected: boolean;
  setUnreadNotifications: (count: number) => void;
  setUnreadMessages: (count: number) => void;
  incrementNotifications: () => void;
  incrementMessages: () => void;
  setWsConnected: (connected: boolean) => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  unreadNotifications: 0,
  unreadMessages: 0,
  wsConnected: false,
  
  setUnreadNotifications: (count) => set({ unreadNotifications: count }),
  setUnreadMessages: (count) => set({ unreadMessages: count }),
  
  incrementNotifications: () => set((state) => ({
    unreadNotifications: state.unreadNotifications + 1,
  })),
  
  incrementMessages: () => set((state) => ({
    unreadMessages: state.unreadMessages + 1,
  })),
  
  setWsConnected: (connected) => set({ wsConnected: connected }),
}));

export default useNotificationStore;

