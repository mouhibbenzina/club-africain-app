import { create } from 'zustand';
import { api } from '../services/localApi';
import { MOCK_TRANSACTIONS } from '../services/mockData';

interface WalletState { transactions: any[]; conversionRate: number; isLoading: boolean; fetchTransactions: (userId: string) => Promise<void>; }

export const useWalletStore = create<WalletState>((set) => ({
  transactions: MOCK_TRANSACTIONS, conversionRate: 200, isLoading: false,

  fetchTransactions: async () => {
    set({ isLoading: true });
    try { const data = await api.getTransactions(); if (data?.length) set({ transactions: data }); } catch {}
    set({ isLoading: false });
  },
}));
