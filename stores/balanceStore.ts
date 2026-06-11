import { create } from 'zustand';
import { api } from '../services/localApi';
import { MOCK_BALANCE } from '../services/mockData';

interface BalanceState {
  catCoins: number; realMoneyDt: number; gameMoneySca: number; isLoading: boolean;
  fetch: (userId: string) => Promise<void>;
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
}));
