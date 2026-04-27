import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  isNowPlayingVisible: boolean;
  isSidebarVisible: boolean;
  isFriendActivityVisible: boolean;
  reportTarget: { id: string; type: 'SONG' | 'PLAYLIST' | 'USER'; title: string } | null;
  toggleNowPlaying: () => void;
  setNowPlayingVisible: (visible: boolean) => void;
  toggleSidebar: () => void;
  setSidebarVisible: (visible: boolean) => void;
  toggleFriendActivity: () => void;
  setFriendActivityVisible: (visible: boolean) => void;
  openReportModal: (id: string, type: 'SONG' | 'PLAYLIST' | 'USER', title: string) => void;
  closeReportModal: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      isNowPlayingVisible: false,
      isSidebarVisible: true,
      isFriendActivityVisible: false, // Mặc định ẩn (Phase 16)
      reportTarget: null,
      toggleNowPlaying: () => set((state) => ({ isNowPlayingVisible: !state.isNowPlayingVisible })),
      setNowPlayingVisible: (visible) => set({ isNowPlayingVisible: visible }),
      toggleSidebar: () => set((state) => ({ isSidebarVisible: !state.isSidebarVisible })),
      setSidebarVisible: (visible) => set({ isSidebarVisible: visible }),
      toggleFriendActivity: () => set((state) => ({ isFriendActivityVisible: !state.isFriendActivityVisible })),
      setFriendActivityVisible: (visible) => set({ isFriendActivityVisible: visible }),
      openReportModal: (id, type, title) => set({ reportTarget: { id, type, title } }),
      closeReportModal: () => set({ reportTarget: null }),
    }),
    {
      name: 'spotify-ui-storage',
    }
  )
);
