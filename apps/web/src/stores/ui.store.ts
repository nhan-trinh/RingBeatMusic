import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  isNowPlayingVisible: boolean;
  toggleNowPlaying: () => void;
  setNowPlayingVisible: (visible: boolean) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      isNowPlayingVisible: false, // Mặc định ẩn
      toggleNowPlaying: () => set((state) => ({ isNowPlayingVisible: !state.isNowPlayingVisible })),
      setNowPlayingVisible: (visible) => set({ isNowPlayingVisible: visible }),
    }),
    {
      name: 'spotify-ui-storage',
    }
  )
);
