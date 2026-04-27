import { useEffect } from 'react';
import { Sidebar } from '../layout/Sidebar';
import { Topbar } from '../layout/Topbar';
import { PlayerBar } from '../player/PlayerBar';
import { NowPlayingSidebar } from '../player/NowPlayingSidebar';
import { FriendActivitySidebar } from './FriendActivitySidebar';
import { Outlet } from 'react-router-dom';
import { GlobalBanner } from './GlobalBanner';
import { useAuthStore } from '../../stores/auth.store';
import { useNotificationStore } from '../../stores/notification.store';
import { socketService } from '../../lib/socket';
import { Toaster } from 'sonner';
import { useUIStore } from '../../stores/ui.store';
import { useFriendStore } from '../../stores/friend.store';
import { ReportModal } from '../shared/ReportModal';

export const MainLayout = () => {
  const { isAuthenticated } = useAuthStore();
  const { initialize: initNotifications, fetchNotifications } = useNotificationStore();
  const { initialize: initFriendActivity } = useFriendStore();
  const { isSidebarVisible } = useUIStore();

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
      <div className="flex flex-1 overflow-hidden p-2 gap-2 pb-0 relative">
        <div className={`transition-all duration-300 ease-in-out h-full overflow-hidden ${isSidebarVisible ? 'w-[300px] opacity-100' : 'w-0 opacity-0'}`}>
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

        <NowPlayingSidebar />
        <FriendActivitySidebar />
      </div>

      {/* Bottom Section: Player Bar */}
      <div className="h-[90px] w-full shrink-0 flex items-center bg-black px-4">
        <PlayerBar />
      </div>
    </div>
  );
};
