import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { MediaCard } from '../../components/shared/MediaCard';
import { RecentCard } from '../../components/shared/RecentCard';
import { MediaCarousel } from '../../components/shared/MediaCarousel';
import { FastAverageColor } from 'fast-average-color';
import { Link } from 'react-router-dom';

export const HomePage = () => {
  const [dominantColor, setDominantColor] = useState('#121212');

  // Luyện data trang chủ bằng React Query (Cache vô hạn siêu bám dính)
  const { data: feedData } = useQuery({
    queryKey: ['homeFeed'],
    queryFn: async () => {
      const res = await api.get('/home/feed') as any;
      return res.data;
    }
  });

  useEffect(() => {
    if (!feedData) return;
    
    // Phát hiện màu từ ảnh đầu tiên
    if (feedData?.recentlyPlayed?.[0]?.coverUrl) {
      const fac = new FastAverageColor();
      const img = new Image();
      img.crossOrigin = 'Anonymous'; // Bắt buộc cho CORS
      img.src = feedData.recentlyPlayed[0].coverUrl + (feedData.recentlyPlayed[0].coverUrl.includes('?') ? '&' : '?') + 'corsbuster=' + Date.now();
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
  }, [feedData]);

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
        <Section title="Dành cho bạn" showAllLink="/section/made-for-you">
          <MediaCarousel>
            {feedData.madeForYou?.map((item: any) => (
              <MediaCard key={item.id} id={item.id} title={item.title} subtitle={item.description} coverUrl={item.coverUrl} songs={item.songs} isPublic={item.isPublic} ownerId={item.ownerId} />
            ))}
          </MediaCarousel>
        </Section>

        {/* Trending Section */}
        {feedData.trending?.length > 0 && (
          <Section title="Thịnh hành" showAllLink="/section/trending">
            <MediaCarousel>
              {feedData.trending?.map((item: any) => (
                <MediaCard key={item.id} id={item.id} title={item.title} subtitle={item.description} coverUrl={item.coverUrl} songs={item.songs} isPublic={item.isPublic} ownerId={item.ownerId} />
              ))}
            </MediaCarousel>
          </Section>
        )}

        {/* ✅ New Releases - Bài hát mới nhất */}
        {feedData.newReleases?.length > 0 && (
          <Section title="Mới phát hành" showAllLink="/section/new-releases">
            <MediaCarousel>
              {feedData.newReleases?.map((song: any) => (
                <MediaCard 
                   key={song.id} 
                   id={song.id} 
                   title={song.title} 
                   subtitle={song.artistName} 
                   coverUrl={song.coverUrl} 
                   type="song"
                   songs={[song]}
                />
              ))}
            </MediaCarousel>
          </Section>
        )}

        {/* ✅ Top Songs - Được nghe nhiều */}
        {feedData.topSongs?.length > 0 && (
          <Section title="Được nghe nhiều nhất" showAllLink="/section/top-songs">
            <MediaCarousel>
                {feedData.topSongs?.map((song: any) => (
                  <MediaCard 
                    key={song.id} 
                    id={song.id} 
                    title={song.title} 
                    subtitle={song.artistName} 
                    coverUrl={song.coverUrl} 
                    type="song"
                    songs={[song]}
                  />
                ))}
            </MediaCarousel>
          </Section>
        )}

        {/* ✅ New Albums */}
        {feedData.newAlbums?.length > 0 && (
          <Section title="Album mới phát hành" showAllLink="/section/new-albums">
            <MediaCarousel>
                {feedData.newAlbums?.map((album: any) => (
                  <MediaCard 
                    key={album.id} 
                    id={album.id} 
                    title={album.title} 
                    subtitle={album.artistName} 
                    coverUrl={album.coverUrl} 
                    type="album"
                  />
                ))}
            </MediaCarousel>
          </Section>
        )}
      </div>
    </div>
  );
};

// ─── Helper Components ─────────────────────────────────────────────────────────
const Section = ({ title, showAllLink, children }: { title: string; showAllLink?: string; children: React.ReactNode }) => (
  <section className="mb-10 w-full">
    <div className="flex items-end justify-between mb-4">
      <h2 className="text-2xl font-bold text-white tracking-tight hover:underline cursor-pointer">{title}</h2>
      {showAllLink && (
        <Link to={showAllLink} className="text-sm font-bold text-[#b3b3b3] hover:text-white transition-colors hover:underline">
          Hiện tất cả
        </Link>
      )}
    </div>
    {children}
  </section>
);


