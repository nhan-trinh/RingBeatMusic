import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { MediaCard } from '../../components/shared/MediaCard';
import { Skeleton } from '../../components/ui/Skeleton';

export const SectionPage = () => {
  const { id } = useParams();
  const { data = [], isLoading: loading } = useQuery({
    queryKey: ['section', id],
    queryFn: async () => {
      const res = await api.get(`/search?q=${id}`) as any;
      return res.data.songs || res.data.playlists || res.data.albums || [];
    },
    enabled: !!id,
  });

  const getTitle = () => {
    switch (id) {
      case 'new-releases': return 'Mới phát hành';
      case 'top-songs': return 'Được nghe nhiều nhất';
      case 'made-for-you': return 'Dành cho bạn';
      case 'trending': return 'Thịnh hành';
      case 'new-albums': return 'Album mới phát hành';
      default: return 'Khám phá';
    }
  };

  return (
    <div className="p-6 pt-24 min-h-full w-full max-w-screen-2xl mx-auto text-white">
      <h1 className="text-32 font-bold mb-8">{getTitle()}</h1>
      
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="space-y-4">
              <Skeleton className="aspect-square w-full rounded-md" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
          {data.map((item: any) => (
            <MediaCard 
              key={item.id}
              id={item.id}
              title={item.title}
              subtitle={item.artistName || item.description || ''}
              coverUrl={item.coverUrl}
              type={id === 'new-releases' || id === 'top-songs' ? 'song' : id === 'new-albums' ? 'album' : 'playlist'}
              songs={id === 'new-releases' || id === 'top-songs' ? [item] : (id === 'new-albums' ? [] : item.songs)}
              ownerId={item.ownerId}
            />
          ))}
        </div>
      )}
    </div>
  );
};
