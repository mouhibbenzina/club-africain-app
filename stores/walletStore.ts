import { create } from 'zustand';
import { api } from '../services/localApi';
import { MOCK_TRANSACTIONS } from '../services/mockData';

interface WalletState { transactions: any[]; conversionRate: number; isLoading: boolean; fetchTransactions: (userId: string) => Promise<void>; convertGameMoney: (amountSca: number) => Promise<number>; buyCoinPack: (packId: number) => Promise<void>; watchAd: () => Promise<void>; }

export const useWalletStore = create<WalletState>((set, get) => ({
  transactions: MOCK_TRANSACTIONS, conversionRate: 200, isLoading: false,

  fetchTransactions: async () => {
    set({ isLoading: true });
    try { const data = await api.getTransactions(); if (data?.length) set({ transactions: data }); } catch {}
    set({ isLoading: false });
  },

  convertGameMoney: async (amountSca) => {
    const rate = get().conversionRate;
    const coins = Math.floor(amountSca / rate);
    try {
      await api.convertGameMoney(amountSca);
    } catch {}
    return coins;
  },

  buyCoinPack: async (packId) => {
    try {
      await api.buyCoinPack(packId);
    } catch {}
  },

  watchAd: async () => {
    try {
      await api.watchAd();
    } catch {}
  },
}));
