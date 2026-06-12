import { create } from 'zustand';
import { api } from '../services/localApi';

interface GameState {
  predictions: Record<number, { home: number; away: number }>;
  myTeam: { formation: string; players: string[] } | null;
  votedMatches: number[];
  isLoading: boolean;
  error: string | null;
  submitPrediction: (userId: string, matchId: number, home: number, away: number) => Promise<void>;
  saveTeam: (userId: string, formation: string, players: string[]) => Promise<void>;
  loadTeam: (userId: string) => Promise<void>;
  votePlayer: (userId: string, matchId: number, player: string) => Promise<void>;
}

export const useGameStore = create<GameState>((set) => ({
  predictions: {},
  myTeam: null,
  votedMatches: [],
  isLoading: false,
  error: null,

  submitPrediction: async (_, matchId, home, away) => {
    set({ error: null });
    try {
      await api.submitPrediction(matchId, home, away);
      set((s) => ({ predictions: { ...s.predictions, [matchId]: { home, away } } }));
    } catch (err: any) {
      set({ error: err.message || 'Erreur lors de la prédiction' });
    }
  },

  saveTeam: async (_, formation, players) => {
    set({ error: null });
    try {
      await api.saveFantasyTeam(formation, players);
      set({ myTeam: { formation, players } });
    } catch (err: any) {
      set({ error: err.message || 'Erreur lors de la sauvegarde' });
    }
  },

  loadTeam: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await api.getFantasyTeam();
      if (data?.[0]) {
        set({ myTeam: { formation: data[0].formation, players: JSON.parse(data[0].players || '[]') } });
      }
    } catch (err: any) {
      set({ error: err.message || 'Erreur de chargement' });
    }
    set({ isLoading: false });
  },

  votePlayer: async (_, matchId, player) => {
    set({ error: null });
    try {
      await api.votePlayer(matchId, player);
      set((s) => ({ votedMatches: [...s.votedMatches, matchId] }));
    } catch (err: any) {
      set({ error: err.message || 'Erreur lors du vote' });
    }
  },
}));
