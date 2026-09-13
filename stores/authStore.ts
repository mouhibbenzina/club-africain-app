import { create } from 'zustand';
import { api, ApiError } from '../services/localApi';
import { SecureStorage } from '../services/secureStorage';

export interface User {
  id: string;
  email?: string;
  username: string;
  avatar?: string;
  role: 'fan' | 'vip' | 'admin';
  full_name?: string;
  phone?: string;
  email_verified?: number;
}

function mapUser(u: any): User {
  return {
    id: u.id,
    email: u.email || undefined,
    username: u.username || u.email?.split('@')[0] || 'Utilisateur',
    avatar: u.avatar || '',
    role: u.role || 'fan',
    full_name: u.full_name || undefined,
    phone: u.phone || undefined,
    email_verified: u.email_verified ? 1 : 0,
  };
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, username: string) => Promise<void>;
  signOut: () => Promise<void>;
  loadSession: () => Promise<void>;
  updateUser: (patch: Partial<User>) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
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
      const user = mapUser(res.user);
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
      if (res.access_token) api.setToken(res.access_token);
      const user = mapUser(res.user || { id: email, username, role: 'fan' });
      set({ user, isAuthenticated: true, isLoading: false, error: null });
    } catch (err: any) {
      const msg = err instanceof ApiError ? err.message : "Erreur lors de l'inscription";
      set({ isLoading: false, error: msg });
      throw err;
    }
  },

  signOut: async () => {
    api.setToken('');
    try { await SecureStorage.clear(); } catch {}
    set({ user: null, isAuthenticated: false, isLoading: false, error: null });
  },

  loadSession: async () => {
    set({ isLoading: true, error: null });
    try {
      await api.loadToken();
      const userData: any = await api.getCurrentUser();
      if (userData?.id) {
        set({ user: mapUser(userData), isAuthenticated: true, isLoading: false });
        return;
      }
    } catch {}
    set({ isLoading: false, isAuthenticated: false, user: null });
  },

  updateUser: (patch) => {
    const prev = get().user;
    if (!prev) return;
    set({ user: { ...prev, ...patch } });
  },

  clearError: () => set({ error: null }),
}));
