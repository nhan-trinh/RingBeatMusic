import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { MoreHorizontal, Activity, Cpu, Database, Zap } from 'lucide-react';
import { api } from '../../lib/api';
import { usePlayerStore } from '../../stores/player.store';
import { useLibraryStore } from '../../stores/library.store';
import { SongContextMenu, useContextMenu } from '../../components/shared/SongContextMenu';
import { MediaCard } from '../../components/shared/MediaCard';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';

const formatDuration = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

export const LibraryPage = () => {
  const [activeTab, setActiveTab] = useState<'songs' | 'artists' | 'albums'>('songs');
  const { setContextAndPlay, currentTrack, isPlaying, togglePlay, currentContextId } = usePlayerStore();
  const { libraryVersion } = useLibraryStore();
  const { menu, openMenu, closeMenu } = useContextMenu();

  const { data: library, isLoading: loading } = useQuery({
    queryKey: ['library', libraryVersion],
    queryFn: async () => {
      const res = await api.get('/users/library') as any;
      return res.data;
    }
  });

  const LIBRARY_CONTEXT_ID = 'liked-songs-library';



  const handlePlayTrack = (index: number) => {
    if (!library?.likedSongs?.length) return;
    const tracks = library.likedSongs.map((s: any) => ({
      id: s.id, title: s.title, artistName: s.artistName, artistId: s.artistId,
      coverUrl: s.coverUrl, audioUrl: s.audioUrl, canvasUrl: s.canvasUrl, duration: s.duration,
    }));
    if (currentContextId === LIBRARY_CONTEXT_ID && currentTrack?.id === tracks[index].id) {
      togglePlay();
    } else {
      setContextAndPlay(tracks, index, LIBRARY_CONTEXT_ID);
    }
  };



  const TABS = [
    { key: 'songs', label: 'Liked_Archive', index: '01' },
    { key: 'artists', label: 'Architect_Profiles', index: '02' },
    { key: 'albums', label: 'Release_Units', index: '03' },
  ] as const;

  return (
    <div className="flex-1 w-full min-h-full bg-black overflow-y-auto no-scrollbar relative isolate selection:bg-[#1db954] selection:text-black">
      {/* Grain Overlay */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay z-50 bg-noise" />

      <div className="px-8 lg:px-16 pt-24 pb-32 relative z-10 w-full max-w-screen-2xl mx-auto">

        {/* ── HEADER SECTION ── */}
        <motion.header
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-16 border-b border-white/10 pb-12 flex flex-col md:flex-row md:items-end justify-between gap-8"
        >
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-[2px] bg-[#1db954]" />
              <span className="text-[10px] font-black uppercase tracking-[0.5em] text-[#1db954]">Archive_Protocol_Active</span>
            </div>
            <h1 className="text-6xl md:text-8xl font-black text-white uppercase tracking-tighter leading-[0.8] italic">
              The_Library
            </h1>
            <div className="flex items-center gap-6 opacity-30 mt-2">
              <div className="flex items-center gap-2">
                <Database size={12} />
                <span className="text-[9px] font-black uppercase tracking-widest">Library_v{libraryVersion || '4.0.1'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Activity size={12} />
                <span className="text-[9px] font-black uppercase tracking-widest">Status: Nominal</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2 text-right">
            <span className="text-[10px] font-black text-white/20 uppercase tracking-widest italic">Inventory_Count</span>
            <span className="text-4xl font-black text-white uppercase tracking-tighter italic">
              {activeTab === 'songs' ? library?.likedSongs?.length :
                activeTab === 'artists' ? library?.followedArtists?.length :
                  library?.followedAlbums?.length || 0} Units
            </span>
          </div>
        </motion.header>

        {/* ── TAB NAVIGATION ── */}
        <nav className="flex flex-wrap gap-4 mb-16 border-b border-white/5 pb-8">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "group relative px-6 py-3 transition-all duration-500 overflow-hidden border border-white/10",
                activeTab === tab.key ? "bg-white text-black border-white" : "bg-transparent text-white/40 hover:text-white hover:border-white/30"
              )}
            >
              <div className="flex items-center gap-3 relative z-10">
                <span className={cn(
                  "text-[8px] font-black italic transition-colors",
                  activeTab === tab.key ? "text-black/40" : "text-[#1db954]"
                )}>{tab.index}</span>
                <span className="text-xs font-black uppercase tracking-widest">{tab.label}</span>
              </div>
              {activeTab === tab.key && (
                <motion.div layoutId="tab-glitch" className="absolute inset-0 bg-white z-0" />
              )}
            </button>
          ))}
        </nav>

        {/* ── CONTENT AREA ── */}
        <AnimatePresence mode="wait">
          {activeTab === 'songs' && (
            <motion.div
              key="songs"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="w-full"
            >
              {loading ? (
                <div className="space-y-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="h-16 bg-white/5 border border-white/10 animate-pulse" />
                  ))}
                </div>
              ) : library?.likedSongs?.length === 0 ? (
                <div className="py-32 flex flex-col items-center justify-center border border-dashed border-white/10 opacity-30">
                  <Zap size={48} className="mb-6" />
                  <span className="text-xs font-black uppercase tracking-[0.5em]">No_Liked_Archive_Detected</span>
                </div>
              ) : (
                <div className="flex flex-col gap-1">
                  {/* Table Header */}
                  <div className="grid grid-cols-[40px_1fr_120px_60px] gap-6 px-6 py-4 border-b border-white/10 text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">
                    <span>#_Id</span>
                    <span>Sonic_Signature</span>
                    <span>Release_Origin</span>
                    <span className="text-right">Dur.</span>
                  </div>

                  {/* Song Rows */}
                  {library?.likedSongs?.map((song: any, idx: number) => {
                    const isThisPlaying = currentContextId === LIBRARY_CONTEXT_ID && currentTrack?.id === song.id && isPlaying;
                    return (
                      <motion.div
                        key={song.id}
                        onClick={() => handlePlayTrack(idx)}
                        onContextMenu={(e) => openMenu(e, {
                          id: song.id, title: song.title, artistName: song.artistName,
                          coverUrl: song.coverUrl, audioUrl: song.audioUrl, duration: song.duration,
                        })}
                        whileHover={{ x: 4 }}
                        className={cn(
                          "group grid grid-cols-[40px_1fr_120px_60px] gap-6 items-center px-6 py-4 border-b border-white/5 transition-all cursor-pointer relative overflow-hidden",
                          isThisPlaying ? "bg-[#1db954]/10" : "hover:bg-white text-white hover:text-black"
                        )}
                      >
                        <span className={cn(
                          "text-[10px] font-black italic transition-colors",
                          isThisPlaying ? "text-[#1db954]" : "text-white/20 group-hover:text-black/40"
                        )}>
                          {isThisPlaying ? <Activity size={12} className="animate-pulse" /> : (idx + 1).toString().padStart(2, '0')}
                        </span>

                        <div className="flex items-center gap-5 min-w-0">
                          <div className="w-10 h-10 border border-white/10 overflow-hidden flex-shrink-0 relative">
                            <img src={song.coverUrl} alt={song.title} className={cn("w-full h-full object-cover grayscale transition-all duration-700", !isThisPlaying && "group-hover:grayscale-0 group-hover:scale-110")} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[13px] font-black uppercase tracking-tighter truncate leading-none mb-1">
                              {song.title}
                            </p>
                            <Link
                              to={`/artist/${song.artistId}`}
                              className={cn(
                                "text-[9px] font-black uppercase tracking-widest truncate block",
                                isThisPlaying ? "text-white/60" : "text-white/20 group-hover:text-black/60 hover:underline"
                              )}
                              onClick={(e) => e.stopPropagation()}
                            >
                              {song.artistName}
                            </Link>
                          </div>
                        </div>

                        <span className={cn(
                          "text-[9px] font-black uppercase tracking-widest truncate",
                          isThisPlaying ? "text-white/40" : "text-white/20 group-hover:text-black/40"
                        )}>
                          {song.albumTitle || 'SINGLE_UNIT'}
                        </span>

                        <div className="flex items-center justify-end gap-6">
                          <span className={cn(
                            "text-[10px] font-black italic",
                            isThisPlaying ? "text-[#1db954]" : "text-white/20 group-hover:text-black/40"
                          )}>{formatDuration(song.duration)}</span>

                          <button
                            onClick={(e) => {
                              e.stopPropagation(); openMenu(e, {
                                id: song.id, title: song.title, artistName: song.artistName,
                                coverUrl: song.coverUrl, audioUrl: song.audioUrl, duration: song.duration,
                              });
                            }}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1"
                          >
                            <MoreHorizontal size={14} />
                          </button>
                        </div>

                        {/* Hover Play Background Tab */}
                        <div className="absolute right-0 top-0 bottom-0 w-1 bg-[#1db954] translate-x-full group-hover:translate-x-0 transition-transform duration-300" />
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'artists' && (
            <motion.div
              key="artists"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8"
            >
              {library?.followedArtists?.map((artist: any) => (
                <MediaCard
                  key={artist.id} id={artist.id} title={artist.stageName} subtitle="Lead_Architect"
                  coverUrl={artist.avatarUrl} isCircle={true} type="artist"
                />
              ))}
            </motion.div>
          )}

          {activeTab === 'albums' && (
            <motion.div
              key="albums"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8"
            >
              {library?.followedAlbums?.map((album: any) => (
                <MediaCard
                  key={album.id} id={album.id} title={album.title} subtitle={album.artist?.stageName || 'Primary_Source'}
                  coverUrl={album.coverUrl} type="album"
                  artistId={album.artistId || album.artist?.id}
                  artistName={album.artist?.stageName || 'Primary_Source'}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── FOOTER STATUS ── */}
        <footer className="mt-32 pt-12 border-t border-white/10 opacity-20 flex justify-between items-center">
          <div className="flex flex-col gap-1">
            <span className="text-[9px] font-black uppercase tracking-[0.4em] text-[#1db954]">Archive_Sync_Terminal</span>
            <span className="text-[7px] font-black uppercase tracking-widest text-white">RingBeat Industrial Archives // v4.0.1</span>
          </div>
          <div className="flex gap-8">
            <Zap size={14} />
            <Cpu size={14} />
          </div>
        </footer>
      </div>

      {/* Context Menu Component */}
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
    </div>
  );
};
