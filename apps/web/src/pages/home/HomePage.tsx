import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { MediaCard } from '../../components/shared/MediaCard';
import { RecentCard } from '../../components/shared/RecentCard';
import { FastAverageColor } from 'fast-average-color';
import { usePlayerStore } from '../../stores/player.store';
import { useLibraryStore } from '../../stores/library.store';
import { Play, Pause, Heart } from 'lucide-react';
import { formatTime } from '../../lib/utils';
import { Link } from 'react-router-dom';
import { SongContextMenu, useContextMenu } from '../../components/shared/SongContextMenu';

export const HomePage = () => {
  const [feedData, setFeedData] = useState<any>(null);
  const [dominantColor, setDominantColor] = useState('#121212');

  useEffect(() => {
    const fetchFeed = async () => {
      try {
        const res = await api.get('/home/feed') as any;
        setFeedData(res.data);

        // Phát hiện màu từ ảnh đầu tiên
        if (res.data?.recentlyPlayed?.[0]?.coverUrl) {
          const fac = new FastAverageColor();
          const img = new Image();
          img.crossOrigin = 'Anonymous'; // Bắt buộc cho CORS
          img.src = res.data.recentlyPlayed[0].coverUrl;
          img.onload = () => {
            try {
              const color = fac.getColor(img);
              setDominantColor(color.hex);
            } catch (err) {
              console.log('Không thể lấy màu do CORS', err);
            } finally {
              fac.destroy();
            }
          };
        }
      } catch (error) {
        console.error('Lỗi khi lấy dữ liệu HomePage', error);
      }
    };
    fetchFeed();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Chào buổi sáng';
    if (hour < 18) return 'Chào buổi chiều';
    return 'Chào buổi tối';
  };

  if (!feedData) {
    return (
      <div className="p-6 pt-24 min-h-full w-full max-w-screen-2xl mx-auto text-white">
        {/* Skeleton cho Recently Played */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-16 lg:h-20 bg-white/10 rounded flex overflow-hidden animate-pulse">
              <div className="w-16 lg:w-20 bg-white/20"></div>
            </div>
          ))}
        </div>

        {/* Skeleton cho Made for you */}
        <div className="mb-8">
          <div className="h-8 w-48 bg-white/10 rounded mb-4 animate-pulse"></div>
          <div className="flex gap-6 overflow-hidden">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-[#181818] p-4 rounded-md animate-pulse min-w-[200px] flex-1">
                <div className="w-full aspect-square bg-white/10 rounded mb-4 shadow-[0_8px_24px_rgba(0,0,0,0.5)]"></div>
                <div className="h-4 bg-white/10 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-white/10 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full min-h-full overflow-y-auto relative isolate ">
      {/* Dynamic Gradient Background Layer */}
      <div
        className="absolute inset-0 pointer-events-none transition-colors duration-1000 ease-in-out -z-10"
        style={{ background: `linear-gradient(to bottom, ${dominantColor}88 0%, #121212 332px)` }}
      />

      <div className="px-6 pt-20 pb-28 relative z-10 w-full max-w-screen-2xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-6 tracking-tight">{getGreeting()}</h1>

        {/* Recently Played Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-10 w-full">
          {feedData.recentlyPlayed?.map((item: any) => (
            <RecentCard key={item.id} id={item.id} title={item.title} coverUrl={item.coverUrl} songs={item.songs} isSong={item.isSong} />
          ))}
        </div>

        {/* Made For You Section */}
        <Section title="Dành cho bạn">
          <CardGrid items={feedData.madeForYou} />
        </Section>

        {/* Trending Section */}
        {feedData.trending?.length > 0 && (
          <Section title="Thịnh hành">
            <CardGrid items={feedData.trending} />
          </Section>
        )}

        {/* ✅ New Releases - Bài hát mới nhất */}
        {feedData.newReleases?.length > 0 && (
          <Section title="Mới phát hành">
            <SongRow songs={feedData.newReleases} contextId="new-releases" />
          </Section>
        )}

        {/* ✅ Top Songs - Đang thịnh */}
        {feedData.topSongs?.length > 0 && (
          <Section title="Đang thịnh hành">
            <SongRow songs={feedData.topSongs} contextId="top-songs" />
          </Section>
        )}

        {/* ✅ New Albums */}
        {feedData.newAlbums?.length > 0 && (
          <Section title="Album mới phát hành">
            <AlbumGrid albums={feedData.newAlbums} />
          </Section>
        )}
      </div>
    </div>
  );
};

// ─── Helper Components ─────────────────────────────────────────────────────────
const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="mb-10 w-full">
    <div className="flex items-end justify-between mb-4">
      <h2 className="text-2xl font-bold text-white">{title}</h2>
    </div>
    {children}
  </section>
);

