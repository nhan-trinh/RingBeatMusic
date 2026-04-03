
import { usePlayerStore } from '../../stores/player.store';
import { PlaybackControls } from './PlaybackControls';
import { VolumeControl } from './VolumeControl';
import { api } from '../../lib/api';
import { Mic2, ListMusic, PictureInPicture2, Maximize2 } from 'lucide-react';
import * as Tooltip from '@radix-ui/react-tooltip';

export const PlayerBar = () => {
  const { currentTrack, setQueueAndPlay } = usePlayerStore();

  // Test feature: Fetch mock queue and play when clicking a button
  const handleTestLoad = async () => {
    try {
      const res = await api.get('/songs/mock-queue') as any;
      if (res.data) {
        setQueueAndPlay(res.data, 0); // Phát bài đầu tiên
      }
    } catch (error) {
      console.error('Failed to load mock queue', error);
    }
  };

  return (
    <div className="h-[90px] bg-[#181818] border-t border-[#282828] flex items-center justify-between px-4 fixed bottom-0 w-full z-50">
      
      {/* 1. Track Info (Bên trái) */}
      <div className="flex w-[30%] min-w-[180px] items-center gap-4">
        {currentTrack ? (
          <>
            <img src={currentTrack.coverUrl} alt="Cover" className="w-14 h-14 rounded shadow-lg" />
            <div className="flex flex-col">
              <span className="text-white text-sm font-medium hover:underline cursor-pointer line-clamp-1">{currentTrack.title}</span>
              <span className="text-[#b3b3b3] text-xs hover:underline cursor-pointer line-clamp-1">{currentTrack.artistName}</span>
            </div>
          </>
        ) : (
          <button 
            onClick={handleTestLoad}
            className="text-white text-xs px-4 py-2 bg-[#1db954] rounded-full font-bold hover:scale-105"
          >
            🔥 Tải Nhạc Test
          </button>
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
