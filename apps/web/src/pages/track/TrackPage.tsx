import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { usePlayerStore } from '../../stores/player.store';
import { useLibraryStore } from '../../stores/library.store';
import { FastAverageColor } from 'fast-average-color';
import { Play, Pause, Heart, Clock, MoreHorizontal, Music2 } from 'lucide-react';
import { formatTime, cn } from '../../lib/utils';

export const TrackPage = () => {
  const { id } = useParams();
  const [song, setSong] = useState<any>(null);
  const [artistSongs, setArtistSongs] = useState<any[]>([]);
  const [dominantColor, setDominantColor] = useState('#121212');
  const [loading, setLoading] = useState(true);

  const { setQueueAndPlay, currentTrack, isPlaying, togglePlay } = usePlayerStore();
  const { isLiked, toggleLike } = useLibraryStore();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/songs/${id}`) as any;
        const songData = res.data;
        setSong(songData);

        // Fetch thêm nhạc của nghệ sĩ này
        const artistRes = await api.get(`/songs/artist/${songData.artistId}`) as any;
        setArtistSongs(artistRes.data.filter((s: any) => s.id !== id).slice(0, 5));

        if (songData.coverUrl) {
          const fac = new FastAverageColor();
          const img = new Image();
          img.crossOrigin = 'Anonymous';
          img.src = songData.coverUrl;
          img.onload = () => {
            try {
              const color = fac.getColor(img);
              setDominantColor(color.hex);
            } catch (e) { } finally { fac.destroy(); }
          };
        }
      } catch (error) {
        console.error('Lỗi khi fetch track info:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex-1 w-full min-h-full bg-[#121212] p-8 pt-24 animate-pulse">
        <div className="flex items-end gap-8 mb-12">
          <div className="w-[232px] h-[232px] bg-white/5 rounded-lg shadow-2xl"></div>
          <div className="flex flex-col gap-4">
            <div className="h-4 w-20 bg-white/5 rounded"></div>
            <div className="h-16 w-96 bg-white/5 rounded"></div>
            <div className="h-4 w-48 bg-white/5 rounded"></div>
          </div>
        </div>
        <div className="space-y-4">
          <div className="h-8 w-32 bg-white/5 rounded"></div>
          <div className="h-40 w-full bg-white/5 rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (!song) return <div className="p-20 text-center">Không tìm thấy bài hát</div>;

  const isCurrentPlaying = currentTrack?.id === song.id && isPlaying;
  
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
        duration: song.duration
      };
      setQueueAndPlay([track], 0, `track:${song.id}`);
    }
  };

  return (
    <div className="flex-1 w-full min-h-full bg-[#121212] relative overflow-y-auto isolate flex flex-col">
      {/* Hero Section with Dynamic Background */}
      <div 
        className="absolute inset-x-0 top-0 h-[400px] -z-10 transition-colors duration-700"
        style={{ background: `linear-gradient(to bottom, ${dominantColor}cc, #121212)` }}
      />
      
      {/* Content Container */}
      <div className="flex-1 px-8 pt-20 pb-24 max-w-7xl mx-auto w-full">
        {/* Track Header */}
        <div className="flex flex-col md:flex-row items-end gap-8 mb-8">
          <div className="relative group flex-shrink-0">
            <img 
              src={song.coverUrl} 
              alt={song.title} 
              className="w-[232px] h-[232px] object-cover rounded-lg shadow-[0_8px_40px_rgba(0,0,0,0.5)]"
            />
          </div>
          
          <div className="flex flex-col gap-2">
            <span className="text-xs font-bold uppercase tracking-widest text-white/90">Bài hát</span>
            <h1 className="text-4xl md:text-7xl lg:text-8xl font-black tracking-tight mb-4 leading-none">
              {song.title}
            </h1>
            <div className="flex items-center flex-wrap gap-2 text-sm font-bold text-white/90">
              <Link to={`/artist/${song.artistId}`} className="hover:underline flex items-center gap-2">
                <img src={song.artist.avatarUrl} className="w-6 h-6 rounded-full object-cover" alt="" />
                {song.artist.stageName}
              </Link>
              <span className="text-white/60">•</span>
              {song.album && (
                <>
                  <Link to={`/album/${song.albumId}`} className="hover:underline">{song.album.title}</Link>
                  <span className="text-white/60">•</span>
                </>
              )}
              <span>{song.createdAt ? new Date(song.createdAt).getFullYear() : '2024'}</span>
              <span className="text-white/60">•</span>
              <span className="flex items-center gap-1.5"><Clock size={14} /> {formatTime(song.duration)}</span>
            </div>
          </div>
        </div>

        {/* Actions Bar */}
        <div className="flex items-center gap-8 py-6">
          <button 
            onClick={handlePlay}
            className="w-14 h-14 flex items-center justify-center rounded-full bg-[#1db954] text-black shadow-xl hover:scale-105 hover:bg-[#1ed760] transition-all duration-300"
          >
            {isCurrentPlaying ? <Pause size={28} className="fill-current" /> : <Play size={28} className="fill-current ml-1" />}
          </button>
          
          <button 
            onClick={() => toggleLike(song.id, song.title)}
            className={cn(
              "p-1.5 rounded-full transition-all hover:scale-110",
              isLiked(song.id) ? "text-[#1db954]" : "text-[#b3b3b3] hover:text-white"
            )}
          >
            <Heart size={32} className={isLiked(song.id) ? "fill-current" : ""} />
          </button>
          
          <button className="text-[#b3b3b3] hover:text-white transition-colors">
            <MoreHorizontal size={32} />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mt-8">
          {/* Lyrics Section */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-2xl font-bold">Lời bài hát</h2>
            {song.lyrics ? (
              <div className="bg-black/20 p-8 rounded-2xl border border-white/5 backdrop-blur-sm">
                <p className="text-xl md:text-2xl font-bold text-white/80 leading-loose whitespace-pre-wrap font-sans tracking-tight">
                  {song.lyrics}
                </p>
              </div>
            ) : (
              <div className="bg-black/20 p-12 rounded-2xl border border-dashed border-white/10 flex flex-col items-center justify-center text-center gap-4">
                <Music2 size={48} className="text-white/10" />
                <p className="text-[#b3b3b3]">Hiện chưa có lời cho bài hát này.</p>
                <button className="text-xs font-bold px-4 py-2 border border-white/20 rounded-full hover:border-white transition-colors">
                  ĐÓNG GÓP LỜI NHẠC
                </button>
              </div>
            )}
          </div>

          {/* Sidebar Info */}
          <div className="space-y-8">
            {/* Artist Info Card */}
            <div className="bg-white/5 rounded-xl p-6 border border-white/5 group hover:bg-white/10 transition-colors">
              <h3 className="text-sm font-bold uppercase text-[#b3b3b3] mb-4 tracking-widest">Nghệ sĩ</h3>
              <div className="flex items-center gap-4">
                <img src={song.artist.avatarUrl} className="w-20 h-20 rounded-full object-cover shadow-lg" alt="" />
                <div>
                  <p className="font-bold text-lg mb-1 group-hover:text-[#1db954] transition-colors">{song.artist.stageName}</p>
                  <p className="text-xs text-[#b3b3b3] font-medium uppercase tracking-wider">{song.genre?.name || 'Pop'}</p>
                </div>
              </div>
              <Link 
                to={`/artist/${song.artistId}`}
                className="mt-6 block text-center py-2 border border-white/20 rounded-full text-sm font-bold hover:border-white transition-colors"
              >
                XEM TRANG CÁ NHÂN
              </Link>
            </div>

            {/* Related Tracks */}
            {artistSongs.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase text-[#b3b3b3] tracking-widest">Khám phá thêm</h3>
                <div className="space-y-1">
                  {artistSongs.map((s) => (
                    <Link 
                      key={s.id}
                      to={`/track/${s.id}`}
                      className="flex items-center gap-3 p-2 rounded-md hover:bg-white/5 transition-colors group"
                    >
                      <img src={s.coverUrl} className="w-10 h-10 rounded object-cover shadow" alt="" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate group-hover:text-white text-[#ededed]">{s.title}</p>
                        <p className="text-xs text-[#b3b3b3]">{s.artist?.stageName || song.artist.stageName}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
