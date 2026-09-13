import { create } from 'zustand';
import { api } from '../services/localApi';

interface Sport { id: number; name: string; label: string; icon?: string; color: string; enabled: number; }

interface SportMatch {
  id: number;
  sport_id: number;
  home_team: string;
  away_team: string;
  date: string;
  venue: string;
  is_live?: number;
  viewers?: number;
  home_score?: number;
  away_score?: number;
  status: string;
  competition?: string;
  sport_name?: string;
  sport_label?: string;
  sport_color?: string;
}

interface SportState {
  sports: Sport[];
  activeSportId: number | null;
  matches: SportMatch[];
  liveMatches: SportMatch[];
  isLoading: boolean;
  error: string | null;
  setActiveSport: (id: number | null) => void;
  fetchSports: () => Promise<void>;
  fetchMatches: (sportId?: number, status?: string) => Promise<void>;
  fetchLiveScores: () => Promise<void>;
}

export const useSportStore = create<SportState>((set, get) => ({
  sports: [],
  activeSportId: null,
  matches: [],
  liveMatches: [],
  isLoading: false,
  error: null,

  setActiveSport: (id) => set({ activeSportId: id }),

  fetchSports: async () => {
    try {
      const data = await api.getSports();
      if (data?.length) set({ sports: data });
    } catch {}
  },

  fetchMatches: async (sportId, status) => {
    set({ isLoading: true, error: null });
    try {
      const data = await api.getSportMatches(sportId, status);
      if (data?.length) set({ matches: data });
      else set({ matches: [] });
    } catch (err: any) {
      set({ error: err.message || 'Erreur de chargement des matchs' });
    }
    set({ isLoading: false });
  },

  fetchLiveScores: async () => {
    try {
      const data = await api.getLiveScores();
      if (data?.length) set({ liveMatches: data });
      else if (get().liveMatches.length > 0) set({ liveMatches: [] });
    } catch {}
  },
}));
