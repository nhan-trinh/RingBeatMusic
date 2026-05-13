import { Home, Search, Library, Plus, Heart, Music2, Loader2, Pin, PinOff, Zap, Activity, Cpu } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useLibraryStore } from '../../stores/library.store';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { api } from '../../lib/api';
import { useAuthStore } from '../../stores/auth.store';
import { PlaylistContextMenu, usePlaylistContextMenu } from '../shared/PlaylistContextMenu';
import { RenamePlaylistModal } from '../shared/RenamePlaylistModal';
import { LibraryContextMenu, SortMode } from './LibraryContextMenu';
import { usePinnedItems, PinnedItem } from '../../hooks/usePinnedItems';
import { motion } from 'framer-motion';

const asPin = (p: { id: string; title: string; coverUrl?: string | null }): PinnedItem => ({
  id: p.id, type: 'playlist', title: p.title, coverUrl: p.coverUrl,
});

// ─── Technical Indicator Component ───────────────────────────────────────────
const TechnicalIndicator = ({ label, index }: { label: string; index: string }) => (
  <div className="flex flex-col gap-1 opacity-20 group-hover:opacity-100 transition-opacity">
    <span className="text-[6px] font-black text-[#1db954]">{index}</span>
    <span className="text-[7px] font-black uppercase tracking-[0.3em]">{label}</span>
  </div>
);

