
import { Play, SkipBack, SkipForward, Repeat, Shuffle, Volume2, Mic2, ListMusic, MonitorSpeaker } from 'lucide-react';

export const PlayerBar = () => {
  return (
    <div className="flex w-full items-center justify-between">
      {/* 1. Now Playing Info */}
      <div className="flex w-[30%] min-w-[180px] items-center gap-4">
        <div className="h-14 w-14 flex-shrink-0 bg-[#282828] rounded-md overflow-hidden">
          {/* Cover image placeholder */}
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold hover:underline cursor-pointer">Song Title</span>
          <span className="text-xs text-[#B3B3B3] hover:underline cursor-pointer">Artist Name</span>
        </div>
      </div>

      {/* 2. Player Controls */}
      <div className="flex max-w-[722px] flex-col items-center gap-2 w-[40%]">
        <div className="flex items-center gap-6">
          <button className="text-[#B3B3B3] hover:text-white transition-colors">
            <Shuffle className="h-4 w-4" />
          </button>
          <button className="text-[#B3B3B3] hover:text-white transition-colors">
            <SkipBack className="h-5 w-5 fill-current" />
          </button>
          <button className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-black hover:scale-105 transition-transform">
            <Play className="h-4 w-4 fill-current ml-0.5" />
          </button>
          <button className="text-[#B3B3B3] hover:text-white transition-colors">
            <SkipForward className="h-5 w-5 fill-current" />
          </button>
          <button className="text-[#B3B3B3] hover:text-white transition-colors">
            <Repeat className="h-4 w-4" />
          </button>
        </div>
        <div className="flex w-full items-center gap-2 text-xs text-[#B3B3B3]">
          <span>0:00</span>
          {/* Progress Bar Placeholder */}
          <div className="h-1 w-full rounded-full bg-[#4D4D4D] group cursor-pointer relative flex items-center">
            <div className="h-full w-0 bg-white group-hover:bg-[#1DB954] rounded-full"></div>
            <div className="h-3 w-3 bg-white rounded-full absolute left-0 opacity-0 group-hover:opacity-100 shadow-sm"></div>
          </div>
          <span>0:00</span>
        </div>
      </div>

      {/* 3. Extra Controls (Volume & Features) */}
      <div className="flex w-[30%] min-w-[180px] justify-end items-center gap-4 text-[#B3B3B3]">
        <button className="hover:text-white transition-colors"><Mic2 className="h-4 w-4" /></button>
        <button className="hover:text-white transition-colors"><ListMusic className="h-4 w-4" /></button>
        <button className="hover:text-white transition-colors"><MonitorSpeaker className="h-4 w-4" /></button>
        
        {/* Volume Bar Placeholder */}
        <div className="flex items-center gap-2 w-[93px]">
          <Volume2 className="h-4 w-4 shrink-0" />
          <div className="h-1 w-full rounded-full bg-[#4D4D4D] group cursor-pointer relative flex items-center">
             <div className="h-full w-[50%] bg-white group-hover:bg-[#1DB954] rounded-full"></div>
             <div className="h-3 w-3 bg-white rounded-full absolute left-[50%] opacity-0 group-hover:opacity-100 shadow-sm -ml-1.5"></div>
          </div>
        </div>
      </div>
    </div>
  );
};
