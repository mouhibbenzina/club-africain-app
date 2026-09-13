import { create } from 'zustand';
import { api } from '../services/localApi';

export interface Member {
  user_id: string;
  username: string;
  avatar?: string;
  role?: string;
  cat_coins: number;
  donations_count?: number;
  predictions_count?: number;
  posts_count?: number;
  friends_count?: number;
  created_at?: string;
}

export interface FriendRequest {
  request_id: number;
  user_id: string;
  username: string;
  avatar?: string;
  role?: string;
  created_at?: string;
}

interface FriendsState {
  members: Member[];
  friends: Member[];
  requests: FriendRequest[];
  sent: Member[];
  isLoading: boolean;
  error: string | null;
  loadMembers: (query?: string) => Promise<void>;
  loadFriends: () => Promise<void>;
  loadRequests: () => Promise<void>;
  sendRequest: (userId: string) => Promise<void>;
  acceptRequest: (requestId: number) => Promise<void>;
  declineRequest: (requestId: number) => Promise<void>;
  cancelRequest: (userId: string) => Promise<void>;
  unfriend: (userId: string) => Promise<void>;
}

export const useFriendsStore = create<FriendsState>((set, get) => ({
  members: [],
  friends: [],
  requests: [],
  sent: [],
  isLoading: false,
  error: null,

  loadMembers: async (query) => {
    set({ isLoading: true, error: null });
    try {
      const data = await api.getMembers(query);
      set({ members: data || [], isLoading: false });
    } catch (err: any) {
      set({ error: err.message || 'Erreur de chargement', isLoading: false });
    }
  },

  loadFriends: async () => {
    try {
      const [friends, sent] = await Promise.all([api.getFriends(), api.getSentRequests()]);
      set({ friends: friends || [], sent: sent || [] });
    } catch (err: any) {
      set({ error: err.message || 'Erreur de chargement' });
    }
  },

  loadRequests: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await api.getFriendRequests();
      set({ requests: data || [], isLoading: false });
    } catch (err: any) {
      set({ error: err.message || 'Erreur de chargement', isLoading: false });
    }
  },

  sendRequest: async (userId) => {
    set({ error: null });
    try {
      await api.sendFriendRequest(userId);
      await get().loadFriends();
      await get().loadMembers();
    } catch (err: any) {
      set({ error: err.message || 'Erreur lors de la demande' });
      throw err;
    }
  },

  acceptRequest: async (requestId) => {
    set({ error: null });
    try {
      await api.acceptFriendRequest(requestId);
      await get().loadRequests();
      await get().loadFriends();
    } catch (err: any) {
      set({ error: err.message || 'Erreur lors de l\'acceptation' });
    }
  },

  declineRequest: async (requestId) => {
    set({ error: null });
    try {
      await api.declineFriendRequest(requestId);
      await get().loadRequests();
    } catch (err: any) {
      set({ error: err.message || 'Erreur' });
    }
  },

  cancelRequest: async (userId) => {
    set({ error: null });
    try {
      await api.cancelFriendRequest(userId);
      await get().loadFriends();
    } catch (err: any) {
      set({ error: err.message || 'Erreur' });
    }
  },

  unfriend: async (userId) => {
    set({ error: null });
    try {
      await api.unfriend(userId);
      await get().loadFriends();
      await get().loadMembers();
    } catch (err: any) {
      set({ error: err.message || 'Erreur' });
    }
  },
}));