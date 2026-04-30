import { useEffect } from 'react';
import { Sidebar } from '../layout/Sidebar';
import { Topbar } from '../layout/Topbar';
import { PlayerBar } from '../player/PlayerBar';
import { NowPlayingSidebar } from '../player/NowPlayingSidebar';
import { QueueSidebar } from '../player/QueueSidebar';
import { FriendActivitySidebar } from './FriendActivitySidebar';
import { Outlet } from 'react-router-dom';
import { GlobalBanner } from './GlobalBanner';
import { useAuthStore } from '../../stores/auth.store';
import { useNotificationStore } from '../../stores/notification.store';
import { socketService } from '../../lib/socket';
import { Toaster } from 'sonner';
import { cn } from '../../lib/utils';
import { useUIStore } from '../../stores/ui.store';
import { useFriendStore } from '../../stores/friend.store';
import { ReportModal } from '../shared/ReportModal';
import { usePlayerStore } from '@/stores/player.store';
import { useGlobalShortcuts } from '../../hooks/useGlobalShortcuts';

export const MainLayout = () => {
  useGlobalShortcuts();
  const { isAuthenticated } = useAuthStore();
  const { initialize: initNotifications, fetchNotifications } = useNotificationStore();
  const { initialize: initFriendActivity } = useFriendStore();
  const { currentTrack } = usePlayerStore();
  const { isSidebarVisible, isNowPlayingVisible, isQueueVisible, isFriendActivityVisible, setFullscreen } = useUIStore();
  const isRightSidebarVisible = (isNowPlayingVisible && !!currentTrack) || isQueueVisible || isFriendActivityVisible;

  useEffect(() => {
    const handleFullscreenChange = () => {
      setFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [setFullscreen]);

  useEffect(() => {
    if (isAuthenticated) {
      // 1. Kết nối Socket
      socketService.connect();

      // 2. Khởi tạo store (listeners)
      initNotifications();
      initFriendActivity();

      // 3. Lấy dữ liệu ban đầu
      fetchNotifications();
    } else {
      socketService.disconnect();
    }

    return () => {
      // Tạm thời không disconnect khi unmount layout để tránh treo/nối lại liên tục
    };
  }, [isAuthenticated, initNotifications, initFriendActivity, fetchNotifications]);

  return (
    <div className="flex h-screen w-full flex-col bg-[#000000] overflow-hidden text-white">
      <Toaster richColors position="top-right" theme="dark" />
      <GlobalBanner />
      <ReportModal />
      {/* Top Section: Sidebar + Main Content */}
      <div className="flex flex-1 overflow-hidden px-2 pt-2 gap-0 pb-0 relative">
        <div className={cn(
          "transition-all duration-300 ease-in-out h-full overflow-hidden",
          isSidebarVisible ? "w-[300px] opacity-100 mr-2" : "w-0 opacity-0 mr-0"
        )}>
          <Sidebar className="w-[300px] shrink-0 h-full" />
        </div>

        <main className="relative flex flex-1 flex-col overflow-hidden rounded-lg bg-[#121212] isolate">
          {/* Topbar float over content */}
          <div className="absolute top-0 left-0 w-full z-50 pointer-events-none">
            <div className="pointer-events-auto">
              <Topbar />
            </div>
          </div>
          {/* Scrollable Container */}
          <div id="main-scroll" className="flex-1 overflow-y-auto w-full h-full relative z-0">
            <Outlet />
          </div>
        </main>

        {/* Right Sidebar Slot */}
        <div className={cn(
          "hidden lg:flex flex-col relative transition-all duration-300 ease-in-out overflow-hidden shrink-0",
          isRightSidebarVisible ? "w-[340px] opacity-100 ml-2" : "w-0 opacity-0 pointer-events-none ml-0"
        )}>
          <div className={cn("absolute inset-0 z-10", !isNowPlayingVisible && "pointer-events-none")}>
            <NowPlayingSidebar />
          </div>
          <div className={cn("absolute inset-0 z-20", !isQueueVisible && "pointer-events-none")}>
            <QueueSidebar />
          </div>
          <div className={cn("absolute inset-0 z-30", !isFriendActivityVisible && "pointer-events-none")}>
            <FriendActivitySidebar />
          </div>
        </div>
      </div>

      {/* Bottom Section: Player Bar */}
      <div className="h-[90px] w-full shrink-0 flex items-center bg-black px-4">
        <PlayerBar />
      </div>
    </div>
  );
};
