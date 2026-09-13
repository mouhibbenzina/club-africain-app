import { create } from 'zustand';
import { api } from '../services/localApi';

interface Player { id: number; sport_id: number; name: string; number?: number; position?: string; nationality?: string; age?: number; image_url?: string; stats?: string; active?: number; sport_label?: string; }

interface Standing { id: number; sport_id: number; team_name: string; played: number; won: number; drawn: number; lost: number; goals_for: number; goals_against: number; points: number; season?: string; sport_label?: string; sport_color?: string; }

interface MediaItem { id: number; sport_id?: number; type: string; title: string; url?: string; thumbnail_url?: string; duration?: number; created_at: string; sport_label?: string; }

interface PlayerState {
  players: Player[];
  selectedPlayer: Player | null;
  standings: Standing[];
  media: MediaItem[];
  isLoading: boolean;
  error: string | null;
  fetchPlayers: (sportId?: number) => Promise<void>;
  fetchPlayer: (id: number) => Promise<void>;
  fetchStandings: (sportId?: number, season?: string) => Promise<void>;
  fetchMedia: (sportId?: number, type?: string) => Promise<void>;
}

export const usePlayerStore = create<PlayerState>((set) => ({
  players: [],
  selectedPlayer: null,
  standings: [],
  media: [],
  isLoading: false,
  error: null,

  fetchPlayers: async (sportId) => {
    set({ isLoading: true, error: null });
    try {
      const data = await api.getPlayers(sportId);
      if (data?.length) set({ players: data });
      else set({ players: [] });
    } catch (err: any) {
      set({ error: err.message || 'Erreur de chargement des joueurs' });
    }
    set({ isLoading: false });
  },

  fetchPlayer: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const data = await api.getPlayer(id);
      set({ selectedPlayer: data });
    } catch (err: any) {
      set({ error: err.message || 'Erreur de chargement' });
    }
    set({ isLoading: false });
  },

  fetchStandings: async (sportId, season) => {
    set({ error: null });
    try {
      const data = await api.getStandings(sportId, season);
      if (data?.length) set({ standings: data });
      else set({ standings: [] });
    } catch (err: any) {
      set({ error: err.message || 'Erreur de chargement du classement' });
    }
  },

  fetchMedia: async (sportId, type) => {
    set({ error: null });
    try {
      const data = await api.getMedia(sportId, type);
      if (data?.length) set({ media: data });
      else set({ media: [] });
    } catch (err: any) {
      set({ error: err.message || 'Erreur de chargement des médias' });
    }
  },
}));
