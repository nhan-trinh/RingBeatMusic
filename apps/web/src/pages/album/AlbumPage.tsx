import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { usePlayerStore } from '../../stores/player.store';
import { useLibraryStore } from '../../stores/library.store';
import { FastAverageColor } from 'fast-average-color';
import { Play, Pause, Heart, MoreHorizontal, Clock, BadgeCheck } from 'lucide-react';
import { formatTime, cn } from '../../lib/utils';

const AlbumSkeleton = () => (
  <div className="flex-1 w-full min-h-full bg-[#121212] text-white">
    <div className="px-6 pt-24 pb-6 animate-pulse">
      <div className="flex items-end gap-6 mb-8">
        <div className="w-[232px] h-[232px] bg-white/10 rounded shadow-lg flex-shrink-0" />
        <div className="flex flex-col gap-4 flex-1">
          <div className="h-3 w-16 bg-white/10 rounded" />
          <div className="h-14 w-3/4 bg-white/10 rounded" />
          <div className="h-3 w-1/3 bg-white/10 rounded" />
          <div className="h-3 w-1/4 bg-white/10 rounded" />
        </div>
      </div>
      <div className="flex gap-4 mb-8">
        <div className="w-14 h-14 bg-white/10 rounded-full" />
        <div className="w-32 h-10 bg-white/10 rounded-full" />
      </div>
      <div className="flex flex-col gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 animate-pulse">
            <div className="w-5 h-4 bg-white/10 rounded" />
            <div className="w-10 h-10 bg-white/10 rounded" />
            <div className="flex-1 h-4 bg-white/10 rounded" />
            <div className="w-12 h-4 bg-white/10 rounded" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

export const AlbumPage = () => {
  const { id } = useParams();
  const [album, setAlbum] = useState<any>(null);
  const [dominantColor, setDominantColor] = useState('#121212');
  const [loading, setLoading] = useState(true);

  const { setQueueAndPlay, currentContextId, currentTrack, isPlaying, togglePlay } = usePlayerStore();
  const { isLiked, toggleLike, isFollowingAlbum, toggleFollowAlbum } = useLibraryStore();
  const albumFollowed = id ? isFollowingAlbum(id) : false;

  useEffect(() => {
    const fetchAlbum = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/albums/${id}`) as any;
        setAlbum(res.data);

        if (res.data?.coverUrl) {
          const fac = new FastAverageColor();
          const img = new Image();
          img.crossOrigin = 'Anonymous';
          img.src = res.data.coverUrl;
          img.onload = () => {
            try { const color = fac.getColor(img); setDominantColor(color.hex); }
            catch { } finally { fac.destroy(); }
          };
        }
      } catch (error) {
        console.error('Lỗi khi fetch album:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAlbum();
  }, [id]);

  if (loading) return <AlbumSkeleton />;

  if (!album) {
    return (
      <div className="p-6 pt-24 text-white text-center">
        <h2 className="text-2xl font-bold mb-2">Không tìm thấy Album</h2>
        <p className="text-[#b3b3b3]">Album này không tồn tại hoặc chưa được công khai.</p>
      </div>
    );
  }

  const trackList = album.songs.map((song: any) => ({
    id: song.id,
    title: song.title,
    artistName: album.artist.stageName,
    artistId: album.artist.id,
    coverUrl: song.coverUrl || album.coverUrl,
    audioUrl: song.audioUrl320 || song.audioUrl128 || '',
    duration: song.duration,
  }));

  const isThisPlaying = currentContextId === id && isPlaying;

  const handleMainPlay = () => {
    if (trackList.length === 0) return;
    if (currentContextId === id) {
      togglePlay();
    } else {
      setQueueAndPlay(trackList, 0, id);
    }
  };

  const handleTrackPlay = (index: number) => {
    if (currentContextId === id && currentTrack?.id === trackList[index].id) {
      togglePlay();
    } else {
      setQueueAndPlay(trackList, index, id);
    }
  };

  const releaseYear = album.releaseDate ? new Date(album.releaseDate).getFullYear() : null;
  const totalDuration = album.songs.reduce((acc: number, s: any) => acc + (s.duration || 0), 0);

  return (
    <div className="flex-1 w-full min-h-full overflow-y-auto relative isolate text-white bg-[#121212]">
      {/* Gradient background */}
      <div
        className="absolute inset-0 pointer-events-none -z-10 h-[420px] transition-colors duration-1000"
        style={{ background: `linear-gradient(to bottom, ${dominantColor} 0%, #121212 100%)` }}
      />

      {/* Header */}
      <div className="flex items-end gap-6 px-6 pt-24 pb-6 w-full max-w-screen-2xl mx-auto">
        <img
          src={album.coverUrl}
          alt={album.title}
          className="w-[232px] h-[232px] object-cover shadow-[0_8px_40px_rgba(0,0,0,0.6)] flex-shrink-0"
        />
        <div className="flex flex-col gap-2 min-w-0">
          <span className="text-sm font-bold">Album</span>
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-2 line-clamp-2">{album.title}</h1>
          <div className="flex items-center gap-2 flex-wrap text-sm mt-1">
            <Link to={`/artist/${album.artist.id}`} className="flex items-center gap-1.5 hover:underline font-bold">
              {album.artist.avatarUrl && (
                <img src={album.artist.avatarUrl} alt={album.artist.stageName} className="w-6 h-6 rounded-full object-cover" />
              )}
              {album.artist.stageName}
              {album.artist.isVerified && <BadgeCheck size={14} className="text-[#1db954]" />}
            </Link>
            {releaseYear && <><span className="text-[#b3b3b3]">•</span><span className="text-[#b3b3b3]">{releaseYear}</span></>}
            <span className="text-[#b3b3b3]">•</span>
            <span className="text-[#b3b3b3]">{album.songs.length} bài hát,</span>
            <span className="text-[#b3b3b3]">{formatTime(totalDuration)}</span>
          </div>
        </div>
      </div>

      {/* Gradient overlay */}
      <div
        className="absolute inset-x-0 top-[380px] bottom-0 pointer-events-none -z-10"
        style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, #121212 200px)' }}
      />

      {/* Actions */}
      <div className="px-6 py-4 flex items-center gap-6 w-full max-w-screen-2xl mx-auto">
        <button
          onClick={handleMainPlay}
          disabled={trackList.length === 0}
          className="w-14 h-14 flex items-center justify-center rounded-full bg-[#1db954] text-black shadow-xl hover:scale-105 hover:bg-[#1ed760] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isThisPlaying ? <Pause size={28} className="fill-current" /> : <Play size={28} className="fill-current ml-1" />}
        </button>
        <button
          onClick={() => id && toggleFollowAlbum(id, album.title)}
          className={`transition-colors ${albumFollowed ? 'text-[#1db954]' : 'text-[#b3b3b3] hover:text-white'}`}
          title={albumFollowed ? 'Xóa khỏi thư viện' : 'Lưu vào thư viện'}
        >
          <Heart size={32} className={albumFollowed ? 'fill-[#1db954]' : ''} />
        </button>
        <button className="text-[#b3b3b3] hover:text-white transition-colors">
          <MoreHorizontal size={32} />
        </button>
      </div>

      {/* Track Table */}
      <div className="px-6 pb-28 w-full max-w-screen-2xl mx-auto">
        {/* Header */}
        <div className="grid grid-cols-[16px_minmax(0,1fr)_minmax(0,1fr)_auto] gap-4 px-4 py-2 border-b border-white/10 text-[#b3b3b3] text-xs uppercase tracking-widest">
          <span className="text-center">#</span>
          <span>Tiêu đề</span>
          <span className="hidden md:block">Lượt nghe</span>
          <span className="flex items-center pr-2"><Clock size={14} /></span>
        </div>

        <div className="mt-2 flex flex-col gap-1">
          {trackList.length === 0 ? (
            <div className="text-center py-16 text-[#b3b3b3]">
              <p>Album này chưa có bài hát nào được công khai.</p>
            </div>
          ) : (
            trackList.map((track: any, index: number) => {
              const isRowPlaying = currentContextId === id && currentTrack?.id === track.id;
              return (
                <div
                  key={track.id}
                  onDoubleClick={() => handleTrackPlay(index)}
                  className="group grid grid-cols-[16px_minmax(0,1fr)_minmax(0,1fr)_auto] gap-4 px-4 py-2 rounded-md hover:bg-white/10 cursor-pointer text-[#b3b3b3] items-center"
                >
                  {/* Index / Play */}
                  <div className="text-sm flex items-center justify-center">
                    <span className={cn("group-hover:hidden", isRowPlaying && "text-[#1db954]")}>
                      {isRowPlaying && isPlaying
                        ? <img src="https://open.spotifycdn.com/cdn/images/equaliser-animated-green.f93a2ef4.gif" className="w-3 h-3 mx-auto" alt="playing" />
                        : index + 1}
                    </span>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleTrackPlay(index); }}
                      className="hidden group-hover:flex text-white"
                    >
                      {isRowPlaying && isPlaying
                        ? <Pause size={14} className="fill-current" />
                        : <Play size={14} className="fill-current ml-0.5" />}
                    </button>
                  </div>

                  {/* Title (dùng cover album vì songs trong album dùng chung cover) */}
                  <div className="flex items-center gap-3 overflow-hidden">
                    <img
                      src={track.coverUrl || album.coverUrl}
                      alt={track.title}
                      className="w-10 h-10 object-cover rounded flex-shrink-0 shadow"
                    />
                    <span className={cn("text-sm font-medium truncate", isRowPlaying ? "text-[#1db954]" : "text-white")}>
                      {track.title}
                    </span>
                  </div>

                  {/* Play count */}
                  <span className="hidden md:block text-sm truncate">
                    {album.songs[index]?.playCount?.toLocaleString() || '—'}
                  </span>

                  {/* Duration + Like */}
                  <div className="flex items-center gap-4 pr-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleLike(track.id, track.title); }}
                      className={`opacity-0 group-hover:opacity-100 transition-opacity ${
                        isLiked(track.id) ? 'text-[#1db954]' : 'text-[#b3b3b3] hover:text-white'
                      }`}
                    >
                      <Heart size={16} className={isLiked(track.id) ? 'fill-[#1db954]' : ''} />
                    </button>
                    <span className="text-sm">{formatTime(track.duration)}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Copyright */}
        {releaseYear && (
          <div className="mt-8 text-[#b3b3b3] text-xs">
            <p>© {releaseYear} {album.artist.stageName}</p>
          </div>
        )}
      </div>
    </div>
  );
};
