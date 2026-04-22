import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  isNowPlayingVisible: boolean;
  isSidebarVisible: boolean;
  isFriendActivityVisible: boolean;
  toggleNowPlaying: () => void;
  setNowPlayingVisible: (visible: boolean) => void;
  toggleSidebar: () => void;
  setSidebarVisible: (visible: boolean) => void;
  toggleFriendActivity: () => void;
  setFriendActivityVisible: (visible: boolean) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      isNowPlayingVisible: false,
      isSidebarVisible: true,
      isFriendActivityVisible: true, // Mặc định hiện (Phase 16)
      toggleNowPlaying: () => set((state) => ({ isNowPlayingVisible: !state.isNowPlayingVisible })),
      setNowPlayingVisible: (visible) => set({ isNowPlayingVisible: visible }),
      toggleSidebar: () => set((state) => ({ isSidebarVisible: !state.isSidebarVisible })),
      setSidebarVisible: (visible) => set({ isSidebarVisible: visible }),
      toggleFriendActivity: () => set((state) => ({ isFriendActivityVisible: !state.isFriendActivityVisible })),
      setFriendActivityVisible: (visible) => set({ isFriendActivityVisible: visible }),
    }),
    {
      name: 'spotify-ui-storage',
    }
  )
);
