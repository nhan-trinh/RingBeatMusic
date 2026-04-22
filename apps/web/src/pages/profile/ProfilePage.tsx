import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/auth.store';
import { api } from '../../lib/api';
import { User as UserIcon, Play, BadgeCheck } from 'lucide-react';
import { Skeleton } from '../../components/ui/Skeleton';
import { MediaCard } from '../../components/shared/MediaCard';
import { cn } from '@/lib/utils';

export const ProfilePage = () => {
  const { id } = useParams();
  const { user: currentUser } = useAuthStore();
  const [profile, setProfile] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const isOwnProfile = !id || id === currentUser?.id;
  const targetId = id || currentUser?.id;

  useEffect(() => {
    const fetchProfileData = async () => {
      setLoading(true);
      try {
        const profileRes = await api.get(`/users/${targetId}`) as any;
        setProfile(profileRes.data);

        // Chỉ lấy lịch sử nếu là hồ sơ chính chủ
        if (isOwnProfile) {
          const historyRes = await api.get('/users/history') as any;
          setHistory(historyRes.data);
        }
      } catch (error) {
        console.error('Failed to fetch profile:', error);
      } finally {
        setTimeout(() => setLoading(false), 800); // Giả lập độ trễ để thấy skeleton mượt hơn
      }
    };

    if (targetId) fetchProfileData();
  }, [targetId, isOwnProfile]);

  const handleFollow = async () => {
    if (!profile || isOwnProfile) return;
    try {
      await api.post(`/users/${profile.id}/follow`);
      setProfile({ ...profile, isFollowing: true, stats: { ...profile.stats, followers: profile.stats.followers + 1 } });

      // Thông báo cho socket để join room hoạt động ngay lập tức
      const { socketService } = await import('../../lib/socket');
      socketService.emit('social:follow_success', { followingId: profile.id });
    } catch (error) {
      console.error('Follow failed:', error);
    }
  };

  const handleUnfollow = async () => {
    if (!profile || isOwnProfile) return;
    try {
      await api.delete(`/users/${profile.id}/unfollow`);
      setProfile({ ...profile, isFollowing: false, stats: { ...profile.stats, followers: Math.max(0, profile.stats.followers - 1) } });
    } catch (error) {
      console.error('Unfollow failed:', error);
    }
  };

  if (loading) {
    return <ProfileSkeleton />;
  }

  if (!profile) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-[#B3B3B3]">
        <UserIcon size={64} className="mb-4 opacity-20" />
        <h2 className="text-2xl font-bold text-white">Không tìm thấy người dùng</h2>
        <Link to="/" className="mt-4 text-[#1DB954] hover:underline">Quay lại trang chủ</Link>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar">
      {/* Header Section */}
      <div className="relative h-[300px] flex items-end p-8 bg-gradient-to-b from-[#535353] to-[#121212]">
        <div className="flex items-center gap-6 z-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="w-48 h-48 rounded-full overflow-hidden shadow-2xl bg-[#282828] flex-shrink-0 group relative">
            {profile.avatarUrl ? (
              <img src={profile.avatarUrl} alt={profile.name} className="w-full h-full object-cover" />
            ) : (
              <UserIcon size={80} className="w-full h-full p-12 text-[#B3B3B3]" />
            )}
            {isOwnProfile && (
              <Link
                to="/settings"
                className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white text-sm font-bold"
              >
                Thay đổi
              </Link>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-white">Hồ sơ</span>
            <div className="flex items-center gap-3 py-2">
              <h1 className="text-6xl font-black text-white leading-none">{profile.name}</h1>
              {profile.isVerified && (
                <BadgeCheck size={48} className="text-[#3d91f4] fill-white" />
              )}
            </div>
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-2 text-sm text-white font-medium">
                <span>{profile.role === 'ARTIST' ? 'Nghệ sĩ' : 'Người nghe'}</span>
                <span className="text-white/60">•</span>
                <span>{profile.stats?.playlists || 0} Playlists công khai</span>
                <span className="text-white/60">•</span>
                <span>{(profile.stats?.followers || 0).toLocaleString()} người theo dõi</span>
              </div>

              {!isOwnProfile && (
                <button
                  onClick={profile.isFollowing ? handleUnfollow : handleFollow}
                  className={cn(
                    "px-8 py-2 rounded-full font-bold text-sm transition-all active:scale-95 border uppercase tracking-wider",
                    profile.isFollowing
                      ? "bg-transparent text-white border-white/40 hover:border-white"
                      : "bg-[#1DB954] text-black border-[#1DB954] hover:bg-[#1ed760] hover:scale-105"
                  )}
                >
                  {profile.isFollowing ? 'Đang theo dõi' : 'Theo dõi'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-8 space-y-12 bg-black/30 backdrop-blur-sm">

        {/* Recently Played (Chỉ hiện cho chính chủ) */}
        {isOwnProfile && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white hover:underline cursor-pointer">Bài hát gần đây</h2>
              <span className="text-sm font-bold text-[#B3B3B3] hover:text-white cursor-pointer uppercase tracking-widest">Xem tất cả</span>
            </div>

            {history.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
                {history.slice(0, 6).map((song: any) => (
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
              </div>
            ) : (
              <div className="text-[#B3B3B3] italic text-sm py-4">Chưa có lịch sử nghe nhạc. Hãy bắt đầu nghe ngay! 🎵</div>
            )}
          </section>
        )}

        {/* Discography (Chỉ hiện cho Artist) */}
        {profile.role === 'ARTIST' && profile.albums?.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white hover:underline cursor-pointer">Danh sách đĩa nhạc</h2>
              <span className="text-sm font-bold text-[#B3B3B3] hover:text-white cursor-pointer uppercase tracking-widest">Xem tất cả</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
              {profile.albums.map((album: any) => (
                <Link key={album.id} to={`/album/${album.id}`} className="bg-[#181818] p-4 rounded-md hover:bg-[#282828] transition-all group cursor-pointer">
                  <div className="relative aspect-square mb-4 shadow-lg rounded-md overflow-hidden">
                    <img src={album.coverUrl || 'https://community.spotify.com/t5/image/serverpage/image-id/25294i2836BD1C1A33BE2E/image-size/large?v=v2&px=999'} alt={album.title} className="w-full h-full object-cover" />
                    <button className="absolute bottom-2 right-2 w-12 h-12 bg-[#1DB954] rounded-full flex items-center justify-center text-black opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all shadow-xl hover:scale-105">
                      <Play size={24} fill="black" />
                    </button>
                  </div>
                  <h3 className="text-white font-bold text-sm truncate">{album.title}</h3>
                  <p className="text-[#B3B3B3] text-xs truncate mt-1">Album • {new Date(album.releaseDate).getFullYear()}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Public Playlists */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white hover:underline cursor-pointer">Danh sách phát công khai</h2>
          </div>

          {profile.playlists?.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
              {profile.playlists.map((pl: any) => (
                <Link key={pl.id} to={`/playlist/${pl.id}`} className="bg-[#181818] p-4 rounded-md hover:bg-[#282828] transition-all group cursor-pointer">
                  <div className="relative aspect-square mb-4 shadow-lg rounded-md overflow-hidden">
                    <img src={pl.coverUrl || 'https://community.spotify.com/t5/image/serverpage/image-id/25294i2836BD1C1A33BE2E/image-size/large?v=v2&px=999'} alt={pl.title} className="w-full h-full object-cover" />
                  </div>
                  <h3 className="text-white font-bold text-sm truncate">{pl.title}</h3>
                  <p className="text-[#B3B3B3] text-xs truncate mt-1">Playlist</p>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-[#B3B3B3] italic text-sm">Hiện chưa có playlist công khai nào.</div>
          )}
        </section>

      </div>
    </div>
  );
};

const ProfileSkeleton = () => (
  <div className="flex-1 overflow-y-auto">
    <div className="h-[300px] flex items-end p-8 bg-[#282828]/50">
      <div className="flex items-center gap-6">
        <Skeleton className="w-48 h-48 rounded-full" />
        <div className="space-y-4">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
    </div>
    <div className="p-8 space-y-12">
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-6 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="space-y-3">
              <Skeleton className="aspect-square w-full rounded-md" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);
