import { Link } from 'react-router-dom';
import { usePlayerStore } from '../../stores/player.store';
import { useLibraryStore } from '../../stores/library.store';
import { PlaybackControls } from './PlaybackControls';
import { VolumeControl } from './VolumeControl';
import { Heart, Mic2, ListMusic, PictureInPicture2, Maximize2 } from 'lucide-react';
import * as Tooltip from '@radix-ui/react-tooltip';

export const PlayerBar = () => {
  const { currentTrack } = usePlayerStore();
  const { isLiked, toggleLike } = useLibraryStore();

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

      {/* 3. Extra Controls (Bên phải - Thêm Volume và các Options) */}
      <div className="flex w-[30%] min-w-[280px] items-center justify-end gap-3 text-[#b3b3b3]">
        <Tooltip.Provider delayDuration={200}>
          {[
            { icon: Mic2, label: 'Lời bài hát' },
            { icon: ListMusic, label: 'Danh sách chờ' },
            { icon: PictureInPicture2, label: 'Trình phát thu nhỏ' }
          ].map((item, idx) => (
            <Tooltip.Root key={idx}>
              <Tooltip.Trigger asChild>
                <button className="hover:text-white transition-colors" disabled={!currentTrack}>
                  <item.icon size={16} />
                </button>
              </Tooltip.Trigger>
              <Tooltip.Portal>
                <Tooltip.Content className="bg-[#282828] text-white text-[12px] px-2 py-[6px] shadow-xl rounded font-medium z-[100]" sideOffset={8}>
                  {item.label}
                </Tooltip.Content>
              </Tooltip.Portal>
            </Tooltip.Root>
          ))}
        </Tooltip.Provider>

        <VolumeControl />

        <Tooltip.Provider delayDuration={200}>
          <Tooltip.Root>
            <Tooltip.Trigger asChild>
              <button className="hover:text-white transition-colors" disabled={!currentTrack}>
                <Maximize2 size={16} />
              </button>
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Content className="bg-[#282828] text-white text-[12px] px-2 py-[6px] shadow-xl rounded font-medium z-[100]" sideOffset={8}>
                Toàn màn hình
              </Tooltip.Content>
            </Tooltip.Portal>
          </Tooltip.Root>
        </Tooltip.Provider>
      </div>

    </div>
  );
};
