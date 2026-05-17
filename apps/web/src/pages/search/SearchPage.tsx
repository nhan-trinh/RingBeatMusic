import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '../../lib/api';
import { MediaCard } from '../../components/shared/MediaCard';
import { SearchFilterChips } from '../../components/search/SearchFilterChips';
import { TopResultCard } from '../../components/search/TopResultCard';
import { Play, Search as SearchIcon, Zap, Cpu, Database } from 'lucide-react';
import { usePlayerStore } from '../../stores/player.store';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';
import { SongContextMenu, useContextMenu } from '../../components/shared/SongContextMenu';

const BROWSE_CATEGORIES = [
  { id: '01', name: 'Podcasts_Archive', color: 'border-white/20' },
  { id: '02', name: 'Personal_Feed', color: 'border-[#1db954]/40' },
  { id: '03', name: 'Fresh_Units', color: 'border-white/20' },
  { id: '04', name: 'Vietnamese_Signal', color: 'border-white/20' },
  { id: '05', name: 'Pop_Manifest', color: 'border-[#1db954]/40' },
  { id: '06', name: 'Chill_Signals', color: 'border-white/20' },
  { id: '07', name: 'Industrial_HipHop', color: 'border-white/20' },
  { id: '08', name: 'Vocal_Architecture', color: 'border-[#1db954]/40' },
];

