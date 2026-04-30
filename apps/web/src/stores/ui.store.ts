import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  isNowPlayingVisible: boolean;
  isSidebarVisible: boolean;
  isFriendActivityVisible: boolean;
  reportTarget: { id: string; type: 'SONG' | 'PLAYLIST' | 'USER'; title: string } | null;
  isQueueVisible: boolean;
  isFullscreen: boolean;
  toggleNowPlaying: () => void;
  setNowPlayingVisible: (visible: boolean) => void;
  toggleQueue: () => void;
  setQueueVisible: (visible: boolean) => void;
  toggleSidebar: () => void;
  setSidebarVisible: (visible: boolean) => void;
  toggleFriendActivity: () => void;
  setFriendActivityVisible: (visible: boolean) => void;
  toggleFullscreen: () => void;
  setFullscreen: (isFullscreen: boolean) => void;
  openReportModal: (id: string, type: 'SONG' | 'PLAYLIST' | 'USER', title: string) => void;
  closeReportModal: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      isNowPlayingVisible: false,
      isSidebarVisible: true,
      isFriendActivityVisible: false,
      isQueueVisible: false,
      isFullscreen: false,
      reportTarget: null,
      toggleNowPlaying: () => set((state) => ({ 
        isNowPlayingVisible: !state.isNowPlayingVisible,
        isQueueVisible: false,
        isFriendActivityVisible: false
      })),
      setNowPlayingVisible: (visible) => set({ 
        isNowPlayingVisible: visible,
        isQueueVisible: visible ? false : undefined 
      }),
      toggleQueue: () => set((state) => ({ 
        isQueueVisible: !state.isQueueVisible,
        isNowPlayingVisible: false,
        isFriendActivityVisible: false
      })),
      setQueueVisible: (visible) => set({ 
        isQueueVisible: visible,
        isNowPlayingVisible: visible ? false : undefined
      }),
      toggleSidebar: () => set((state) => ({ isSidebarVisible: !state.isSidebarVisible })),
      setSidebarVisible: (visible) => set({ isSidebarVisible: visible }),
      toggleFriendActivity: () => set((state) => ({ 
        isFriendActivityVisible: !state.isFriendActivityVisible,
        isNowPlayingVisible: false,
        isQueueVisible: false
      })),
      setFriendActivityVisible: (visible) => set({ isFriendActivityVisible: visible }),
      toggleFullscreen: () => {
        const isCurrentlyFull = !!document.fullscreenElement;
        if (!isCurrentlyFull) {
          document.documentElement.requestFullscreen().catch((err) => {
            console.error(`Lỗi bật Fullscreen: ${err.message}`);
          });
        } else {
          document.exitFullscreen();
        }
      },
      setFullscreen: (isFullscreen) => set({ isFullscreen }),
      openReportModal: (id, type, title) => set({ reportTarget: { id, type, title } }),
      closeReportModal: () => set({ reportTarget: null }),
    }),
    {
      name: 'spotify-ui-storage',
    }
  )
);
