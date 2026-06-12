import { create } from 'zustand';
import { api } from '../services/localApi';

interface WalletState {
  transactions: any[];
  conversionRate: number;
  isLoading: boolean;
  error: string | null;
  fetchTransactions: (userId: string) => Promise<void>;
  convertGameMoney: (amountSca: number) => Promise<number>;
  buyCoinPack: (packId: number) => Promise<any>;
  watchAd: () => Promise<number>;
}

export const useWalletStore = create<WalletState>((set, get) => ({
  transactions: [],
  conversionRate: 200,
  isLoading: false,
  error: null,

  fetchTransactions: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await api.getTransactions();
      if (data?.length) set({ transactions: data });
      else set({ transactions: [] });
    } catch (err: any) {
      set({ error: err.message || 'Erreur de chargement des transactions' });
    }
    set({ isLoading: false });
  },

  convertGameMoney: async (amountSca) => {
    const rate = get().conversionRate;
    const coins = Math.floor(amountSca / rate);
    try {
      await api.convertGameMoney(amountSca);
      return coins;
    } catch (err: any) {
      throw err;
    }
  },

  buyCoinPack: async (packId) => {
    try {
      const result = await api.buyCoinPack(packId);
      return result;
    } catch (err: any) {
      throw err;
    }
  },

  watchAd: async () => {
    try {
      const result = await api.watchAd();
      return result.coins_earned || 50;
    } catch (err: any) {
      throw err;
    }
  },
}));
