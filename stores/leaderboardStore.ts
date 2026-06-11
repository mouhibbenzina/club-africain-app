import { create } from 'zustand';
import { api } from '../services/localApi';
import { MOCK_LEADERBOARD } from '../services/mockData';

interface LeaderboardEntry { user_id: string; username: string; avatar?: string; cat_coins: number; rank: number; }
interface LeaderboardState { entries: LeaderboardEntry[]; isLoading: boolean; fetch: () => Promise<void>; }

export const useLeaderboardStore = create<LeaderboardState>((set) => ({
  entries: MOCK_LEADERBOARD as LeaderboardEntry[], isLoading: false,

  fetch: async () => {
    set({ isLoading: true });
    try { const data = await api.getLeaderboard(); if (data?.length) set({ entries: data }); } catch {}
    set({ isLoading: false });
  },
}));
