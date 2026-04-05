import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Play, Heart, Music2, CheckCircle2, Clock } from 'lucide-react';
import { api } from '../../lib/api';
import { usePlayerStore } from '../../stores/player.store';
import { useLibraryStore } from '../../stores/library.store';
import { SongContextMenu, useContextMenu } from '../../components/shared/SongContextMenu';

const LibrarySkeletonRow = () => (
  <div className="flex items-center gap-4 px-4 py-2 animate-pulse">
    <div className="w-5 text-center"><div className="h-4 w-4 bg-white/10 rounded mx-auto" /></div>
    <div className="w-10 h-10 bg-white/10 rounded" />
    <div className="flex-1 space-y-1.5">
      <div className="h-3.5 bg-white/10 rounded w-1/3" />
      <div className="h-3 bg-white/10 rounded w-1/4" />
    </div>
    <div className="h-3 bg-white/10 rounded w-12 mr-4" />
  </div>
);

const LibrarySkeletonArtist = () => (
  <div className="flex flex-col items-center gap-3 p-4 animate-pulse">
    <div className="w-full aspect-square rounded-full bg-white/10" />
    <div className="h-3.5 bg-white/10 rounded w-2/3" />
    <div className="h-3 bg-white/10 rounded w-1/2" />
  </div>
);

const formatDuration = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

