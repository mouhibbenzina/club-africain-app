import { create } from 'zustand';
import { api } from '../services/localApi';

interface BalanceState {
  catCoins: number;
  realMoneyDt: number;
  gameMoneySca: number;
  isLoading: boolean;
  error: string | null;
  fetch: (userId: string) => Promise<void>;
  addCoins: (amount: number) => void;
  deductCoins: (amount: number) => void;
  addGameMoney: (amount: number) => void;
  deductGameMoney: (amount: number) => void;
}

export const useBalanceStore = create<BalanceState>((set) => ({
  catCoins: 0,
  realMoneyDt: 0,
  gameMoneySca: 0,
  isLoading: false,
  error: null,

  fetch: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await api.getBalances();
      if (data?.[0]) {
        set({
          catCoins: data[0].cat_coins ?? 0,
          realMoneyDt: data[0].real_money_dt ?? 0,
          gameMoneySca: data[0].game_money_sca ?? 0,
        });
      }
    } catch (err: any) {
      set({ error: err.message || 'Erreur de chargement du solde' });
    }
    set({ isLoading: false });
  },

  addCoins: (amount) => set((s) => ({ catCoins: s.catCoins + amount })),
  deductCoins: (amount) => set((s) => ({ catCoins: Math.max(0, s.catCoins - amount) })),
  addGameMoney: (amount) => set((s) => ({ gameMoneySca: s.gameMoneySca + amount })),
  deductGameMoney: (amount) => set((s) => ({ gameMoneySca: Math.max(0, s.gameMoneySca - amount) })),
}));
