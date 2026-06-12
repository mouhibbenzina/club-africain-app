import { create } from 'zustand';
import { api } from '../services/localApi';

export interface Match {
  id: number;
  home_team: string;
  away_team: string;
  date: string;
  venue: string;
  is_live: boolean;
  viewers: number;
  home_score?: number;
  away_score?: number;
  status: 'upcoming' | 'live' | 'finished';
}

interface MatchState {
  liveMatch: Match | null;
  upcomingMatches: Match[];
  pastMatches: Match[];
  isLoading: boolean;
  error: string | null;
  fetchMatches: () => Promise<void>;
}

export const useMatchStore = create<MatchState>((set) => ({
  liveMatch: null,
  upcomingMatches: [],
  pastMatches: [],
  isLoading: false,
  error: null,

  fetchMatches: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await api.getMatches();
      if (data?.length) {
        set({
          liveMatch: data.find((m: any) => m.status === 'live') || null,
          upcomingMatches: data.filter((m: any) => m.status === 'upcoming') || [],
          pastMatches: data.filter((m: any) => m.status === 'finished') || [],
        });
      } else {
        set({ liveMatch: null, upcomingMatches: [], pastMatches: [] });
      }
    } catch (err: any) {
      set({ error: err.message || 'Erreur de chargement des matchs' });
    }
    set({ isLoading: false });
  },
}));
