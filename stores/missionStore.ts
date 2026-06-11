import { create } from 'zustand';
import { api } from '../services/localApi';
import { MOCK_MISSIONS } from '../services/mockData';

interface Mission { id: number; mission_type: string; label: string; coins: number; completed: boolean; claimed: boolean; progress: string; }
interface MissionState { missions: Mission[]; isLoading: boolean; fetchMissions: (userId: string) => Promise<void>; claimMission: (missionId: number) => Promise<void>; claimAll: () => Promise<void>; }

export const useMissionStore = create<MissionState>((set) => ({
  missions: MOCK_MISSIONS as Mission[], isLoading: false,

  fetchMissions: async () => {
    set({ isLoading: true });
    try { const data = await api.getMissions(); if (data?.length) set({ missions: data }); } catch {}
    set({ isLoading: false });
  },

  claimMission: async (missionId) => {
    try { await api.claimMission(missionId); } catch {}
    set((s) => ({ missions: s.missions.map((m) => m.id === missionId ? { ...m, claimed: true } : m) }));
  },

  claimAll: async () => {
    try { await api.claimAllMissions(); } catch {}
    set((s) => ({ missions: s.missions.map((m) => !m.claimed && m.completed ? { ...m, claimed: true } : m) }));
  },
}));
