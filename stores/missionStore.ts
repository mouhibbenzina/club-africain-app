import { create } from 'zustand';
import { api } from '../services/localApi';

interface Mission {
  id: number;
  mission_type: string;
  label: string;
  coins: number;
  completed: boolean;
  claimed: boolean;
  progress: string;
}

interface MissionState {
  missions: Mission[];
  isLoading: boolean;
  error: string | null;
  fetchMissions: (userId: string) => Promise<void>;
  claimMission: (missionId: number) => Promise<void>;
  claimAll: () => Promise<void>;
}

export const useMissionStore = create<MissionState>((set) => ({
  missions: [],
  isLoading: false,
  error: null,

  fetchMissions: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await api.getMissions();
      if (data?.length) set({ missions: data });
      else set({ missions: [] });
    } catch (err: any) {
      set({ error: err.message || 'Erreur de chargement des missions' });
    }
    set({ isLoading: false });
  },

  claimMission: async (missionId) => {
    try {
      await api.claimMission(missionId);
      set((s) => ({
        missions: s.missions.map((m) =>
          m.id === missionId ? { ...m, claimed: true } : m
        ),
      }));
    } catch (err: any) {
      set({ error: err.message || 'Erreur lors de la réclamation' });
    }
  },

  claimAll: async () => {
    try {
      await api.claimAllMissions();
      set((s) => ({
        missions: s.missions.map((m) =>
          !m.claimed && m.completed ? { ...m, claimed: true } : m
        ),
      }));
    } catch (err: any) {
      set({ error: err.message || 'Erreur lors de la réclamation' });
    }
  },
}));
