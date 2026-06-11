import { create } from 'zustand';
import { api } from '../services/localApi';
import { MOCK_MATCHES } from '../services/mockData';

interface Match { id: number; home_team: string; away_team: string; date: string; venue: string; is_live: boolean; viewers: number; home_score?: number; away_score?: number; status: 'upcoming' | 'live' | 'finished'; }
interface MatchState { liveMatch: Match | null; upcomingMatches: Match[]; pastMatches: Match[]; isLoading: boolean; fetchMatches: () => Promise<void>; }

export const useMatchStore = create<MatchState>((set) => ({
  liveMatch: MOCK_MATCHES.live as Match,
  upcomingMatches: MOCK_MATCHES.upcoming as Match[],
  pastMatches: MOCK_MATCHES.past as Match[],
  isLoading: false,

  fetchMatches: async () => {
    set({ isLoading: true });
    try {
      const data = await api.getMatches();
      if (data?.length) {
        set({
          liveMatch: data.find((m: any) => m.status === 'live') || null,
          upcomingMatches: data.filter((m: any) => m.status === 'upcoming'),
          pastMatches: data.filter((m: any) => m.status === 'finished'),
        });
      }
    } catch { /* keep mock */ }
    set({ isLoading: false });
  },
}));
