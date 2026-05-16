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
import { cn } from '../../lib/utils';
import { useUIStore } from '../../stores/ui.store';
import { useFriendStore } from '../../stores/friend.store';
import { ReportModal } from '../shared/ReportModal';
import { usePlayerStore } from '@/stores/player.store';
import { useGlobalShortcuts } from '../../hooks/useGlobalShortcuts';
import { useSidebarResize } from '../../hooks/useSidebarResize';

// ---------- Resize Handle ----------
interface ResizeHandleProps {
  onMouseDown: (e: React.MouseEvent) => void;
  onDoubleClick: () => void;
  side: 'left' | 'right';
}

const ResizeHandle = ({ onMouseDown, onDoubleClick, side }: ResizeHandleProps) => (
  <div
    onMouseDown={onMouseDown}
    onDoubleClick={onDoubleClick}
    title="Kéo để resize • Double-click để reset"
    className={cn(
      "group relative flex-shrink-0 w-[6px] cursor-col-resize z-50 flex items-center justify-center",
      "transition-all duration-200",
      side === 'left' ? "mr-0" : "ml-0"
    )}
  >
    {/* Invisible hit area */}
    <div className="absolute inset-y-0 -left-1 -right-1" />
    {/* Visual indicator */}
    <div className={cn(
      "w-[2px] h-16 rounded-full transition-all duration-200",
      "bg-white/0 group-hover:bg-white/20 group-active:bg-[#1db954]/60",
      "group-hover:shadow-[0_0_6px_rgba(29,185,84,0.4)] group-active:shadow-[0_0_10px_rgba(29,185,84,0.7)]"
    )} />
  </div>
);

export const MainLayout = () => {
  useGlobalShortcuts();
  const { isAuthenticated } = useAuthStore();
  const { initialize: initNotifications, fetchNotifications } = useNotificationStore();
  const { initialize: initFriendActivity } = useFriendStore();
  const { currentTrack } = usePlayerStore();
  const { isSidebarVisible, isNowPlayingVisible, isQueueVisible, isFriendActivityVisible, setFullscreen } = useUIStore();
  const isRightSidebarVisible = (isNowPlayingVisible && !!currentTrack) || isQueueVisible || isFriendActivityVisible;

  const { leftWidth, rightWidth, startLeftDrag, startRightDrag, resetSizes } = useSidebarResize();

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
    // Luôn kết nối socket để nhận các sự kiện hệ thống (vd: Global Banner)
    socketService.connect();

    if (isAuthenticated) {
      initNotifications();
      initFriendActivity();
      fetchNotifications();
    }

    return () => {};
  }, [isAuthenticated, initNotifications, initFriendActivity, fetchNotifications]);

  return (
    <div className="flex h-screen w-full flex-col bg-[#000000] overflow-hidden text-white">
      <GlobalBanner />
      <ReportModal />

      {/* Top Section: Sidebar + Main Content */}
      <div className="flex flex-1 overflow-hidden px-2 pt-2 gap-0 pb-0 relative">

        {/* LEFT SIDEBAR - resizable */}
        <div
          className={cn(
            "transition-[opacity,margin] duration-300 ease-in-out h-full overflow-hidden shrink-0",
            isSidebarVisible ? "opacity-100 mr-0" : "w-0 opacity-0 mr-0 pointer-events-none"
          )}
          style={{ width: isSidebarVisible ? leftWidth : 0 }}
        >
          <Sidebar className="w-full h-full" />
        </div>

        {/* LEFT RESIZE HANDLE */}
        {isSidebarVisible && (
          <ResizeHandle
            side="left"
            onMouseDown={startLeftDrag}
            onDoubleClick={resetSizes}
          />
        )}

        {/* MAIN CONTENT */}
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

        {/* RIGHT RESIZE HANDLE */}
        {isRightSidebarVisible && (
          <ResizeHandle
            side="right"
            onMouseDown={startRightDrag}
            onDoubleClick={resetSizes}
          />
        )}

        {/* RIGHT SIDEBAR - resizable */}
        <div
          className={cn(
            "hidden lg:flex flex-col relative transition-[opacity,margin] duration-300 ease-in-out overflow-hidden shrink-0",
            isRightSidebarVisible ? "opacity-100 ml-0" : "w-0 opacity-0 pointer-events-none ml-0"
          )}
          style={{ width: isRightSidebarVisible ? rightWidth : 0 }}
        >
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
      <div className="h-[90px] w-full shrink-0 flex items-center bg-black px-4 border-t border-white/5">
        <PlayerBar />
      </div>
    </div>
  );
};
