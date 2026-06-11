import { create } from 'zustand';
import { api } from '../services/localApi';
import { MOCK_USER } from '../services/mockData';

export interface User { id: string; username: string; avatar?: string; role: 'fan' | 'vip' | 'admin'; }
interface AuthState {
  user: User | null; isLoading: boolean; isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, username: string) => Promise<void>;
  signOut: () => Promise<void>;
  loadSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null, isLoading: true, isAuthenticated: false,

  signIn: async (email, password) => {
    set({ isLoading: true });
    try {
      const res = await api.signIn(email, password);
      if (res.access_token) api.setToken(res.access_token);
      const user = res.user ? { id: res.user.id, username: res.user.email?.split('@')[0] || 'User', role: 'fan' as const } : MOCK_USER;
      set({ user, isAuthenticated: true, isLoading: false });
    } catch {
      set({ user: MOCK_USER, isAuthenticated: true, isLoading: false });
    }
  },

  signUp: async (email, password, username) => {
    set({ isLoading: true });
    try {
      const res = await api.signUp(email, password, username);
      const user = res.user ? { id: res.user.id, username, role: 'fan' as const } : { ...MOCK_USER, username };
      set({ user, isAuthenticated: true, isLoading: false });
    } catch {
      set({ user: { ...MOCK_USER, username }, isAuthenticated: true, isLoading: false });
    }
  },

  signOut: async () => {
    api.setToken('');
    try { require('../services/secureStorage').SecureStorage.clear(); } catch {}
    set({ user: null, isAuthenticated: false, isLoading: false });
  },

  loadSession: async () => {
    set({ isLoading: true });
    try {
      await api.loadToken();
    } catch {}
    try {
      const user = await api.getCurrentUser().catch(() => null);
      if (user) {
        set({ user: { id: user.id, username: user.username || 'User', role: user.role || 'fan' }, isAuthenticated: true, isLoading: false });
        return;
      }
    } catch {}
    try {
      const res = await api.signIn('demo@clubafricain.tn', 'demo');
      if (res.access_token) api.setToken(res.access_token);
      const user = res.user ? { id: res.user.id, username: res.user.email?.split('@')[0] || 'Clubiste_1920', role: 'fan' as const } : MOCK_USER;
      set({ user, isAuthenticated: true, isLoading: false });
    } catch {
      set({ user: MOCK_USER, isAuthenticated: true, isLoading: false });
    }
  },
}));
