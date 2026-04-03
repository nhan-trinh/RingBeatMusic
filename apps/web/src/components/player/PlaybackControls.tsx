import { useState, useEffect } from 'react';
import { usePlayerStore } from '../../stores/player.store';
import { Play, Pause, SkipBack, SkipForward, Repeat, Repeat1, Shuffle } from 'lucide-react';
import * as Slider from '@radix-ui/react-slider';
import * as Tooltip from '@radix-ui/react-tooltip';
import { formatTime, cn } from '../../lib/utils';

const TooltipWrap = ({ children, content }: { children: React.ReactNode, content: string }) => (
  <Tooltip.Provider delayDuration={200}>
    <Tooltip.Root>
      <Tooltip.Trigger asChild>
        {children}
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content 
          className="bg-[#282828] text-white text-[12px] px-2 py-[6px] shadow-xl rounded font-medium z-[100]" 
          sideOffset={8}
        >
          {content}
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  </Tooltip.Provider>
);

export const PlaybackControls = () => {
  const { 
    isPlaying, progress, duration, togglePlay, nextTrack, prevTrack, seek, currentTrack,
    isShuffle, toggleShuffle, repeatMode, toggleRepeat
  } = usePlayerStore();

  const [localProgress, setLocalProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (!isDragging) {
      setLocalProgress(progress);
    }
  }, [progress, isDragging]);

  const handleValueChange = (value: number[]) => {
    setIsDragging(true);
    setLocalProgress(value[0]);
  };

  const handleValueCommit = (value: number[]) => {
    seek(value[0]);
    setIsDragging(false);
  };

  const isDisable = !currentTrack;

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-[722px] px-8">
      {/* Nút bấm điều khiển */}
      <div className="flex items-center gap-6 mb-2">
        
        <TooltipWrap content={isShuffle ? "Tắt trộn bài" : "Bật trộn bài"}>
          <button 
            onClick={toggleShuffle}
            className={cn("transition-colors relative", isShuffle ? "text-[#1db954] hover:text-[#33ff77]" : "text-[#b3b3b3] hover:text-white")} 
            disabled={isDisable}
          >
            <Shuffle size={16} />
            {isShuffle && <div className="absolute -bottom-[6px] left-1/2 -translate-x-1/2 w-1 h-1 bg-[#1db954] rounded-full"></div>}
          </button>
        </TooltipWrap>

        <TooltipWrap content="Quay lại">
          <button onClick={prevTrack} className="text-[#b3b3b3] hover:text-white transition-colors" disabled={isDisable}>
            <SkipBack size={20} className="fill-current" />
          </button>
        </TooltipWrap>
        
        <TooltipWrap content={isPlaying ? "Tạm dừng" : "Phát"}>
          <button 
            onClick={togglePlay} 
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white text-black hover:scale-105 transition-transform outline-none"
            disabled={isDisable}
          >
            {isPlaying ? <Pause size={16} className="fill-current" /> : <Play size={16} className="fill-current ml-1" />}
          </button>
        </TooltipWrap>

        <TooltipWrap content="Tiếp theo">
          <button onClick={nextTrack} className="text-[#b3b3b3] hover:text-white transition-colors" disabled={isDisable}>
            <SkipForward size={20} className="fill-current" />
          </button>
        </TooltipWrap>

        <TooltipWrap content={repeatMode === 'off' ? "Bật lặp lại" : repeatMode === 'all' ? "Bật lặp lại 1 bài" : "Tắt lặp lại"}>
          <button 
            onClick={toggleRepeat}
            className={cn("transition-colors relative", repeatMode !== 'off' ? "text-[#1db954] hover:text-[#33ff77]" : "text-[#b3b3b3] hover:text-white")} 
            disabled={isDisable}
          >
            {repeatMode === 'one' ? <Repeat1 size={16} /> : <Repeat size={16} />}
            {repeatMode !== 'off' && <div className="absolute -bottom-[6px] left-1/2 -translate-x-1/2 w-1 h-1 bg-[#1db954] rounded-full"></div>}
          </button>
        </TooltipWrap>

      </div>

      {/* Thanh Progress */}
      <div className="flex items-center w-full gap-2 text-xs text-[#a7a7a7]">
        <span className="min-w-[40px] text-right">{formatTime(localProgress)}</span>
        
        <Slider.Root
          className="relative flex items-center select-none touch-none w-full h-3 group cursor-pointer"
          value={[localProgress]}
          max={duration || 100}
          step={1}
          onValueChange={handleValueChange}
          onValueCommit={handleValueCommit}
          disabled={isDisable}
        >
          <Slider.Track className="bg-[#4d4d4d] relative grow rounded-full h-1 group-hover:h-[6px] transition-all">
            <Slider.Range className="absolute bg-white group-hover:bg-[#1db954] rounded-full h-full" />
          </Slider.Track>
          <Slider.Thumb className="hidden group-hover:block w-3 h-3 bg-white rounded-full shadow-[0_2px_4px_rgba(0,0,0,0.5)] outline-none" />
        </Slider.Root>

        <span className="min-w-[40px] text-left">{formatTime(duration)}</span>
      </div>
    </div>
  );
};
