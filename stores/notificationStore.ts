import { create } from 'zustand';
import { api } from '../services/localApi';

interface Notification { id: number; title: string; type: string; read: boolean; created_at: string; }

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  fetch: (userId: string) => Promise<void>;
  markRead: (id: number) => Promise<void>;
  markAllRead: () => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,

  fetch: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await api.getNotifications();
      if (data?.length) {
        set({ notifications: data, unreadCount: data.filter((n: any) => !n.read).length });
      } else {
        set({ notifications: [], unreadCount: 0 });
      }
    } catch (err: any) {
      set({ error: err.message || 'Erreur de chargement' });
    }
    set({ isLoading: false });
  },

  markRead: async (id) => {
    try {
      await api.markNotificationRead(id);
      set((s) => ({
        notifications: s.notifications.map((n) =>
          n.id === id ? { ...n, read: true } : n
        ),
        unreadCount: Math.max(0, s.unreadCount - 1),
      }));
    } catch {}
  },

  markAllRead: async () => {
    try {
      await api.markAllNotificationsRead();
      set((s) => ({
        notifications: s.notifications.map((n) => ({ ...n, read: true })),
        unreadCount: 0,
      }));
    } catch {}
  },
}));