export const LibraryPage = () => {
  const [activeTab, setActiveTab] = useState<'songs' | 'artists' | 'albums'>('songs');
  const [library, setLibrary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const { setQueueAndPlay, currentTrack, isPlaying, togglePlay, currentContextId } = usePlayerStore();
  const { isLiked, toggleLike, isFollowing, toggleFollow, libraryVersion } = useLibraryStore();
  const { menu, openMenu, closeMenu } = useContextMenu();

  // Re-fetch sau khi API hoàn thành (libraryVersion++ trigger effect này)
  useEffect(() => {
    const fetchLibrary = async () => {
      setLoading(true);
      try {
        const res = await api.get('/users/library') as any;
        setLibrary(res.data);
      } catch (err) {
        console.error('Lỗi khi lấy thư viện:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLibrary();
  }, [libraryVersion]); // 👈 Chỉ re-fetch khi libraryVersion báo hiệu API đã xử lý xong

  const LIBRARY_CONTEXT_ID = 'liked-songs-library';

  const handlePlayAll = () => {
    if (!library?.likedSongs?.length) return;
    const tracks = library.likedSongs.map((s: any) => ({
      id: s.id,
      title: s.title,
      artistName: s.artistName,
      artistId: s.artistId,
      coverUrl: s.coverUrl,
      audioUrl: s.audioUrl,
      duration: s.duration,
    }));
    if (currentContextId === LIBRARY_CONTEXT_ID) {
      togglePlay();
    } else {
      setQueueAndPlay(tracks, 0, LIBRARY_CONTEXT_ID);
    }
  };

  const handlePlayTrack = (index: number) => {
    if (!library?.likedSongs?.length) return;
    const tracks = library.likedSongs.map((s: any) => ({
      id: s.id,
      title: s.title,
      artistName: s.artistName,
      artistId: s.artistId,
      coverUrl: s.coverUrl,
      audioUrl: s.audioUrl,
      duration: s.duration,
    }));
    if (currentContextId === LIBRARY_CONTEXT_ID && currentTrack?.id === tracks[index].id) {
      togglePlay();
    } else {
      setQueueAndPlay(tracks, index, LIBRARY_CONTEXT_ID);
    }
  };

  const isLibraryPlaying = currentContextId === LIBRARY_CONTEXT_ID && isPlaying;

  const TABS = [
    { key: 'songs', label: 'Bài hát đã thích' },
    { key: 'artists', label: 'Nghệ sĩ' },
    { key: 'albums', label: 'Album' },
  ] as const;

  return (
    <div className="min-h-full w-full text-white">
      {/* Header gradient */}
      <div
        className="px-6 pt-20 pb-8 relative"
        style={{ background: 'linear-gradient(to bottom, #522bb3cc, #121212)' }}
      >
        <div className="flex items-end gap-6 mb-6">
          <div className="w-52 h-52 bg-gradient-to-br from-[#7b52b8] to-[#2d0f6e] rounded shadow-2xl flex items-center justify-center flex-shrink-0">
            <Heart className="w-24 h-24 text-white fill-white" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-2 text-white/70">Danh sách phát</p>
            <h1 className="text-7xl font-black text-white mb-6 leading-none">Bài hát đã thích</h1>
            <p className="text-[#b3b3b3] text-sm">
              {library?.likedSongs?.length || 0} bài hát
            </p>
          </div>
        </div>
      </div>

      <div className="px-6 pb-28">
        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                activeTab === tab.key
                  ? 'bg-white text-black'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab: Bài hát đã thích */}
        {activeTab === 'songs' && (
          <>
            {/* Play button */}
            {!loading && (library?.likedSongs?.length || 0) > 0 && (
              <div className="flex items-center gap-6 mb-6">
                <button
                  onClick={handlePlayAll}
                  className="w-14 h-14 bg-[#1DB954] rounded-full flex items-center justify-center hover:scale-105 transition-transform shadow-lg"
                >
                  <Play
                    className="w-6 h-6 text-black fill-black"
                    style={{ transform: isLibraryPlaying ? undefined : 'translateX(1px)' }}
                  />
                </button>
              </div>
            )}

            {/* Header row */}
            {!loading && (library?.likedSongs?.length || 0) > 0 && (
              <div className="grid grid-cols-[16px_1fr_auto] gap-4 px-4 pb-2 border-b border-white/10 text-[#b3b3b3] text-xs uppercase tracking-widest">
                <span>#</span>
                <span>Tiêu đề</span>
                <span className="flex items-center gap-1 pr-1"><Clock size={14} /></span>
              </div>
            )}

            {/* Song rows */}
            <div className="mt-2">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => <LibrarySkeletonRow key={i} />)
              ) : library?.likedSongs?.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <Heart className="w-16 h-16 text-[#b3b3b3] mb-4" />
                  <h3 className="text-xl font-bold mb-2">Bạn chưa thích bài hát nào</h3>
                  <p className="text-[#b3b3b3] text-sm">Nhấn vào ❤️ bên cạnh bài hát để thêm vào đây.</p>
                </div>
              ) : (
                library?.likedSongs?.map((song: any, idx: number) => {
                  const isThisPlaying = currentContextId === LIBRARY_CONTEXT_ID && currentTrack?.id === song.id && isPlaying;
                  return (
                    <div
                      key={song.id}
                      onDoubleClick={() => handlePlayTrack(idx)}
                      onContextMenu={(e) => openMenu(e, {
                        id: song.id,
                        title: song.title,
                        artistName: song.artistName,
                        coverUrl: song.coverUrl,
                        audioUrl: song.audioUrl,
                        duration: song.duration,
                      })}
                      className="group grid grid-cols-[16px_1fr_auto] gap-4 items-center px-4 py-2 rounded-md hover:bg-white/10 cursor-pointer"
                    >
                      <span className="text-[#b3b3b3] text-sm text-center group-hover:hidden">
                        {isThisPlaying ? <Music2 size={14} className="text-[#1DB954] mx-auto" /> : idx + 1}
                      </span>
                      <button
                        onClick={() => handlePlayTrack(idx)}
                        className="hidden group-hover:flex text-white justify-center"
                      >
                        <Play size={14} className="fill-white" />
                      </button>

                      <div className="flex items-center gap-3 min-w-0">
                        <img src={song.coverUrl} alt={song.title} className="w-10 h-10 rounded object-cover flex-shrink-0" />
                        <div className="min-w-0">
                          <p className={`text-sm font-medium truncate ${isThisPlaying ? 'text-[#1DB954]' : 'text-white'}`}>
                            {song.title}
                          </p>
                          <Link
                            to={`/artist/${song.artistId}`}
                            className="text-xs text-[#b3b3b3] hover:underline truncate block"
                            onClick={e => e.stopPropagation()}
                          >
                            {song.artistName}
                          </Link>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleLike(song.id, song.title); }}
                          className={`opacity-0 group-hover:opacity-100 transition-opacity ${isLiked(song.id) ? 'text-[#1DB954]' : 'text-[#b3b3b3] hover:text-white'}`}
                        >
                          <Heart size={16} className={isLiked(song.id) ? 'fill-[#1DB954]' : ''} />
                        </button>
                        <span className="text-[#b3b3b3] text-sm">{formatDuration(song.duration)}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Context menu */}
            {menu && (
              <SongContextMenu
                song={menu.song}
                position={menu.position}
                onClose={closeMenu}
                onPlay={() => {
                  const idx = library?.likedSongs?.findIndex((s: any) => s.id === menu.song.id) ?? -1;
                  if (idx !== -1) handlePlayTrack(idx);
                }}
              />
            )}
          </>
        )}

        {/* Tab: Nghệ sĩ */}
        {activeTab === 'artists' && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => <LibrarySkeletonArtist key={i} />)
            ) : library?.followedArtists?.length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
                <Music2 className="w-16 h-16 text-[#b3b3b3] mb-4" />
                <h3 className="text-xl font-bold mb-2">Bạn chưa theo dõi nghệ sĩ nào</h3>
                <p className="text-[#b3b3b3] text-sm">Hãy tìm và theo dõi nghệ sĩ yêu thích của bạn.</p>
              </div>
            ) : (
              library?.followedArtists?.map((artist: any) => (
                <Link
                  key={artist.id}
                  to={`/artist/${artist.id}`}
                  className="group bg-[#181818] hover:bg-[#282828] p-4 rounded-xl transition-colors cursor-pointer"
                >
                  <div className="relative mb-4">
                    <img
                      src={artist.avatarUrl || 'https://images.unsplash.com/photo-1549834125-82d3c48159a3?auto=format&fit=crop&q=80&w=300&h=300'}
                      alt={artist.stageName}
                      className="w-full aspect-square rounded-full object-cover shadow-lg"
                    />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <p className="font-bold text-white truncate">{artist.stageName}</p>
                    {artist.isVerified && <CheckCircle2 size={14} className="text-[#1DB954] flex-shrink-0" />}
                  </div>
                  <p className="text-sm text-[#b3b3b3] mt-1">Nghệ sĩ</p>
                  <button
                    onClick={(e) => { e.preventDefault(); toggleFollow(artist.id, artist.stageName); }}
                    className="mt-3 px-4 py-1.5 rounded-full text-xs font-bold border transition-colors border-[#b3b3b3] text-[#b3b3b3] hover:border-white hover:text-white"
                  >
                    {isFollowing(artist.id) ? 'Đang theo dõi' : 'Theo dõi'}
                  </button>
                </Link>
              ))
            )}
          </div>
        )}

        {/* Tab: Album */}
        {activeTab === 'albums' && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="bg-[#181818] p-4 rounded-xl animate-pulse">
                  <div className="w-full aspect-square bg-white/10 rounded mb-4" />
                  <div className="h-4 bg-white/10 rounded w-2/3 mb-2" />
                  <div className="h-3 bg-white/10 rounded w-1/2" />
                </div>
              ))
            ) : library?.followedAlbums?.length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
                <Music2 className="w-16 h-16 text-[#b3b3b3] mb-4" />
                <h3 className="text-xl font-bold mb-2">Bạn chưa lưu album nào</h3>
                <p className="text-[#b3b3b3] text-sm">Khám phá và lưu album bạn yêu thích.</p>
              </div>
            ) : (
              library?.followedAlbums?.map((album: any) => (
                <div key={album.id} className="group bg-[#181818] hover:bg-[#282828] p-4 rounded-xl transition-colors cursor-pointer">
                  <img
                    src={album.coverUrl || 'https://images.unsplash.com/photo-1493225457124-a1a2a5f5f9af?auto=format&fit=crop&q=80&w=300&h=300'}
                    alt={album.title}
                    className="w-full aspect-square rounded shadow-lg mb-4 object-cover"
                  />
                  <p className="font-bold text-white truncate">{album.title}</p>
                  <p className="text-sm text-[#b3b3b3] mt-1 truncate">{album.artist?.stageName}</p>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
