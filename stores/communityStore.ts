import { create } from 'zustand';
import { api } from '../services/localApi';

interface FanPost {
  id: number;
  user_id: string;
  username?: string;
  avatar?: string;
  content: string;
  likes: number;
  replies: number;
  created_at: string;
}

interface CommunityState {
  posts: FanPost[];
  isLoading: boolean;
  error: string | null;
  fetchPosts: () => Promise<void>;
  createPost: (content: string) => Promise<void>;
  likePost: (id: number) => Promise<void>;
  replyPost: (id: number) => Promise<void>;
}

export const useCommunityStore = create<CommunityState>((set) => ({
  posts: [],
  isLoading: false,
  error: null,

  fetchPosts: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await api.getFanPosts();
      if (data?.length) set({ posts: data });
      else set({ posts: [] });
    } catch (err: any) {
      set({ error: err.message || 'Erreur de chargement' });
    }
    set({ isLoading: false });
  },

  createPost: async (content) => {
    set({ isLoading: true, error: null });
    try {
      const post = await api.createFanPost(content);
      if (post) set((s) => ({ posts: [post, ...s.posts] }));
    } catch (err: any) {
      set({ error: err.message || 'Erreur lors de la publication' });
    }
    set({ isLoading: false });
  },

  likePost: async (id) => {
    try {
      await api.likeFanPost(id);
    } catch {}
    set((s) => ({
      posts: s.posts.map((p) =>
        p.id === id ? { ...p, likes: p.likes + 1 } : p
      ),
    }));
  },

  replyPost: async (id) => {
    try {
      await api.replyFanPost(id);
    } catch {}
    set((s) => ({
      posts: s.posts.map((p) =>
        p.id === id ? { ...p, replies: p.replies + 1 } : p
      ),
    }));
  },
}));
