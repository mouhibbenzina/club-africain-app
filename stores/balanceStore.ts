import { create } from 'zustand';
import { api } from '../services/localApi';
import { MOCK_BALANCE } from '../services/mockData';

interface BalanceState {
  catCoins: number; realMoneyDt: number; gameMoneySca: number; isLoading: boolean;
  fetch: (userId: string) => Promise<void>;
  addCoins: (amount: number) => void;
  deductCoins: (amount: number) => void;
  addGameMoney: (amount: number) => void;
  deductGameMoney: (amount: number) => void;
}

export const useBalanceStore = create<BalanceState>((set) => ({
  catCoins: MOCK_BALANCE.cat_coins,
  realMoneyDt: MOCK_BALANCE.real_money_dt,
  gameMoneySca: MOCK_BALANCE.game_money_sca,
  isLoading: false,

  fetch: async () => {
    set({ isLoading: true });
    try {
      const data = await api.getBalances();
      if (data?.[0]) set({ catCoins: data[0].cat_coins, realMoneyDt: data[0].real_money_dt, gameMoneySca: data[0].game_money_sca });
    } catch { /* keep mock */ }
    set({ isLoading: false });
  },

  addCoins: (amount) => set((s) => ({ catCoins: s.catCoins + amount })),
  deductCoins: (amount) => set((s) => ({ catCoins: Math.max(0, s.catCoins - amount) })),
  addGameMoney: (amount) => set((s) => ({ gameMoneySca: s.gameMoneySca + amount })),
  deductGameMoney: (amount) => set((s) => ({ gameMoneySca: Math.max(0, s.gameMoneySca - amount) })),
}));
