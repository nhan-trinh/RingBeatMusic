import { Home, Search, Library, Plus, Heart, Music2, CheckCircle2, LayoutDashboard, ShieldCheck, Loader2 } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useLibraryStore } from '../../stores/library.store';
import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { useAuthStore } from '../../stores/auth.store';

export const Sidebar = ({ className }: { className?: string }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const {
    isHydrated, libraryVersion, playlists,
    createPlaylist,
  } = useLibraryStore();
  const [likedSongs, setLikedSongs] = useState<any[]>([]);
  const [followedArtists, setFollowedArtists] = useState<any[]>([]);
  const [creating, setCreating] = useState(false);

  const isArtist = user?.role === 'ARTIST';
  const isAdmin = user?.role === 'ADMIN';

  // Fetch liked songs metadata để render trong sidebar
  useEffect(() => {
    if (!isAuthenticated || !isHydrated) return;
    const fetchSidebarData = async () => {
      try {
        const res = await api.get('/users/library') as any;
        setLikedSongs(res.data?.likedSongs || []);
        setFollowedArtists(res.data?.followedArtists || []);
      } catch { }
    };
    fetchSidebarData();
  }, [isAuthenticated, isHydrated, libraryVersion]); // Chờ backend cập nhật xong mới re-fetch

  const handleCreatePlaylist = async () => {
    setCreating(true);
    const playlist = await createPlaylist('Playlist mới');
    setCreating(false);
    if (playlist) navigate(`/playlist/${playlist.id}`);
  };

  const navItems = [
    { label: 'Trang chủ', path: '/', icon: Home },
    { label: 'Tìm kiếm', path: '/search', icon: Search },
  ];

  const hasItems = likedSongs.length > 0 || followedArtists.length > 0 || playlists.length > 0;

  return (
    <nav className={twMerge('flex flex-col gap-2 h-full', className)}>
      {/* Top Nav */}
      <div className="bg-[#121212] rounded-lg p-4 flex flex-col gap-4">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={clsx(
                'flex items-center gap-4 text-sm font-bold transition-colors',
                isActive ? 'text-white' : 'text-[#B3B3B3] hover:text-white'
              )}
            >
              <item.icon className="h-6 w-6" strokeWidth={isActive ? 2.5 : 2} />
              {item.label}
            </Link>
          );
        })}

        {(isArtist || isAdmin) && (
          <Link
            to="/artist-dashboard"
            className={clsx(
              'flex items-center gap-4 text-sm font-bold transition-colors',
              location.pathname.startsWith('/artist-dashboard') ? 'text-[#1DB954]' : 'text-[#B3B3B3] hover:text-white'
            )}
          >
            <LayoutDashboard className="h-6 w-6" />
            Artist Hub
          </Link>
        )}
        {isAdmin && (
          <Link
            to="/admin"
            className={clsx(
              'flex items-center gap-4 text-sm font-bold transition-colors',
              location.pathname.startsWith('/admin') ? 'text-[#1DB954]' : 'text-[#B3B3B3] hover:text-white'
            )}
          >
            <ShieldCheck className="h-6 w-6" />
            Admin
          </Link>
        )}
      </div>

      {/* Library Box */}
      <div className="bg-[#121212] rounded-lg flex-1 flex flex-col overflow-hidden">
        <div className="p-4 flex items-center justify-between text-[#B3B3B3] font-bold shadow-sm">
          <Link to="/library" className="flex items-center gap-4 hover:text-white transition-colors duration-200">
            <Library className="h-6 w-6" />
            Thư viện
          </Link>
          {isAuthenticated && (
            <button
              onClick={handleCreatePlaylist}
              disabled={creating}
              title="Tạo playlist mới"
              className="hover:text-white transition-colors rounded-full p-1 hover:bg-[#282828] disabled:opacity-50"
            >
              {creating ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" />}
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-2 custom-scrollbar">
          {!isAuthenticated || !hasItems ? (
            <>
              <div className="p-4 bg-[#242424] rounded-lg mt-2 mb-4 text-sm">
                <p className="font-bold text-white mb-2">Tạo playlist đầu tiên của bạn</p>
                <p className="text-[#B3B3B3] mb-4">Rất dễ, chúng tôi sẽ giúp bạn</p>
                <button
                  onClick={handleCreatePlaylist}
                  className="bg-white text-black font-bold px-4 py-1.5 rounded-full hover:scale-105 transition-transform text-sm"
                >
                  Tạo danh sách phát
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-col gap-1">
              {/* Liked Songs card */}
              {likedSongs.length > 0 && (
                <Link
                  to="/library"
                  className={clsx(
                    'flex items-center gap-3 px-2 py-2 rounded-md hover:bg-white/10 transition-colors cursor-pointer group',
                    location.pathname === '/library' && 'bg-[#282828]'
                  )}
                >
                  <div className="w-12 h-12 rounded bg-gradient-to-br from-[#7b52b8] to-[#2d0f6e] flex items-center justify-center flex-shrink-0 shadow">
                    <Heart className="w-5 h-5 text-white fill-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">Bài hát đã thích</p>
                    <p className="text-xs text-[#B3B3B3] truncate">
                      Danh sách phát • {likedSongs.length} bài hát
                    </p>
                  </div>
                </Link>
              )}

              {/* User playlists */}
              {playlists.map((playlist) => (
                <Link
                  key={playlist.id}
                  to={`/playlist/${playlist.id}`}
                  className={clsx(
                    'flex items-center gap-3 px-2 py-2 rounded-md hover:bg-white/10 transition-colors cursor-pointer group',
                    location.pathname === `/playlist/${playlist.id}` && 'bg-[#282828]'
                  )}
                >
                  <div className="w-12 h-12 rounded bg-[#282828] flex items-center justify-center flex-shrink-0 shadow overflow-hidden">
                    {playlist.coverUrl
                      ? <img src={playlist.coverUrl} alt={playlist.title} className="w-full h-full object-cover" />
                      : <Music2 className="w-5 h-5 text-[#b3b3b3]" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-white truncate">{playlist.title}</p>
                    <p className="text-xs text-[#B3B3B3] truncate">Danh sách phát</p>
                  </div>
                </Link>
              ))}

              {/* Followed Artists */}
              {followedArtists.map((artist: any) => (
                <Link
                  key={artist.id}
                  to={`/artist/${artist.id}`}
                  className="flex items-center gap-3 px-2 py-2 rounded-md hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <img
                    src={artist.avatarUrl || 'https://images.unsplash.com/photo-1549834125-82d3c48159a3?auto=format&fit=crop&q=80&w=100&h=100'}
                    alt={artist.stageName}
                    className="w-12 h-12 rounded-full object-cover flex-shrink-0 shadow"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1">
                      <p className="text-sm font-medium text-white truncate">{artist.stageName}</p>
                      {artist.isVerified && <CheckCircle2 size={12} className="text-[#1DB954] flex-shrink-0" />}
                    </div>
                    <p className="text-xs text-[#B3B3B3]">Nghệ sĩ</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};
