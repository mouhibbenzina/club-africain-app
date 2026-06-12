import { create } from 'zustand';
import { api, ApiError } from '../services/localApi';

export interface User { id: string; username: string; avatar?: string; role: 'fan' | 'vip' | 'admin'; }

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, username: string) => Promise<void>;
  signOut: () => Promise<void>;
  loadSession: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  error: null,

  signIn: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.signIn(email, password);
      if (!res.access_token) throw new ApiError('Token non reçu du serveur', 401);
      api.setToken(res.access_token);
      const u = res.user;
      const user: User = {
        id: u?.id || email,
        username: u?.email?.split('@')[0] || email.split('@')[0],
        role: 'fan',
      };
      set({ user, isAuthenticated: true, isLoading: false, error: null });
    } catch (err: any) {
      const msg = err instanceof ApiError ? err.message : 'Erreur de connexion au serveur';
      set({ isLoading: false, error: msg });
      throw err;
    }
  },

  signUp: async (email, password, username) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.signUp(email, password, username);
      const user: User = { id: res.user?.id || email, username, role: 'fan' };
      set({ user, isAuthenticated: true, isLoading: false, error: null });
    } catch (err: any) {
      const msg = err instanceof ApiError ? err.message : "Erreur lors de l'inscription";
      set({ isLoading: false, error: msg });
      throw err;
    }
  },

  signOut: async () => {
    api.setToken('');
    try { require('../services/secureStorage').SecureStorage.clear(); } catch {}
    set({ user: null, isAuthenticated: false, isLoading: false, error: null });
  },

  loadSession: async () => {
    set({ isLoading: true, error: null });
    try {
      await api.loadToken();
      const userData: any = await api.getCurrentUser();
      if (userData?.id) {
        set({
          user: { id: userData.id, username: userData.username || 'User', role: userData.role || 'fan' },
          isAuthenticated: true,
          isLoading: false,
        });
        return;
      }
    } catch {}
    set({ isLoading: false, isAuthenticated: false, user: null });
  },

  clearError: () => set({ error: null }),
}));