export const Sidebar = ({ className }: { className?: string }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const { isHydrated, libraryVersion, playlists, createPlaylist, fetchPlaylists } = useLibraryStore();
  const [likedSongs, setLikedSongs] = useState<any[]>([]);
  const [followedArtists, setFollowedArtists] = useState<any[]>([]);
  const [creating, setCreating] = useState(false);

  const { menu, openPlaylistMenu, closePlaylistMenu } = usePlaylistContextMenu();
  const [renameModal, setRenameModal] = useState<{ isOpen: boolean; playlist: any }>({ isOpen: false, playlist: null });
  const [libraryMenu, setLibraryMenu] = useState<{ x: number; y: number } | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>('recent');
  const { pinnedItems, togglePin, isPinned } = usePinnedItems();

  const isArtist = user?.role === 'ARTIST';
  const isAdmin = user?.role === 'ADMIN';

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
  }, [isAuthenticated, isHydrated, libraryVersion]);

  const sortedPlaylists = useMemo(() => {
    const list = [...playlists];
    if (sortMode === 'name') return list.sort((a, b) => a.title.localeCompare(b.title, 'vi'));
    if (sortMode === 'oldest') return list.reverse();
    return list;
  }, [playlists, sortMode]);

  const handleCreatePlaylist = useCallback(async () => {
    setCreating(true);
    const playlist = await createPlaylist('Playlist mới');
    setCreating(false);
    if (playlist) navigate(`/playlist/${playlist.id}`);
  }, [createPlaylist, navigate]);

  const handleCreateFromLiked = useCallback(async () => {
    const playlist = await createPlaylist('Bài hát đã thích của tôi');
    if (!playlist) return;
    try {
      await Promise.all(likedSongs.map((s: any) =>
        api.post(`/playlists/${playlist.id}/songs`, { songId: s.id }).catch(() => { })
      ));
      await fetchPlaylists();
      navigate(`/playlist/${playlist.id}`);
    } catch { }
  }, [createPlaylist, fetchPlaylists, likedSongs, navigate]);

  const handleRenamePlaylist = useCallback((playlist: any) => {
    setRenameModal({ isOpen: true, playlist });
  }, []);

  const openLibraryMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setLibraryMenu({ x: e.clientX, y: e.clientY });
  }, []);

  const navItems = [
    { label: 'CORE_TERMINAL', path: '/', icon: Home, index: '01' },
    { label: 'SEARCH_ENGINE', path: '/search', icon: Search, index: '02' },
  ];

  const hasItems = likedSongs.length > 0 || followedArtists.length > 0 || playlists.length > 0;

  return (
    <nav className={twMerge('flex flex-col h-full bg-black border-r border-white/10 relative overflow-hidden group/sidebar select-none transition-all duration-700', className)}>
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay z-0 bg-noise" />

      {/* ── VERTICAL_STRIP_DECOR ── */}
      <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-[#1db954]/10 z-20 flex flex-col items-center justify-center gap-12 opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-1000">
        <div className="h-20 w-[1px] bg-[#1db954]/40" />
        <span className="[writing-mode:vertical-rl] text-[6px] font-black uppercase tracking-[1em] text-[#1db954]/40">RINGBEAT_SIGNAL_CORE</span>
        <div className="h-20 w-[1px] bg-[#1db954]/40" />
      </div>

      {/* ── NAVIGATION_CORE ── */}
      <div className="flex flex-col relative z-10 isolate">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={clsx(
                'group flex flex-col px-8 py-4 transition-all duration-500 relative border-b border-white/5 overflow-hidden',
                isActive ? 'bg-white/5' : 'hover:bg-white/[0.02]'
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={clsx(
                  "text-[7px] font-black tracking-[0.5em] transition-colors duration-500",
                  isActive ? "text-[#1db954]" : "text-white/20 group-hover:text-white/40"
                )}>
                  NODE_{item.index}
                </span>
                <TechnicalIndicator label="System_Call" index={`SC_${item.index}`} />
              </div>

              <div className="relative">
                <span className={clsx(
                  "text-xl lg:text-2xl font-black uppercase tracking-tight italic leading-none transition-all duration-700 block",
                  isActive ? "text-white scale-100 opacity-100" : "text-white/10 scale-95 opacity-40 group-hover:opacity-100 group-hover:scale-100 group-hover:text-white/60"
                )}>
                  {item.label}
                </span>

                {/* Visual Glitch Layer */}
                {isActive && (
                  <div className="absolute inset-0 text-white/5 blur-[4px] scale-105 pointer-events-none uppercase font-black italic text-xl lg:text-2xl tracking-tight -z-10 leading-none">
                    {item.label}
                  </div>
                )}
              </div>

              {isActive && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute left-0 top-0 bottom-0 w-[4px] bg-[#1db954] shadow-[0_0_20px_#1db954]"
                />
              )}
            </Link>
          );
        })}

        {(isArtist || isAdmin) && (
          <Link
            to="/artist-dashboard"
            className={clsx(
              'group flex flex-col px-8 py-4 transition-all duration-500 relative border-b border-white/5 overflow-hidden',
              location.pathname.startsWith('/artist-dashboard') ? 'bg-[#1db954]/5' : 'hover:bg-white/[0.02]'
            )}
          >
            <div className="flex items-center justify-between mb-1">
              <span className={clsx(
                "text-[7px] font-black tracking-[0.5em] transition-colors",
                location.pathname.startsWith('/artist-dashboard') ? "text-[#1db954]" : "text-white/20 group-hover:text-white/40"
              )}>
                MODULE_03
              </span>
              <div className="flex gap-2">
                <Cpu size={10} className="text-[#1db954] opacity-20 group-hover:opacity-100" />
                <Activity size={10} className="text-[#1db954] opacity-20 group-hover:opacity-100" />
              </div>
            </div>
            <span className={clsx(
              "text-lg font-black uppercase tracking-widest italic transition-all duration-500",
              location.pathname.startsWith('/artist-dashboard') ? "text-[#1db954]" : "text-white/10 group-hover:text-white/60"
            )}>
              Artist_Hub
            </span>
          </Link>
        )}
      </div>

      {/* ── MANIFEST ARCHIVE SECTION ── */}
      <div
        className="flex-1 flex flex-col overflow-hidden relative z-10"
        onContextMenu={isAuthenticated ? openLibraryMenu : undefined}
      >
        <header className="px-8 py-6 flex items-center justify-between border-b border-white/5 bg-black sticky top-0 z-20">
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-3">
              <Library size={12} className="text-[#1db954]" />
              <span className="text-[10px] font-black uppercase tracking-[0.5em] text-[#1db954]">Archive_v4.2</span>
            </div>
            <h3 className="text-[10px] font-black uppercase tracking-widest text-white opacity-40">Registry_Index</h3>
          </div>

          {isAuthenticated && (
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleCreatePlaylist(); }}
              disabled={creating}
              className="w-9 h-9 border border-white/10 flex items-center justify-center hover:bg-[#1db954] hover:text-black transition-all group/add"
            >
              {creating ? <Loader2 size={12} className="animate-spin" /> : <Plus size={14} className="group-hover/add:rotate-90 transition-transform duration-500" />}
            </button>
          )}
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-6 no-scrollbar scroll-smooth">
          {!isAuthenticated || !hasItems ? (
            <div className="p-6 border border-white/5 bg-white/[0.01] relative overflow-hidden group/init">
              <div className="absolute inset-0 opacity-[0.05] pointer-events-none bg-noise" />
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-3">
                  <Zap size={10} className="text-[#1db954]" />
                  <span className="text-[8px] font-black uppercase tracking-[0.4em] text-[#1db954]">Initial_Sequence</span>
                </div>
                <p className="font-black text-white uppercase tracking-tighter text-base leading-none mb-2 italic">Archive_Empty</p>
                <p className="text-white/20 uppercase text-[8px] tracking-[0.2em] mb-8 leading-loose">No verified data units found in local registry cache.</p>
                <button
                  onClick={handleCreatePlaylist}
                  className="w-full py-4 bg-white text-black font-black uppercase text-[10px] tracking-[0.4em] hover:bg-[#1db954] transition-all relative overflow-hidden group/btn"
                >
                  <span className="relative z-10">Init_Protocol</span>
                  <div className="absolute top-0 right-0 p-1 opacity-20"><Zap size={10} /></div>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-8">
              {/* Pinned Section */}
              {pinnedItems.length > 0 && (
                <section className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="text-[7px] font-black text-[#1db954] uppercase tracking-widest">01</span>
                    <span className="text-[9px] font-black uppercase tracking-[0.3em] text-white/20">Pinned_Clusters</span>
                    <div className="flex-1 h-[1px] bg-white/5" />
                  </div>
                  <div className="space-y-4">
                    {pinnedItems.map((item) => (
                      <div key={item.id} className="group flex items-center gap-4 relative">
                        <Link
                          to={`/playlist/${item.id}`}
                          className="flex-1 flex items-center gap-4 group/item"
                        >
                          <div className="w-11 h-11 bg-black border border-white/10 relative flex-shrink-0 overflow-hidden">
                            {item.coverUrl ? (
                              <img src={item.coverUrl} className="w-full h-full object-cover grayscale group-hover/item:grayscale-0 transition-all duration-1000 group-hover/item:scale-110" alt="" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center opacity-20"><Music2 size={14} /></div>
                            )}
                            <div className="absolute top-0 left-0 bg-[#1db954] text-black px-1 py-0.5"><Pin size={7} className="fill-current" /></div>
                          </div>
                          <div className="min-w-0">
                            <p className="text-[13px] font-black text-white uppercase tracking-tighter truncate italic group-hover/item:text-[#1db954] transition-colors">{item.title}</p>
                            <p className="text-[8px] font-black text-white/20 uppercase tracking-widest tabular-nums group-hover/item:text-white/40">SYS_ID: {item.id.slice(0, 8)}</p>
                          </div>
                        </Link>
                        <button
                          onClick={(e) => { e.preventDefault(); togglePin(item); }}
                          className="opacity-0 group-hover:opacity-100 p-2 text-white/20 hover:text-red-500 transition-all"
                        >
                          <PinOff size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Materials Section */}
              <section className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="text-[7px] font-black text-[#1db954] uppercase tracking-widest">02</span>
                  <span className="text-[9px] font-black uppercase tracking-[0.3em] text-white/20">Data_Manifests</span>
                  <div className="flex-1 h-[1px] bg-white/5" />
                </div>

                <div className="space-y-4">
                  {/* Liked Songs Special Node */}
                  {likedSongs.length > 0 && (
                    <Link to="/library" className="group flex items-center gap-4 group/liked">
                      <div className="w-11 h-11 bg-[#1db954] flex items-center justify-center flex-shrink-0 relative overflow-hidden group-hover/liked:shadow-[0_0_20px_#1db954] transition-all">
                        <Heart size={16} className="text-black fill-black relative z-10 group-hover/liked:scale-125 transition-transform duration-500" />
                        <div className="absolute inset-0 opacity-10 bg-noise" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[13px] font-black text-white uppercase tracking-tighter truncate italic group-hover/liked:text-[#1db954] transition-colors">Liked_Materials</p>
                        <p className="text-[8px] font-black text-white/20 uppercase tracking-widest group-hover/liked:text-white/40">{likedSongs.length} REGISTERED_UNITS</p>
                      </div>
                    </Link>
                  )}

                  {/* Standard Playlists */}
                  {sortedPlaylists.map((playlist) => {
                    const isItemPinned = isPinned(playlist.id);
                    return (
                      <div key={playlist.id} className="group flex items-center gap-4 relative">
                        <div
                          className="flex-1 flex items-center gap-4 cursor-pointer group/playlist"
                          onContextMenu={(e) => {
                            e.stopPropagation();
                            openPlaylistMenu(e, { ...playlist, ownerId: playlist.ownerId, isPublic: playlist.isPublic });
                          }}
                          onClick={() => navigate(`/playlist/${playlist.id}`)}
                        >
                          <div className="w-11 h-11 bg-black border border-white/10 flex-shrink-0 overflow-hidden relative">
                            {playlist.coverUrl ? (
                              <img src={playlist.coverUrl} className="w-full h-full object-cover grayscale group-hover/playlist:grayscale-0 transition-all duration-1000 group-hover/playlist:scale-110" alt="" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center opacity-20"><Music2 size={14} /></div>
                            )}
                            {isItemPinned && (
                              <div className="absolute top-0 left-0 p-1 bg-[#1db954] text-black"><Pin size={7} className="fill-current" /></div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className={clsx(
                              "text-[13px] font-black uppercase tracking-tighter truncate transition-all duration-500 italic",
                              location.pathname === `/playlist/${playlist.id}` ? "text-[#1db954] translate-x-1" : "text-white group-hover/playlist:text-[#1db954]/60"
                            )}>
                              {playlist.title}
                            </p>
                            <p className="text-[8px] font-black text-white/20 uppercase tracking-widest group-hover/playlist:text-white/40">CLUSTER_NODE</p>
                          </div>
                        </div>

                        <button
                          onClick={(e) => { e.preventDefault(); togglePin(asPin(playlist)); }}
                          className={clsx(
                            "opacity-0 group-hover:opacity-100 p-2 transition-all",
                            isItemPinned ? "text-[#1db954]" : "text-white/10 hover:text-white"
                          )}
                        >
                          {isItemPinned ? <PinOff size={12} /> : <Pin size={12} />}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </section>
            </div>
          )}
        </div>
      </div>


      {/* Context Menus & Modals */}
      {menu && <PlaylistContextMenu playlist={menu.playlist} position={menu.position} onClose={closePlaylistMenu} onRename={() => handleRenamePlaylist(menu.playlist)} />}
      {renameModal.isOpen && renameModal.playlist && <RenamePlaylistModal isOpen={renameModal.isOpen} playlistId={renameModal.playlist.id} initialTitle={renameModal.playlist.title} onClose={() => setRenameModal({ isOpen: false, playlist: null })} />}
      {libraryMenu && <LibraryContextMenu position={libraryMenu} onClose={() => setLibraryMenu(null)} onCreatePlaylist={handleCreatePlaylist} onCreateFromLiked={handleCreateFromLiked} onSort={setSortMode} currentSort={sortMode} />}
    </nav>
  );
};