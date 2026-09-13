import { create } from 'zustand';
import { api } from '../services/localApi';

interface LeaderboardEntry { user_id: string; username: string; avatar?: string; cat_coins: number; rank: number; }

interface LeaderboardState {
  entries: LeaderboardEntry[];
  isLoading: boolean;
  error: string | null;
  fetch: () => Promise<void>;
}

export const useLeaderboardStore = create<LeaderboardState>((set) => ({
  entries: [],
  isLoading: false,
  error: null,

  fetch: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await api.getLeaderboard();
      if (data?.length) set({ entries: data });
      else set({ entries: [] });
    } catch (err: any) {
      set({ error: err.message || 'Erreur de chargement du classement' });
    }
    set({ isLoading: false });
  },
}));
