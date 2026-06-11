import { create } from 'zustand';
import { api } from '../services/localApi';
import { MOCK_FANTASY_TEAM } from '../services/mockData';

interface GameState {
  predictions: Record<number, { home: number; away: number }>;
  myTeam: { formation: string; players: string[] } | null;
  votedMatches: number[]; isLoading: boolean;
  submitPrediction: (userId: string, matchId: number, home: number, away: number) => Promise<void>;
  saveTeam: (userId: string, formation: string, players: string[]) => Promise<void>;
  loadTeam: (userId: string) => Promise<void>;
  votePlayer: (userId: string, matchId: number, player: string) => Promise<void>;
}

export const useGameStore = create<GameState>((set) => ({
  predictions: {}, myTeam: MOCK_FANTASY_TEAM, votedMatches: [], isLoading: false,

  submitPrediction: async (_, matchId, home, away) => {
    try { await api.submitPrediction(matchId, home, away); } catch {}
    set((s) => ({ predictions: { ...s.predictions, [matchId]: { home, away } } }));
  },

  saveTeam: async (_, formation, players) => {
    try { await api.saveFantasyTeam(formation, players); } catch {}
    set({ myTeam: { formation, players } });
  },

  loadTeam: async () => {
    try {
      const data = await api.getFantasyTeam();
      if (data?.[0]) set({ myTeam: { formation: data[0].formation, players: JSON.parse(data[0].players) } });
    } catch { /* keep mock */ }
  },

  votePlayer: async (_, matchId, player) => {
    try { await api.votePlayer(matchId, player); } catch {}
    set((s) => ({ votedMatches: [...s.votedMatches, matchId] }));
  },
}));