export const SearchPage = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q');
  const [activeTab, setActiveTab] = useState('all');
  const { setContextAndPlay } = usePlayerStore();
  const { menu: trackMenu, openMenu: openTrackMenu, closeMenu: closeTrackMenu } = useContextMenu();

  const { data: results, isLoading: loading } = useQuery({
    queryKey: ['search', query],
    queryFn: async () => {
      const res = await api.get(`/search?q=${encodeURIComponent(query!)}`) as any;
      return res.data;
    },
    enabled: !!query,
  });

  if (!query) {
    return (
      <div className="flex-1 w-full min-h-full bg-black overflow-y-auto no-scrollbar relative isolate selection:bg-[#1db954] selection:text-black text-white">
        {/* Grain Overlay */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay z-50 bg-noise" />

        <div className="px-8 lg:px-16 pt-24 pb-32 relative z-10 w-full max-w-screen-2xl mx-auto">
          <motion.header
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-16 flex flex-col gap-4 border-b border-white/10 pb-12"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-[2px] bg-[#1db954]" />
              <span className="text-[10px] font-black uppercase tracking-[0.5em] text-[#1db954]">Query_Manifest_V4</span>
            </div>
            <h1 className="text-6xl md:text-7xl font-black text-white uppercase tracking-tighter leading-[0.8] italic">
              Discovery_Console
            </h1>
          </motion.header>

          <h2 className="text-[10px] font-black uppercase tracking-[0.5em] text-white/30 mb-8 flex items-center gap-4">
            Explore_All_Categories
            <div className="h-[1px] flex-1 bg-white/5" />
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-4">
            {BROWSE_CATEGORIES.map((cat) => (
              <motion.div
                key={cat.id}
                whileHover={{ scale: 0.98, backgroundColor: '#fff', color: '#000' }}
                className={cn(
                  "relative overflow-hidden aspect-[16/9] p-6 cursor-pointer border transition-all duration-500 group bg-[#050505]",
                  cat.color
                )}
              >
                <div className="flex flex-col h-full justify-between relative z-10">
                  <span className="text-[8px] font-black italic text-[#1db954] group-hover:text-black transition-colors">{cat.id}</span>
                  <span className="text-lg md:text-xl font-black uppercase tracking-tighter italic leading-none">{cat.name}</span>
                </div>
                {/* Tech noise background */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-5 pointer-events-none bg-noise" />
              </motion.div>
            ))}
          </div>

          {/* FOOTER STATUS */}
          <footer className="mt-32 pt-12 border-t border-white/10 opacity-20 flex justify-between items-center">
            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-black uppercase tracking-[0.4em] text-[#1db954]">Search_Index_Active</span>
              <span className="text-[7px] font-black uppercase tracking-widest text-white">RingBeat Industrial Discovery // v4.0.1</span>
            </div>
            <div className="flex gap-8">
              <Database size={14} />
              <Zap size={14} />
            </div>
          </footer>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex-1 w-full min-h-full bg-black p-8 lg:p-16 flex flex-col gap-12">
        <div className="h-24 bg-white/5 animate-pulse border border-white/10" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5 h-64 bg-white/5 animate-pulse border border-white/10" />
          <div className="lg:col-span-7 space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-16 bg-white/5 border border-white/10 animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const hasResults = results?.songs?.length > 0 || results?.artists?.length > 0 || results?.albums?.length > 0 || results?.users?.length > 0;

  if (!hasResults) {
    return (
      <div className="flex-1 w-full min-h-full bg-black flex items-center justify-center p-8">
        <div className="text-center">
          <SearchIcon size={48} className="text-white/10 mb-6 mx-auto" />
          <h2 className="text-2xl font-black uppercase tracking-widest italic text-white/40">No_Matches_Found_For: {query}</h2>
          <p className="text-[9px] font-black uppercase tracking-widest text-white/20 mt-2 italic">Refine_Query_Signal</p>
        </div>
      </div>
    );
  }

  const topSongs = results.songs?.slice(0, 4) || [];

  return (
    <div className="flex-1 w-full min-h-full bg-black overflow-y-auto no-scrollbar relative isolate selection:bg-[#1db954] selection:text-black text-white">
      {/* Grain Overlay */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay z-50 bg-noise" />

      <div className="px-8 lg:px-16 pt-24 pb-32 relative z-10 w-full max-w-screen-2xl mx-auto">
        <div className="mb-24 border-b border-white/10 pb-16 flex flex-col gap-12">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-12"
          >
            <div>
              <h1 className="text-7xl md:text-8xl font-black uppercase tracking-tighter italic leading-[0.8] mb-6">Search_Manifest</h1>
              <div className="flex items-center gap-4">
                <div className="h-[2px] w-16 bg-[#1db954]" />
                <p className="text-[11px] font-black uppercase tracking-[0.4em] text-white/30 italic">Query_Origin: "{query}"</p>
              </div>
            </div>

            <div className="flex flex-col gap-6">
              <SearchFilterChips activeTab={activeTab} onTabChange={setActiveTab} />

              <div className="flex items-center gap-2 opacity-10">
                <span className="text-[8px] font-black uppercase tracking-[0.3em]">Filtering_Protocol_Active</span>
                <Database size={10} />
              </div>
            </div>
          </motion.div>
        </div>

        <div className="flex flex-col gap-20">
          {/* TOP RESULT & SONGS */}
          {activeTab === 'all' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              {/* Left Column: Top Result */}
              <div className="lg:col-span-5 flex flex-col gap-6">
                <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-[#1db954] flex items-center gap-3">
                  Primary_Source_Identified
                  <div className="h-[1px] flex-1 bg-[#1db954]/20" />
                </h2>
                {results.topResult && <TopResultCard result={results.topResult} />}
              </div>

              {/* Right Column: Featured Songs */}
              <div className="lg:col-span-7 flex flex-col gap-6">
                <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30 flex items-center gap-3">
                  Transmission_Units
                  <div className="h-[1px] flex-1 bg-white/5" />
                </h2>
                <div className="flex flex-col gap-1">
                  {topSongs.map((song: any, idx: number) => (
                    <motion.div
                      key={song.id}
                      onClick={() => setContextAndPlay([{
                        id: song.id, title: song.title, artistName: song.artistName, artistId: song.artistId,
                        coverUrl: song.coverUrl, audioUrl: song.audioUrl, canvasUrl: song.canvasUrl,
                        duration: song.duration, hasLyrics: song.hasLyrics,
                      }], 0, song.id)}
                      onContextMenu={(e) => { e.preventDefault(); openTrackMenu(e, song); }}
                      whileHover={{ x: 4 }}
                      className="group flex items-center gap-6 p-4 border-b border-white/5 hover:bg-white transition-all cursor-pointer relative overflow-hidden"
                    >
                      <div className="text-[10px] font-black italic text-white/20 group-hover:text-black/40 w-6">0{idx + 1}</div>
                      <div className="relative w-12 h-12 border border-white/10 overflow-hidden flex-shrink-0">
                        <img src={song.coverUrl} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" alt={song.title} />
                        <div className="absolute inset-0 flex items-center justify-center bg-[#1db954] opacity-0 group-hover:opacity-100 transition-opacity">
                          <Play size={16} className="fill-black text-black" />
                        </div>
                      </div>
                      <div className="flex-1 flex flex-col min-w-0">
                        <span className="text-[13px] font-black uppercase tracking-tighter truncate leading-none mb-1 group-hover:text-black">{song.title}</span>
                        <span className="text-[9px] font-black uppercase tracking-widest text-white/30 group-hover:text-black/60">{song.artistName}</span>
                      </div>
                      <span className="text-[10px] font-black italic text-white/20 group-hover:text-black/40">
                        {Math.floor(song.duration / 60)}:{(song.duration % 60).toString().padStart(2, '0')}
                      </span>
                      {/* Hover Progress Tab */}
                      <div className="absolute right-0 top-0 bottom-0 w-1 bg-[#1db954] translate-x-full group-hover:translate-x-0 transition-transform duration-300" />
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* GRID RESULTS */}
          {(activeTab === 'all' || activeTab === 'artists') && results.artists?.length > 0 && (
            <section>
              <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30 mb-8 flex items-center gap-4">
                Architect_Profiles_Located
                <div className="h-[1px] flex-1 bg-white/5" />
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
                {results.artists.map((artist: any) => (
                  <MediaCard
                    key={artist.id} id={artist.id} title={artist.stageName} subtitle="Architect"
                    coverUrl={artist.avatarUrl} isCircle={true} type="artist"
                  />
                ))}
              </div>
            </section>
          )}

          {(activeTab === 'all' || activeTab === 'albums') && results.albums?.length > 0 && (
            <section>
              <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30 mb-8 flex items-center gap-4">
                Discography_Units_Located
                <div className="h-[1px] flex-1 bg-white/5" />
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
                {results.albums.map((album: any) => (
                  <MediaCard
                    key={album.id} id={album.id} title={album.title} subtitle={album.artistName}
                    coverUrl={album.coverUrl} type="album" artistId={album.artistId} artistName={album.artistName}
                  />
                ))}
              </div>
            </section>
          )}

          {(activeTab === 'all' || activeTab === 'playlists') && results.playlists?.length > 0 && (
            <section>
              <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30 mb-8 flex items-center gap-4">
                Archive_Sets_Located
                <div className="h-[1px] flex-1 bg-white/5" />
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
                {results.playlists.map((playlist: any) => (
                  <MediaCard
                    key={playlist.id} id={playlist.id} title={playlist.title} subtitle={playlist.description || "MANIFEST_SET"}
                    coverUrl={playlist.coverUrl} type="playlist" ownerId={playlist.ownerId}
                  />
                ))}
              </div>
            </section>
          )}

          {(activeTab === 'all' || activeTab === 'profiles') && results.users?.length > 0 && (
            <section>
              <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30 mb-8 flex items-center gap-4">
                User_Entities_Located
                <div className="h-[1px] flex-1 bg-white/5" />
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
                {results.users.map((user: any) => (
                  <MediaCard
                    key={user.id} id={user.id} title={user.name} subtitle="Entity"
                    coverUrl={user.avatarUrl} isCircle={true} type="profile"
                  />
                ))}
              </div>
            </section>
          )}

          {activeTab === 'songs' && results.songs?.length > 0 && (
            <section>
              <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30 mb-8 flex items-center gap-4">
                Individual_Transmission_Signals
                <div className="h-[1px] flex-1 bg-white/5" />
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
                {results.songs.map((song: any) => (
                  <MediaCard
                    key={song.id} id={song.id} title={song.title} subtitle={song.artistName}
                    coverUrl={song.coverUrl} type="song"
                    songs={[{
                      id: song.id, title: song.title, artistName: song.artistName, artistId: song.artistId,
                      coverUrl: song.coverUrl, audioUrl: song.audioUrl, canvasUrl: song.canvasUrl,
                      duration: song.duration, hasLyrics: song.hasLyrics,
                    }]}
                  />
                ))}
              </div>
            </section>
          )}
        </div>

        {/* FOOTER STATUS */}
        <footer className="mt-40 pt-12 border-t border-white/10 opacity-20 flex justify-between items-center">
          <div className="flex flex-col gap-1">
            <span className="text-[9px] font-black uppercase tracking-[0.4em] text-[#1db954]">Search_Operation_Completed</span>
            <span className="text-[7px] font-black uppercase tracking-widest text-white">RingBeat Data Discovery Terminal // Signal: Strong</span>
          </div>
          <div className="flex gap-8">
            <Cpu size={14} />
            <Zap size={14} />
          </div>
        </footer>
      </div>

      {/* ── CONTEXT MENU ── */}
      {trackMenu && (
        <SongContextMenu 
          song={trackMenu.song} position={trackMenu.position} onClose={closeTrackMenu}
        />
      )}
    </div>
  );
};
