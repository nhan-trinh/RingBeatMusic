import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../../lib/api';
import { usePlayerStore } from '../../stores/player.store';
import { useLibraryStore } from '../../stores/library.store';
import { FastAverageColor } from 'fast-average-color';
import { Play, Pause, Heart, MoreHorizontal, Clock } from 'lucide-react';
import { formatTime, cn } from '../../lib/utils';
import { Link } from 'react-router-dom';

export const PlaylistPage = () => {
  const { id } = useParams();
  const [playlist, setPlaylist] = useState<any>(null);
  const [dominantColor, setDominantColor] = useState('#121212');
  const [loading, setLoading] = useState(true);

  const { setQueueAndPlay, currentContextId, currentTrack, isPlaying, togglePlay } = usePlayerStore();
  const { isLiked, toggleLike, isFollowingPlaylist, toggleFollowPlaylist } = useLibraryStore();
  const playlistFollowed = id ? isFollowingPlaylist(id) : false;

  useEffect(() => {
    const fetchPlaylist = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/playlists/${id}`) as any;
        setPlaylist(res.data);

        if (res.data?.coverUrl) {
          const fac = new FastAverageColor();
          const img = new Image();
          img.crossOrigin = 'Anonymous';
          img.src = res.data.coverUrl;
          img.onload = () => {
            try {
              const color = fac.getColor(img);
              setDominantColor(color.hex);
            } catch (e) { } finally { fac.destroy(); }
          };
        }
      } catch (error) {
        console.error('Lỗi khi fetch playlist:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPlaylist();
  }, [id]);

  if (loading) {
    return (
      <div className="flex-1 w-full min-h-full overflow-y-auto bg-[#121212] p-6 pt-24 text-white">
        <div className="flex items-end gap-6 mb-8 animate-pulse">
          <div className="w-[232px] h-[232px] bg-white/10 rounded shadow-lg"></div>
          <div className="flex flex-col gap-4 flex-1">
            <div className="h-4 w-24 bg-white/10 rounded"></div>
            <div className="h-16 w-3/4 bg-white/10 rounded"></div>
            <div className="h-4 w-1/2 bg-white/10 rounded mt-4"></div>
          </div>
        </div>
        <div className="px-6">
          <div className="flex items-center gap-6 mb-8 animate-pulse">
            <div className="w-14 h-14 bg-white/10 rounded-full"></div>
            <div className="w-10 h-10 bg-white/10 rounded-full"></div>
            <div className="w-10 h-10 bg-white/10 rounded-full"></div>
          </div>
          <div className="flex flex-col gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex gap-4 items-center animate-pulse">
                <div className="w-8 h-8 bg-white/10 rounded"></div>
                <div className="w-10 h-10 bg-white/10 rounded"></div>
                <div className="flex-1 h-4 bg-white/10 rounded"></div>
                <div className="w-16 h-4 bg-white/10 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!playlist) {
    return <div className="p-6 pt-24 text-white text-center">Không tìm thấy Playlist</div>;
  }

  const isThisPlaying = currentContextId === id && isPlaying;
  // Format for player store
  const trackList = playlist.songs.map((item: any) => ({
    id: item.song.id,
    title: item.song.title,
    artistName: item.song.artist.stageName,
    artistId: item.song.artistId,
    coverUrl: item.song.coverUrl,
    audioUrl: item.audioUrl,
    duration: item.song.duration,
  }));

  const handleMainPlay = () => {
    if (trackList.length === 0) return;
    if (currentContextId === id) {
      togglePlay();
    } else {
      setQueueAndPlay(trackList, 0, id);
    }
  };

  const handleTrackPlay = (index: number) => {
    // Nếu đang phát bài hát CHÍNH XÁC ID này trong context này thì Pause
    if (currentContextId === id && currentTrack?.id === trackList[index].id) {
      togglePlay();
    } else {
      setQueueAndPlay(trackList, index, id);
    }
  };

  return (
    <div className="flex-1 w-full min-h-full overflow-y-auto relative isolate text-white">
      {/* Dynamic Header Gradient Background */}
      <div 
        className="absolute inset-0 pointer-events-none transition-colors duration-1000 ease-in-out -z-10 h-[400px]"
        style={{
          background: `linear-gradient(to bottom, ${dominantColor} 0%, #121212 100%)`
        }}
      ></div>

      {/* Header Info */}
      <div className="flex items-end gap-6 px-6 pt-24 pb-6 w-full max-w-screen-2xl mx-auto">
        <img 
          src={playlist.coverUrl} 
          alt={playlist.title} 
          className="w-[232px] h-[232px] object-cover shadow-[0_8px_40px_rgba(0,0,0,0.5)]" 
        />
        <div className="flex flex-col gap-2">
          <span className="text-sm font-bold">Playlist</span>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-2 line-clamp-2">{playlist.title}</h1>
          <p className="text-sm text-[#b3b3b3]">{playlist.description}</p>
          <div className="flex items-center gap-1 text-sm mt-1">
            <span className="font-bold hover:underline cursor-pointer">{playlist.owner?.name}</span>
            <span className="text-[#b3b3b3] px-1">•</span>
            <span className="text-[#b3b3b3]">{playlist.songs.length} bài hát</span>
          </div>
        </div>
      </div>

      {/* Background layer 2 (dark gradient fading down) */}
      <div 
        className="absolute inset-x-0 w-full top-[340px] bottom-0 pointer-events-none -z-10"
        style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, #121212 250px)' }}
      ></div>

      {/* Actions */}
      <div className="px-6 py-6 flex items-center gap-6 w-full max-w-screen-2xl mx-auto relative z-10">
        <button 
          onClick={handleMainPlay}
          className="w-14 h-14 flex items-center justify-center rounded-full bg-[#1db954] text-black shadow-xl hover:scale-105 hover:bg-[#1ed760] transition-all duration-300"
        >
          {isThisPlaying ? <Pause size={28} className="fill-current" /> : <Play size={28} className="fill-current ml-1" />}
        </button>
        <button
          onClick={() => id && toggleFollowPlaylist(id, playlist.title)}
          className={`transition-colors ${
            playlistFollowed ? 'text-[#1db954]' : 'text-[#b3b3b3] hover:text-white'
          }`}
          title={playlistFollowed ? 'Xóa khỏi thư viện' : 'Lưu vào thư viện'}
        >
          <Heart size={32} className={playlistFollowed ? 'fill-[#1db954]' : ''} />
        </button>
        <button className="text-[#b3b3b3] hover:text-white transition-colors">
          <MoreHorizontal size={32} />
        </button>
      </div>

      {/* Tracks Table */}
      <div className="px-6 pb-28 w-full max-w-screen-2xl mx-auto relative z-10">
        <div className="grid grid-cols-[16px_minmax(120px,4fr)_minmax(120px,2fr)_minmax(120px,1fr)] gap-4 px-4 py-2 border-b border-[#ffffff1a] text-[#b3b3b3] text-sm font-medium">
          <div className="text-center">#</div>
          <div>Tiêu đề</div>
          <div className="hidden md:block">Lượt nghe</div>
          <div className="flex justify-end pr-8"><Clock size={16} /></div>
        </div>

        <div className="mt-4 flex flex-col gap-1">
          {playlist.songs.map((item: any, index: number) => {
            const track = item.song;
            // Thay vì dùng currentIndex, dùng song.id để đảm bảo logic khi bị shuffle
            const isRowPlaying = currentContextId === id && currentTrack?.id === track.id;

            return (
              <div 
                key={item.songId} 
                className="grid grid-cols-[16px_minmax(120px,4fr)_minmax(120px,2fr)_minmax(120px,1fr)] gap-4 px-4 py-2 rounded-md hover:bg-white/10 group cursor-pointer text-[#b3b3b3] items-center"
                onDoubleClick={() => handleTrackPlay(index)}
              >
                {/* Chỗ này sẽ chuyển từ số thành Nút play khi hover */}
                <div className="text-base flex items-center justify-center w-full">
                  <div className="group-hover:hidden text-center w-full">
                    {isRowPlaying ? (
                      isPlaying ? (
                        <img src="https://open.spotifycdn.com/cdn/images/equaliser-animated-green.f93a2ef4.gif" className="w-3 h-3 mx-auto" alt="playing" />
                      ) : (
                        <span className="text-[#1db954]">{index + 1}</span>
                      )
                    ) : (
                      index + 1
                    )}
                  </div>
                  <div className="hidden group-hover:flex items-center justify-center w-full text-white">
                    <button onClick={(e) => { e.stopPropagation(); handleTrackPlay(index); }}>
                       {isRowPlaying && isPlaying ? <Pause size={14} className="fill-current" /> : <Play size={14} className="fill-current ml-1" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-3 overflow-hidden">
                  <img src={track.coverUrl} alt={track.title} className="w-10 h-10 object-cover flex-shrink-0 rounded shadow" />
                  <div className="flex flex-col truncate">
                    <span className={cn("text-base truncate font-medium", isRowPlaying ? "text-[#1db954]" : "text-white")}>{track.title}</span>
                    <Link to={`/artist/${track.artistId}`} onClick={(e) => e.stopPropagation()} className="text-sm truncate hover:underline hover:text-white inline-block">
                      {track.artist.stageName}
                    </Link>
                  </div>
                </div>

                <div className="hidden md:flex items-center text-sm truncate">
                  {track.playCount.toLocaleString()}
                </div>

                <div className="flex justify-end items-center gap-4 pr-4 text-sm">
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleLike(track.id, track.title); }}
                    className={`opacity-0 group-hover:opacity-100 transition-opacity ${
                      isLiked(track.id) ? 'text-[#1db954]' : 'text-[#b3b3b3] hover:text-white'
                    }`}
                  >
                    <Heart size={16} className={isLiked(track.id) ? 'fill-[#1db954]' : ''} />
                  </button>
                  {formatTime(track.duration)}
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
