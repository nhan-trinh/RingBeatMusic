import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { MediaCard } from '../../components/shared/MediaCard';

const BROWSE_CATEGORIES = [
  { id: '1', name: 'Podcasts', color: 'bg-[#E13300]' },
  { id: '2', name: 'Cho bạn', color: 'bg-[#1E3264]' },
  { id: '3', name: 'Mới phát hành', color: 'bg-[#E8115B]' },
  { id: '4', name: 'Nhạc Việt', color: 'bg-[#148A08]' },
  { id: '5', name: 'Pop', color: 'bg-[#D84000]' },
  { id: '6', name: 'K-Pop', color: 'bg-[#148A08]' },
  { id: '7', name: 'Chill', color: 'bg-[#503750]' },
  { id: '8', name: 'Hip-Hop', color: 'bg-[#BC5900]' },
  { id: '9', name: 'Buồn', color: 'bg-[#8D67AB]' },
  { id: '10', name: 'Tập luyện', color: 'bg-[#777777]' },
];

export const SearchPage = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q');

  // Luyện lấy dữ liệu tìm kiếm siêu tốc vô tiền khoáng hậu với React Query cache
  const { data: results, isLoading: loading } = useQuery({
    queryKey: ['search', query],
    queryFn: async () => {
      const res = await api.get(`/search?q=${encodeURIComponent(query!)}`) as any;
      return res.data;
    },
    enabled: !!query, // Chỉ chạy Fetch nếu user đã nhập query
  });

  // Giao diện khi chưa gõ tìm kiếm
  if (!query) {
    return (
      <div className="p-6 pt-24 min-h-full w-full max-w-screen-2xl mx-auto text-white">
        <h2 className="text-2xl font-bold mb-6">Duyệt tìm tất cả</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {BROWSE_CATEGORIES.map((cat) => (
            <div 
              key={cat.id} 
              className={`relative overflow-hidden rounded-lg aspect-square p-4 cursor-pointer hover:scale-[1.02] hover:brightness-110 transition-all ${cat.color}`}
            >
              <span className="text-xl font-bold tracking-tight">{cat.name}</span>
              {/* Bóng trang trí cho sinh động giống spotify */}
              <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-black/20 rounded-full rotate-12 blur-sm"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Giao diện đang loading -> SKELETON
  if (loading) {
    return (
      <div className="p-6 pt-24 min-h-full w-full max-w-screen-2xl mx-auto">
        <div className="h-8 w-48 bg-white/10 rounded mb-6 animate-pulse"></div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
           {Array.from({ length: 5 }).map((_, i) => (
             <div key={i} className="bg-[#181818] p-4 rounded-md animate-pulse">
               <div className="w-full aspect-square bg-white/10 rounded mb-4 shadow-[0_8px_24px_rgba(0,0,0,0.5)]"></div>
               <div className="h-4 bg-white/10 rounded w-3/4 mb-2"></div>
               <div className="h-3 bg-white/10 rounded w-1/2"></div>
             </div>
           ))}
        </div>
      </div>
    );
  }

  // Giao diện có kết quả
  const hasResults = results?.songs?.length > 0 || results?.artists?.length > 0 || results?.albums?.length > 0;

  return (
    <div className="p-6 pt-24 min-h-full w-full max-w-screen-2xl mx-auto text-white">
      {hasResults ? (
        <div className="flex flex-col gap-8">
          {results.artists?.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold mb-6">Nghệ sĩ</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {results.artists.map((artist: any) => (
                  <MediaCard 
                    key={artist.id}
                    id={artist.id}
                    title={artist.stageName}
                    subtitle="Nghệ sĩ"
                    coverUrl={artist.avatarUrl || 'https://images.unsplash.com/photo-1549834125-82d3c48159a3?auto=format&fit=crop&q=80&w=200&h=200'}
                    isCircle={true}
                    type="artist"
                  />
                ))}
              </div>
            </section>
          )}

          {results.albums?.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold mb-6">Album</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {results.albums.map((album: any) => (
                  <MediaCard 
                    key={album.id}
                    id={album.id}
                    title={album.title}
                    subtitle={album.artistName}
                    coverUrl={album.coverUrl || 'https://images.unsplash.com/photo-1493225457124-a1a2a5f5f9af?auto=format&fit=crop&q=80&w=200&h=200'}
                    type="album"
                  />
                ))}
              </div>
            </section>
          )}

          {results.songs?.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold mb-6">Bài hát</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {results.songs.map((song: any) => (
                  <MediaCard 
                    key={song.id}
                    id={song.id}
                    title={song.title}
                    subtitle={song.artistName}
                    coverUrl={song.coverUrl}
                    type="song"
                    songs={[{
                      id: song.id,
                      title: song.title,
                      artistName: song.artistName,
                      artistId: song.artistId,
                      coverUrl: song.coverUrl,
                      audioUrl: song.audioUrl,
                      canvasUrl: song.canvasUrl,
                      duration: song.duration
                    }]}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      ) : (
        <div className="text-center mt-20">
          <h2 className="text-2xl font-bold mb-2">Không tìm thấy kết quả nào cho "{query}"</h2>
          <p className="text-[#B3B3B3]">Vui lòng kiểm tra lại chính tả hoặc dùng các từ khóa khác.</p>
        </div>
      )}
    </div>
  );
};
