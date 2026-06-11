import { create } from 'zustand';
import { api } from '../services/localApi';
import { MOCK_USER } from '../services/mockData';

interface User { id: string; username: string; avatar?: string; role: 'fan' | 'vip' | 'admin'; }
interface AuthState {
  user: User | null; isLoading: boolean; isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, username: string) => Promise<void>;
  signOut: () => Promise<void>;
  loadSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null, isLoading: true, isAuthenticated: false,

  signIn: async () => {
    try {
      const res = await api.signIn('demo@clubafricain.tn', 'demo');
      if (res.access_token) api.setToken(res.access_token);
      set({ user: MOCK_USER, isAuthenticated: true });
    } catch {
      set({ user: MOCK_USER, isAuthenticated: true });
    }
  },

  signUp: async (_email, _password, username) => {
    try { await api.signUp(_email, _password, username); } catch {}
    set({ user: { ...MOCK_USER, username }, isAuthenticated: true });
  },

  signOut: async () => { set({ user: null, isAuthenticated: false }); },

  loadSession: async () => {
    try { await api.signIn('demo@clubafricain.tn', 'demo'); } catch {}
    set({ user: MOCK_USER, isAuthenticated: true, isLoading: false });
  },
}));
