import { create } from 'zustand';
import { api } from '../services/localApi';

interface Ticket { id: number; match_id: number; category: string; price_dt: number; tribune?: string; rang?: number; siege?: number; qr_code?: string; used: boolean; match?: any; }

interface TicketState {
  myTickets: Ticket[];
  isLoading: boolean;
  error: string | null;
  fetchMyTickets: (userId: string) => Promise<void>;
  buyTicket: (matchId: number, category: string) => Promise<any>;
}

export const useTicketStore = create<TicketState>((set) => ({
  myTickets: [],
  isLoading: false,
  error: null,

  fetchMyTickets: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await api.getTickets();
      if (data?.length) set({ myTickets: data });
      else set({ myTickets: [] });
    } catch (err: any) {
      set({ error: err.message || 'Erreur de chargement des tickets' });
    }
    set({ isLoading: false });
  },

  buyTicket: async (matchId, category) => {
    try {
      const result = await api.buyTicket(matchId, category);
      return result;
    } catch (err: any) {
      throw err;
    }
  },
}));