const CardGrid = ({ items }: { items: any[] }) => (
  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6 w-full">
    {items?.map((item: any) => (
      <MediaCard key={item.id} id={item.id} title={item.title} subtitle={item.description} coverUrl={item.coverUrl} songs={item.songs} />
    ))}
  </div>
);

const SongRow = ({ songs, contextId }: { songs: any[], contextId: string }) => {
  const { setQueueAndPlay, currentTrack, currentContextId, isPlaying, togglePlay } = usePlayerStore();
  const { isLiked, toggleLike } = useLibraryStore();
  const { menu, openMenu, closeMenu } = useContextMenu();

  return (
    <>
      <div className="flex flex-col gap-1">
        {songs.map((song: any, index: number) => {
          const isRowPlaying = currentContextId === contextId && currentTrack?.id === song.id;
          const handlePlay = () => {
            if (isRowPlaying) { togglePlay(); }
            else { setQueueAndPlay(songs, index, contextId); }
          };
          return (
            <div
              key={song.id}
              onDoubleClick={handlePlay}
              onContextMenu={(e) => openMenu(e, song)}
              className="group flex items-center gap-4 px-3 py-2 rounded-md hover:bg-white/10 cursor-pointer text-[#b3b3b3]"
            >
              <div className="w-10 h-10 relative flex-shrink-0">
                <img src={song.coverUrl || '/placeholder.jpg'} alt={song.title} className="w-10 h-10 rounded object-cover" />
                <button
                  onClick={(e) => { e.stopPropagation(); handlePlay(); }}
                  className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 rounded transition-opacity"
                >
                  {isRowPlaying && isPlaying ? <Pause size={14} className="fill-white text-white" /> : <Play size={14} className="fill-white text-white ml-0.5" />}
                </button>
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium truncate ${isRowPlaying ? 'text-[#1DB954]' : 'text-white'}`}>{song.title}</p>
                <p className="text-xs truncate">{song.artistName}</p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <button
                  onClick={(e) => { e.stopPropagation(); toggleLike(song.id, song.title); }}
                  className={`transition-opacity ${isLiked(song.id) ? 'text-[#1DB954] opacity-100' : 'opacity-0 group-hover:opacity-100 hover:text-white'
                    }`}
                >
                  <Heart size={14} className={isLiked(song.id) ? 'fill-[#1DB954]' : ''} />
                </button>
                <span className="text-xs">{formatTime(song.duration)}</span>
              </div>
            </div>
          );
        })}
      </div>

      {menu && (
        <SongContextMenu
          song={menu.song}
          position={menu.position}
          onClose={closeMenu}
          onPlay={() => {
            const idx = songs.findIndex(s => s.id === menu.song.id);
            if (idx !== -1) setQueueAndPlay(songs, idx, contextId);
          }}
        />
      )}
    </>
  );
};

const AlbumGrid = ({ albums }: { albums: any[] }) => (
  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6 w-full">
    {albums.map((album) => (
      <Link
        key={album.id}
        to={`/album/${album.id}`}
        className="group hover:bg-[#282828] p-4 rounded-xl transition-colors cursor-pointer"
      >
        <div className="relative mb-4">
          {album.coverUrl ? (
            <img
              src={album.coverUrl}
              alt={album.title}
              className="w-full aspect-square object-cover rounded-md shadow-lg"
            />
          ) : (
            <div className="w-full aspect-square bg-[#282828] group-hover:bg-[#3e3e3e] rounded-md flex items-center justify-center transition-colors">
              <span className="text-4xl">💿</span>
            </div>
          )}
          <button className="absolute bottom-2 right-2 w-10 h-10 bg-[#1DB954] text-black rounded-full flex items-center justify-center shadow-xl opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-200">
            <Play size={18} className="fill-current ml-0.5" />
          </button>
        </div>
        <p className="font-bold text-white truncate text-sm">{album.title}</p>
        <p className="text-xs text-[#b3b3b3] mt-1 truncate">
          {album.artistName} • {album.songCount} bài
        </p>
      </Link>
    ))}
  </div>
);

