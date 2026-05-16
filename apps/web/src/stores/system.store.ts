import { create } from 'zustand';
import { api } from '../lib/api';

interface SystemSettings {
  maintenance_mode: boolean;
  maintenance_message: string;
  allow_registration: boolean;
  global_banner_text: string;
  global_banner_enabled: boolean;
  app_name: string;
}

interface SystemStore {
  settings: SystemSettings | null;
  loading: boolean;
  fetchSettings: () => Promise<void>;
}

export const useSystemStore = create<SystemStore>((set) => ({
  settings: null,
  loading: false,
  fetchSettings: async () => {
    try {
      set({ loading: true });
      // public endpoint or admin endpoint?
      // Better have a public endpoint for basic settings
      // Thêm timestamp t để tránh cache trình duyệt trên production
      const res = await api.get(`/home/settings?t=${Date.now()}`); 
      set({ settings: res.data, loading: false });
    } catch (error) {
      set({ loading: false });
    }
  },
}));
