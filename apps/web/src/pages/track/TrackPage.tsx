import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { usePlayerStore } from '../../stores/player.store';
import { useLibraryStore } from '../../stores/library.store';
import { FastAverageColor } from 'fast-average-color';
import { Play, Pause, Heart, Music2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { parseLRC, SyncedLyricLine } from '../../lib/lrc-parser';

export const TrackPage = () => {
  const { id } = useParams();

  const [dominantColor, setDominantColor] = useState('#121212');
  const [parsedLyrics, setParsedLyrics] = useState<SyncedLyricLine[]>([]);

  const { setQueueAndPlay, currentTrack, isPlaying, togglePlay, progress } = usePlayerStore();
  const { isLiked, toggleLike } = useLibraryStore();

  const activeLyricRef = useRef<HTMLParagraphElement>(null);
  const lyricsContainerRef = useRef<HTMLDivElement>(null);

  // Hook Luyện lấy dữ liệu từ React Query (Đã bật Cache Level 2)
  const { data: song, isLoading: loading } = useQuery({
    queryKey: ['track', id],
    queryFn: async () => {
      const res = await api.get(`/songs/${id}`) as any;
      return res.data;
    }
  });

  // Hậu xử lý (Extract color & Parse lyrics) sau khi có data từ Cache hoặc Mạng
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
      // Thêm cache buster để lấy CORS header xịn, tránh Tainted Canvas do browser cache
      img.src = song.coverUrl + (song.coverUrl.includes('?') ? '&' : '?') + 'corsbuster=' + Date.now();
      img.onload = () => {
        try {
          const color = fac.getColor(img);
          setDominantColor(color.hex);
        } catch (e) {
          console.error('Lỗi khi phân tích màu:', e);
        } finally { fac.destroy(); }
      };
    }
  }, [song]);

  const isCurrentPlaying = currentTrack?.id === song?.id;
  const isVinylSpinning = isCurrentPlaying && isPlaying;

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

  // Cuộn lời nhạc tự động mượt mà không làm nhảy màng hình chính
  useEffect(() => {
    if (activeIndex !== -1 && activeLyricRef.current && lyricsContainerRef.current) {
      const container = lyricsContainerRef.current;
      const element = activeLyricRef.current;

      // Tính toán khoảng cách để đưa dòng lời nhạc ra giữa container
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
    if (currentTrack?.id === song.id) {
      togglePlay();
    } else {
      const track = {
        id: song.id,
        title: song.title,
        artistName: song.artist.stageName,
        artistId: song.artistId,
        coverUrl: song.coverUrl,
        audioUrl: song.audioUrl320 || song.audioUrl128,
        canvasUrl: song.canvasUrl,
        duration: song.duration
      };
      setQueueAndPlay([track], 0, `track:${song.id}`);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 w-full min-h-screen bg-[#0e0e0e] text-white flex flex-col relative overflow-hidden font-sans pt-20 px-12">
        <div className="flex flex-col items-center mb-12 mt-8 animate-pulse">
          <div className="w-[340px] h-[340px] md:w-[420px] md:h-[420px] rounded-full bg-white/5 shrink-0 shadow-2xl"></div>
          <div className="mt-10 flex flex-col items-center">
            <div className="w-64 h-10 bg-white/5 rounded-lg mb-4"></div>
            <div className="w-32 h-6 bg-white/5 rounded-md mb-8"></div>
            <div className="flex gap-6 items-center">
              <div className="w-12 h-12 bg-white/5 rounded-full"></div>
              <div className="w-16 h-16 bg-white/5 rounded-full"></div>
            </div>
          </div>
        </div>
        <div className="w-full max-w-3xl mx-auto flex flex-col gap-6 animate-pulse mt-8">
          <div className="w-3/4 h-8 bg-white/5 rounded-md mx-auto"></div>
          <div className="w-full h-8 bg-white/5 rounded-md mx-auto"></div>
          <div className="w-2/3 h-8 bg-white/5 rounded-md mx-auto"></div>
        </div>
      </div>
    );
  }

  if (!song) return <div className="p-20 text-center text-white">Không tìm thấy bài hát</div>;

  return (
    <div className="flex-1 w-full min-h-full bg-[#0e0e0e] text-white flex flex-col relative overflow-hidden font-sans">

      {/* Nút quay lại cực chất, bồng bềnh góc trái */}


      {/* Bản giao hưởng Màu Sắc - Global Background Tracking (Apple/Spotify Style) */}
      <div 
        className="absolute inset-x-0 top-0 h-[600px] md:h-[900px] -z-20 transition-colors duration-1000 pointer-events-none"
        style={{ background: `linear-gradient(to bottom, ${dominantColor}cc, ${dominantColor}20, #0e0e0e)` }}
      />

      {/* Lớp hạt mờ nhẹ toàn trang để giữ chất liệu Dark Theme */}
      <div className="absolute inset-0 -z-10 bg-[#0e0e0e]/50 pointer-events-none mix-blend-overlay"></div>

      <div className="flex-1 px-12 py-8 pt-20 flex flex-col items-center justify-center max-w-7xl mx-auto w-full z-10 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>

        {/* =========================================
            VINYL RECORD PLAYER SECTION
        =========================================== */}
        <div className="relative flex flex-col items-center mb-12 mt-4 w-full max-w-5xl py-12">

          {/* Hào quang lót dưới đĩa than và cụm Play (Tỏa rộng và đậm hơn) */}
          <div
            className="absolute top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100%] h-[100%] blur-[140px] rounded-full -z-10 opacity-40 mix-blend-screen transition-colors duration-1000 pointer-events-none"
            style={{ backgroundColor: dominantColor }}
          ></div>

          {/* Container chứa Sleeve + Vinyl Side-by-Side */}
          <div className="flex items-center justify-center relative w-full mb-14 drop-shadow-[0_35px_60px_rgba(0,0,0,0.8)]">

            {/* Vinyl Sleeve (Bìa đĩa) - To hơn chút */}
            <div className="relative w-56 h-56 md:w-[290px] md:h-[290px] bg-[#1a1a1a] rounded-2xl -rotate-3 z-30 shadow-2xl overflow-hidden border border-white/10 shrink-0 hidden sm:block">
              <img
                src={song.coverUrl}
                alt="Sleeve"
                className="w-full h-full object-cover opacity-95 hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-black/60 via-transparent to-white/5"></div>
            </div>

            {/* The Rotating Vinyl - Nằm đè lên sleeve 1 phần tạo hiệu ứng chiều sâu */}
            <div
              className={cn(
                "relative w-[290px] h-[290px] md:w-[350px] md:h-[350px] rounded-full bg-[#080808] flex items-center justify-center shadow-[20px_0_80px_rgba(0,0,0,0.9)] border border-white/5 overflow-hidden shrink-0 -ml-20 md:-ml-28 z-20",
                isVinylSpinning ? "animate-[spin_4s_linear_infinite]" : ""
              )}
              style={{
                animationPlayState: isVinylSpinning ? 'running' : 'paused'
              }}
            >
              {/* Rãnh đĩa (Vinyl Lines) - Làm vân đĩa rõ hơn */}
              <div className="absolute inset-0 rounded-full border-[1px] border-white/5 opacity-20"></div>
              <div className="absolute inset-4 md:inset-8 rounded-full border-[15px] md:border-[30px] border-black/40 mix-blend-overlay"></div>
              <div className="absolute inset-12 md:inset-20 rounded-full border-[15px] md:border-[30px] border-black/40 mix-blend-overlay"></div>
              <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,transparent_40%,rgba(0,0,0,0.8)_100%)]"></div>

              {/* Nhãn đĩa ở giữa */}
              <div className="relative w-28 h-28 md:w-44 md:h-44 rounded-full overflow-hidden border-2 border-[#111] z-30 shadow-inner">
                <img src={song.coverUrl} className="w-full h-full object-cover" alt="Label" />
                {/* Lỗ trục quay */}
                <div className="absolute inset-0 m-auto w-3 h-3 md:w-5 md:h-5 rounded-full bg-[#0e0e0e] border border-white/20 shadow-inner"></div>
              </div>

              {/* Gloss Highlight */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none"></div>
            </div>
          </div>

          {/* Song Info & Controls Layout Inline under the side-by-side section */}
          <div className="flex flex-col items-center">
            <h2 className="text-4xl md:text-5xl font-black tracking-tighter mb-2 text-center break-words max-w-2xl px-4"
              style={{ textShadow: `0 4px 20px ${dominantColor}66` }}>
              {song.title}
            </h2>
            <Link to={`/artist/${song.artistId}`} className="text-xl md:text-2xl font-medium text-[#b3b3b3] hover:text-white hover:underline transition-colors mb-6 text-center">
              {song.artist.stageName}
            </Link>

            <div className="flex items-center gap-6">
              <button
                onClick={() => toggleLike(song.id, song.title)}
                className={cn(
                  "p-3 rounded-full transition-all duration-300 hover:scale-110 bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/5",
                  isLiked(song.id) ? "text-[#1db954]" : "text-[#b3b3b3]"
                )}
              >
                <Heart size={28} className={isLiked(song.id) ? "fill-current" : ""} />
              </button>

              <button
                onClick={handlePlay}
                className="w-16 h-16 flex items-center justify-center rounded-full bg-[#1db954] text-black shadow-[0_0_30px_rgba(29,185,84,0.4)] hover:shadow-[0_0_40px_rgba(29,185,84,0.6)] hover:scale-105 active:scale-95 transition-all duration-300 backdrop-blur-md"
              >
                {isCurrentPlaying && isPlaying ? <Pause size={32} className="fill-current" /> : <Play size={32} className="fill-current ml-1" />}
              </button>
            </div>
          </div>
        </div>

        {/* =========================================
            LỜI BÀI HÁT (SYNCED LYRICS KAREOKE)
        =========================================== */}
        <div className="w-full max-w-3xl flex-1 flex flex-col mb-16 px-4 shrink-0">
          {parsedLyrics.length > 0 ? (
            <div
              ref={lyricsContainerRef}
              className="w-full h-80 md:h-96 overflow-y-auto text-center space-y-6 md:space-y-8 pb-32 pt-16 mask-image-y relative scroll-smooth"
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
                      "text-2xl md:text-4xl font-bold leading-tight transition-all duration-500 will-change-[transform,opacity]",
                      isActive
                        ? "text-white opacity-100 scale-105 drop-shadow-[0_0_12px_rgba(255,255,255,0.4)]"
                        : isPassed
                          ? "text-white/40 opacity-40 scale-100 blur-[0.5px]"
                          : "text-white/40 opacity-40 scale-100 hover:text-white/70 hover:opacity-70 cursor-pointer"
                    )}
                    onClick={() => {
                      // (Optional) Tính năng nhấp vào lời nhạc để Seek đến thời gian đó
                      if (isCurrentPlaying) {
                        usePlayerStore.getState().seek(line.time);
                      } else {
                        handlePlay();
                        // Lưu ý: Sau khi play thì phải chờ track load xong mới seek được, tạm thời bỏ qua phức tạp.
                      }
                    }}
                  >
                    {line.text || '♪'}
                  </p>
                );
              })}
            </div>
          ) : (
            <div className="bg-white/5 border border-white/[0.05] p-12 rounded-[2.5rem] flex flex-col items-center justify-center text-center gap-4 backdrop-blur-xl shadow-2xl">
              <Music2 size={48} className="text-white/20" />
              {song.lyrics ? (
                // Có Lời tĩnh
                <div className="w-full max-h-96 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
                  <p className="text-lg md:text-xl font-medium text-white/70 leading-loose whitespace-pre-wrap font-sans transition-colors duration-300">
                    {song.lyrics}
                  </p>
                </div>
              ) : (
                // Chửa có lời
                <p className="text-[#b3b3b3] font-medium">Hiện chưa có lời cho bài hát này.</p>
              )}
            </div>
          )}
        </div>

        {/* Thêm khoảng trống padding dưới để không bj che bởi PlayerBar */}
        <div className="h-12 shrink-0"></div>
      </div>
    </div>
  );
};
