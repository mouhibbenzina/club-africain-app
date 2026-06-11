import { create } from 'zustand';
import { api } from '../services/localApi';
import { MOCK_TICKETS } from '../services/mockData';

interface Ticket { id: number; match_id: number; category: string; price_dt: number; tribune?: string; rang?: number; siege?: number; qr_code?: string; used: boolean; match?: any; }
interface TicketState { myTickets: Ticket[]; isLoading: boolean; fetchMyTickets: (userId: string) => Promise<void>; }

export const useTicketStore = create<TicketState>((set) => ({
  myTickets: MOCK_TICKETS as Ticket[],
  isLoading: false,
  fetchMyTickets: async () => {
    set({ isLoading: true });
    try {
      const data = await api.getTickets();
      if (data?.length) set({ myTickets: data });
    } catch { /* keep mock */ }
    set({ isLoading: false });
  },
}));
