import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { usePlayerStore } from '../../stores/player.store';
import { useLibraryStore } from '../../stores/library.store';
import { useUIStore } from '../../stores/ui.store';
import { PlaybackControls } from './PlaybackControls';
import { VolumeControl } from './VolumeControl';
import { Heart, Mic2, ListMusic, PictureInPicture2, Maximize2, PlaySquare } from 'lucide-react';
import * as Tooltip from '@radix-ui/react-tooltip';
import { cn } from '../../lib/utils';

export const PlayerBar = () => {
  const { currentTrack, initPlayer } = usePlayerStore();
  const { isLiked, toggleLike } = useLibraryStore();
  const { isNowPlayingVisible, toggleNowPlaying, setNowPlayingVisible, isQueueVisible, toggleQueue, isFullscreen, toggleFullscreen } = useUIStore();

  // Tự động mở Sidebar khi phát nhạc mới
  useEffect(() => {
    if (currentTrack) {
      setNowPlayingVisible(true);
    }
  }, [currentTrack?.id, setNowPlayingVisible]);
  
  // Khởi tạo player khi reload (nếu đã có track trong storage)
  useEffect(() => {
    initPlayer();
  }, [initPlayer]);

  return (
    <div className="h-[90px] border-[#282828] flex items-center justify-between px-4 fixed bottom-0 w-full z-50">

      {/* 1. Track Info (Bên trái) */}
      <div className="flex w-[30%] min-w-[180px] items-center gap-3">
        {currentTrack && (
          <>
            <Link to={`/track/${currentTrack.id}`} className="hover:opacity-80 transition-opacity flex-shrink-0">
              <img src={currentTrack.coverUrl} alt="Cover" className="w-14 h-14 rounded shadow-lg" />
            </Link>
            <div className="flex flex-col min-w-0">
              <Link to={`/track/${currentTrack.id}`} className="text-white text-sm font-medium hover:underline cursor-pointer line-clamp-1">{currentTrack.title}</Link>
              <Link to={`/artist/${currentTrack.artistId}`} className="text-[#b3b3b3] text-xs hover:underline cursor-pointer line-clamp-1">{currentTrack.artistName}</Link>
            </div>
            <button
              onClick={() => currentTrack && toggleLike(currentTrack.id, currentTrack.title)}
              className={`flex-shrink-0 ml-1 transition-all ${
                isLiked(currentTrack.id)
                  ? 'text-[#1DB954] scale-110'
                  : 'text-[#b3b3b3] hover:text-white'
              }`}
            >
              <Heart size={16} className={isLiked(currentTrack.id) ? 'fill-[#1DB954]' : ''} />
            </button>
          </>
        )}
      </div>

      {/* 2. Playback Controls (Ở giữa) */}
      <div className="flex w-[40%] max-w-[722px] flex-col items-center justify-center">
        <PlaybackControls />
      </div>

      {/* 3. Extra Controls (Bên phải) */}
      <div className="flex w-[30%] min-w-[280px] items-center justify-end gap-3 text-[#b3b3b3]">
        <Tooltip.Provider delayDuration={200}>
          {/* Now Playing */}
          <Tooltip.Root>
            <Tooltip.Trigger asChild>
              <button 
                onClick={toggleNowPlaying}
                className={cn(
                  "hover:text-white transition-all p-1",
                  isNowPlayingVisible ? "text-[#1DB954]" : "text-[#b3b3b3]"
                )}
                disabled={!currentTrack}
              >
                <PlaySquare size={16} fill={isNowPlayingVisible ? "currentColor" : "none"} />
              </button>
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Content className="bg-[#282828] text-white text-[12px] px-2 py-[6px] shadow-xl rounded font-medium z-[100]" sideOffset={8}>
                Chế độ xem Đang phát
              </Tooltip.Content>
            </Tooltip.Portal>
          </Tooltip.Root>

          {/* Lyrics - chỉ hiện khi bài hát có lời */}
          {currentTrack?.hasLyrics && (
            <Tooltip.Root>
              <Tooltip.Trigger asChild>
                <Link 
                  to={`/lyrics/${currentTrack.id}`}
                  className={cn(
                    "hover:text-white transition-colors",
                    window.location.pathname === `/lyrics/${currentTrack.id}` ? "text-[#1db954]" : ""
                  )}
                >
                  <Mic2 size={16} />
                </Link>
              </Tooltip.Trigger>
              <Tooltip.Portal>
                <Tooltip.Content className="bg-[#282828] text-white text-[12px] px-2 py-[6px] shadow-xl rounded font-medium z-[100]" sideOffset={8}>
                  Lời bài hát
                </Tooltip.Content>
              </Tooltip.Portal>
            </Tooltip.Root>
          )}

          {/* Queue */}
          <Tooltip.Root>
            <Tooltip.Trigger asChild>
              <button 
                onClick={toggleQueue}
                className={cn(
                  "hover:text-white transition-colors",
                  isQueueVisible ? "text-[#1DB954]" : "text-[#b3b3b3]"
                )}
                disabled={!currentTrack}
              >
                <ListMusic size={16} />
              </button>
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Content className="bg-[#282828] text-white text-[12px] px-2 py-[6px] shadow-xl rounded font-medium z-[100]" sideOffset={8}>
                Danh sách chờ
              </Tooltip.Content>
            </Tooltip.Portal>
          </Tooltip.Root>

          {/* PiP */}
          <Tooltip.Root>
            <Tooltip.Trigger asChild>
              <button className="hover:text-white transition-colors" disabled={!currentTrack}>
                <PictureInPicture2 size={16} />
              </button>
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Content className="bg-[#282828] text-white text-[12px] px-2 py-[6px] shadow-xl rounded font-medium z-[100]" sideOffset={8}>
                Trình phát thu nhỏ
              </Tooltip.Content>
            </Tooltip.Portal>
          </Tooltip.Root>
        </Tooltip.Provider>

        <VolumeControl />

        <Tooltip.Provider delayDuration={200}>
          {/* Fullscreen */}
          <Tooltip.Root>
            <Tooltip.Trigger asChild>
              <button 
                className={cn("transition-colors", isFullscreen ? "text-[#1DB954]" : "hover:text-white")} 
                disabled={!currentTrack}
                onClick={toggleFullscreen}
              >
                <Maximize2 size={16} />
              </button>
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Content className="bg-[#282828] text-white text-[12px] px-2 py-[6px] shadow-xl rounded font-medium z-[100]" sideOffset={8}>
                {isFullscreen ? 'Thoát toàn màn hình' : 'Toàn màn hình'}
              </Tooltip.Content>
            </Tooltip.Portal>
          </Tooltip.Root>
        </Tooltip.Provider>
      </div>

    </div>
  );
};
