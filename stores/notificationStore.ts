import { create } from 'zustand';
import { api } from '../services/localApi';
import { MOCK_NOTIFICATIONS } from '../services/mockData';

interface Notification { id: number; title: string; type: string; read: boolean; created_at: string; }
interface NotificationState { notifications: Notification[]; unreadCount: number; isLoading: boolean; fetch: (userId: string) => Promise<void>; markRead: (id: number) => Promise<void>; markAllRead: () => Promise<void>; }

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: MOCK_NOTIFICATIONS as Notification[],
  unreadCount: MOCK_NOTIFICATIONS.filter((n) => !n.read).length,
  isLoading: false,

  fetch: async () => {
    set({ isLoading: true });
    try { const data = await api.getNotifications(); if (data?.length) set({ notifications: data, unreadCount: data.filter((n: any) => !n.read).length }); } catch {}
    set({ isLoading: false });
  },

  markRead: async (id) => {
    try { await api.markNotificationRead(id); } catch {}
    set((s) => ({ notifications: s.notifications.map((n) => n.id === id ? { ...n, read: true } : n), unreadCount: Math.max(0, s.unreadCount - 1) }));
  },

  markAllRead: async () => {
    try { await api.markAllNotificationsRead(); } catch {}
    set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, read: true })), unreadCount: 0 }));
  },
}));
