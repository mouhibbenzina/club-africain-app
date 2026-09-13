import { create } from 'zustand';
import { api } from '../services/localApi';

interface NewsItem {
  id: number;
  sport_id?: number;
  title: string;
  excerpt?: string;
  content?: string;
  image_url?: string;
  author?: string;
  published?: number;
  created_at: string;
  sport_label?: string;
  sport_color?: string;
}

interface NewsState {
  news: NewsItem[];
  selectedNews: NewsItem | null;
  isLoading: boolean;
  error: string | null;
  fetchNews: (sportId?: number) => Promise<void>;
  fetchNewsItem: (id: number) => Promise<void>;
  clearSelected: () => void;
}

export const useNewsStore = create<NewsState>((set) => ({
  news: [],
  selectedNews: null,
  isLoading: false,
  error: null,

  fetchNews: async (sportId) => {
    set({ isLoading: true, error: null });
    try {
      const data = await api.getNews(sportId);
      if (data?.length) set({ news: data });
      else set({ news: [] });
    } catch (err: any) {
      set({ error: err.message || 'Erreur de chargement des actualités' });
    }
    set({ isLoading: false });
  },

  fetchNewsItem: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const data = await api.getNewsItem(id);
      set({ selectedNews: data });
    } catch (err: any) {
      set({ error: err.message || 'Erreur de chargement' });
    }
    set({ isLoading: false });
  },

  clearSelected: () => set({ selectedNews: null }),
}));
