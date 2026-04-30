import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { usePlayerStore } from '../../stores/player.store';
import { FastAverageColor } from 'fast-average-color';
import { Music2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { parseLRC, SyncedLyricLine } from '../../lib/lrc-parser';
import { useInteractionTracker } from '../../hooks/useInteractionTracker';

export const LyricsPage = () => {
  const { id } = useParams();


  const [parsedLyrics, setParsedLyrics] = useState<SyncedLyricLine[]>([]);

  const { currentTrack, progress, setContextAndPlay, togglePlay } = usePlayerStore();

  const activeLyricRef = useRef<HTMLParagraphElement>(null);
  const lyricsContainerRef = useRef<HTMLDivElement>(null);

  useInteractionTracker('SONG', id);

  const { data: song, isLoading } = useQuery({
    queryKey: ['lyrics', id],
    queryFn: async () => {
      const res = await api.get(`/songs/${id}`) as any;
      return res.data;
    }
  });

  useEffect(() => {
    if (!song) return;

    if (song.lyrics) {
      setParsedLyrics(parseLRC(song.lyrics));
    } else {
      setParsedLyrics([]);
    }

    if (song.coverUrl) {
      const fac = new FastAverageColor();
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.src = song.coverUrl + (song.coverUrl.includes('?') ? '&' : '?') + 'corsbuster=' + Date.now();
      img.onload = () => {
        fac.destroy();
      };
    }
  }, [song]);

  const isCurrentPlaying = currentTrack?.id === song?.id;

  // Tính toán lời nhạc đang hát
  let activeIndex = -1;
  if (isCurrentPlaying && parsedLyrics.length > 0) {
    for (let i = 0; i < parsedLyrics.length; i++) {
      if (progress >= parsedLyrics[i].time) {
        activeIndex = i;
      } else {
        break;
      }
    }
  }

  // Cuộn lời nhạc tự động mượt mà
  useEffect(() => {
    if (activeIndex !== -1 && activeLyricRef.current && lyricsContainerRef.current) {
      const container = lyricsContainerRef.current;
      const element = activeLyricRef.current;

      const offsetTop = element.offsetTop;
      const containerHalfHeight = container.clientHeight / 2;
      const elementHalfHeight = element.clientHeight / 2;
      const scrollPosition = offsetTop - containerHalfHeight + elementHalfHeight;

      container.scrollTo({
        top: scrollPosition,
        behavior: 'smooth'
      });
    }
  }, [activeIndex]);

  const handlePlay = () => {
    if (currentTrack?.id === song?.id) {
      togglePlay();
    } else if (song) {
      const track = {
        id: song.id,
        title: song.title,
        artistName: song.artist.stageName,
        artistId: song.artistId,
        coverUrl: song.coverUrl,
        audioUrl: song.audioUrl320 || song.audioUrl128,
        canvasUrl: song.canvasUrl,
        duration: song.duration,
        hasLyrics: !!song.lyrics
      };
      setContextAndPlay([track], 0, `track:${song.id}`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-full w-full bg-[#121212] overflow-hidden animate-pulse">
        {/* Skeleton Header */}
        <div className="absolute top-0 left-0 w-full px-6 py-5 flex items-center justify-center gap-4">
          <div className="w-10 h-10 bg-white/5 rounded-md" />
          <div className="flex flex-col gap-2">
            <div className="w-32 h-4 bg-white/5 rounded" />
            <div className="w-20 h-2 bg-white/5 rounded" />
          </div>
        </div>
        {/* Skeleton Lyrics */}
        <div className="flex-1 flex flex-col items-center justify-center space-y-8 px-6">
          <div className="w-3/4 h-12 bg-white/5 rounded-xl opacity-20" />
          <div className="w-full h-16 bg-white/5 rounded-xl opacity-40" />
          <div className="w-2/3 h-12 bg-white/5 rounded-xl opacity-20" />
          <div className="w-1/2 h-10 bg-white/5 rounded-xl opacity-10" />
        </div>
      </div>
    );
  }

  if (!song) {
    return <div className="min-h-screen bg-[#121212] flex items-center justify-center text-white">Không tìm thấy bài hát</div>;
  }

  return (
    <div className="flex flex-col h-full w-full relative overflow-hidden isolate bg-[#121212]">
      {/* Nền Blur cực đại lấy từ Cover bài hát */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat blur-[100px] scale-150 opacity-50 transition-all duration-1000 ease-in-out"
        style={{ backgroundImage: `url(${song.coverUrl})` }}
      />
      <div className="absolute inset-0 z-0 bg-black/40 mix-blend-overlay"></div>

      {/* Header */}
      <div className="absolute top-0 left-0 w-full px-6 py-5 z-30 flex items-center justify-center bg-gradient-to-b from-black/80 via-black/40 to-transparent backdrop-blur-[1px]">
        {/* Cụm Track Info Center */}
        <div className="flex items-center gap-4 max-w-[80%]">
          {/* Ảnh bìa nhỏ */}
          <div className="w-10 h-10 rounded-md overflow-hidden shadow-2xl border border-white/10 shrink-0">
            <img src={song.coverUrl} className="w-full h-full object-cover" alt="Cover" />
          </div>

          {/* Track Info */}
          <div className="flex flex-col min-w-0">
            <h2 className="text-white text-base font-black tracking-tight leading-tight truncate drop-shadow-md">{song.title}</h2>
            <p className="text-white/70 text-[10px] font-bold truncate uppercase tracking-widest">{song.artist.stageName}</p>
          </div>
        </div>
      </div>

      {/* Nút Fullscreen riêng - Đặt ở góc dưới bên phải của vùng nội dung */}


      {/* Vùng Karaoke */}
      <div className="flex-1 w-full flex flex-col items-center justify-start pt-20 pb-32 z-10 overflow-hidden">
        {parsedLyrics.length > 0 ? (
          <div
            ref={lyricsContainerRef}
            className="w-full max-w-4xl h-full overflow-y-auto text-center space-y-6 md:space-y-10 px-6 py-[20vh] mask-image-y relative scroll-smooth"
            style={{
              WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)',
              maskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)',
              scrollbarWidth: 'none'
            }}
          >
            <style>{`.mask-image-y::-webkit-scrollbar { display: none; }`}</style>

            {parsedLyrics.map((line, index) => {
              const isActive = index === activeIndex;
              const isPassed = index < activeIndex; // Lời đã qua

              return (
                <p
                  key={index}
                  ref={isActive ? activeLyricRef : null}
                  className={cn(
                    "text-3xl md:text-5xl lg:text-6xl font-black leading-tight transition-all duration-500 will-change-[transform,opacity]",
                    isActive
                      ? "text-white opacity-100 scale-105 drop-shadow-[0_0_15px_rgba(255,255,255,0.6)]"
                      : isPassed
                        ? "text-white/30 opacity-30 scale-100 blur-[0.5px]"
                        : "text-white/20 opacity-20 scale-95 hover:text-white/60 hover:opacity-60 cursor-pointer"
                  )}
                  onClick={() => {
                    if (isCurrentPlaying) {
                      usePlayerStore.getState().seek(line.time);
                    } else {
                      handlePlay();
                    }
                  }}
                >
                  {line.text || '♪'}
                </p>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center opacity-70">
            <Music2 size={64} className="mb-6 text-white/40" />
            <p className="text-2xl md:text-3xl font-bold text-white mb-2">Chưa có lời bài hát</p>
            <p className="text-lg text-white/60">Chúng tôi đang cập nhật lời cho bài hát này.</p>
          </div>
        )}
      </div>
    </div>
  );
};
