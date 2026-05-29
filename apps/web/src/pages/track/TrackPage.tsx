import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { api } from '../../lib/api';
import { usePlayerStore } from '../../stores/player.store';
import { useLibraryStore } from '../../stores/library.store';
import { Heart, Mic2, Activity, Calendar, Radio, Headphones, Zap, Globe, Cpu, Shield, Share2, MoreHorizontal, Info, Terminal, Play, BadgeCheck, Pause, Database } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useInteractionTracker } from '../../hooks/useInteractionTracker';
import { SongContextMenu, useContextMenu } from '../../components/shared/SongContextMenu';

// ─── Decoration Components ──────────────────────────────────────────────────
const Crosshair = ({ className }: { className?: string }) => (
  <div className={`absolute w-4 h-4 text-[#1db954]/20 pointer-events-none ${className}`}>
    <div className="absolute top-1/2 left-0 w-full h-[1px] bg-current" />
    <div className="absolute top-0 left-1/2 w-[1px] h-full bg-current" />
  </div>
);

const TechnicalIndicator = ({ label, index }: { label: string; index: string }) => (
  <div className="flex flex-col gap-1">
    <span className="text-[6px] font-black text-[#1db954]">{index}</span>
    <span className="text-[7px] font-black uppercase tracking-[0.3em] text-white/20">{label}</span>
  </div>
);

const LedStatus = ({ active, color = "#1db954" }: { active?: boolean; color?: string }) => (
  <div className="flex items-center gap-1.5">
    <div
      className={cn(
        "w-1.5 h-1.5 rounded-full transition-all duration-300",
        active ? "shadow-[0_0_8px_rgba(29,185,84,0.8)]" : "bg-white/5 shadow-none"
      )}
      style={{ backgroundColor: active ? color : undefined }}
    />
    <span className={cn("text-[6px] font-black uppercase tracking-widest", active ? "text-white" : "text-white/10")}>
      {active ? "Active" : "Standby"}
    </span>
  </div>
);

export const TrackPage = () => {
  const { id } = useParams();
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll({ container: containerRef });

  // Parallax effects
  const watermarkX = useTransform(scrollY, [0, 1000], [0, -200]);

  const { setContextAndPlay, currentTrack, isPlaying, togglePlay } = usePlayerStore();
  const { isLiked, toggleLike } = useLibraryStore();
  const { menu: trackMenu, openMenu: openTrackMenu, closeMenu: closeTrackMenu } = useContextMenu();

  useInteractionTracker('SONG', id);

  const { data: song, isLoading: loading } = useQuery({
    queryKey: ['track', id],
    queryFn: async () => {
      const res = await api.get(`/songs/${id}`) as any;
      return res.data;
    }
  });

  const { data: topSongs } = useQuery({
    queryKey: ['top-songs-rank'],
    queryFn: async () => {
      const res = await api.get('/search?q=top-songs&limit=50') as any;
      return res.data.songs || [];
    }
  });

  if (loading) {
    return (
      <div className="flex-1 w-full min-h-full bg-black p-8 lg:p-16 flex flex-col gap-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.02] bg-[radial-gradient(#1db954_1px,transparent_1px)] [background-size:20px_20px]" />
        <div className="h-96 bg-white/5 animate-pulse border border-white/10" />
        <div className="grid grid-cols-2 gap-4">
          <div className="h-32 bg-white/5 animate-pulse border border-white/10" />
          <div className="h-32 bg-white/5 animate-pulse border border-white/10" />
        </div>
      </div>
    );
  }

  if (!song) return null;

  const songRank = topSongs ? topSongs.findIndex((s: any) => s.id === id) + 1 : 0;
  const rankDisplay = songRank > 0 ? `#${songRank.toString().padStart(3, '0')}` : '#++';

  const isCurrentPlaying = currentTrack?.id === song?.id;
  const isActivePlaying = isCurrentPlaying && isPlaying;

  const handlePlay = () => {
    if (currentTrack?.id === song.id) {
      togglePlay();
      return;
    }
    setContextAndPlay([{
      id: song.id, title: song.title, artistName: song.artist.stageName, artistId: song.artistId,
      coverUrl: song.coverUrl, audioUrl: song.audioUrl320 || song.audioUrl128,
      canvasUrl: song.canvasUrl, duration: song.duration, hasLyrics: !!song.lyrics,
    }], 0, song.id);
  };

  const formatPlayCount = (count: number) => {
    if (count >= 1000000) return (count / 1000000).toFixed(1) + 'M+';
    if (count >= 1000) return (count / 1000).toFixed(1) + 'K+';
    return count.toString();
  };

  return (
    <div
      ref={containerRef}
      className="flex-1 w-full min-h-full bg-black text-white flex flex-col relative overflow-y-auto overflow-x-hidden group/page selection:bg-[#1db954] selection:text-black no-scrollbar"
    >
      {/* Background Decor */}
      <div className="fixed inset-0 opacity-[0.02] pointer-events-none z-0 bg-[radial-gradient(#1db954_1px,transparent_1px)] [background-size:32px_32px]" />
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay z-50 bg-noise" />

      {/* Giant Background Watermark (Kinetic Parallax) */}
      <motion.div
        style={{ x: watermarkX }}
        className="fixed -left-40 bottom-1/4 select-none pointer-events-none origin-center -rotate-90 whitespace-nowrap z-0"
      >
        <span className="text-[clamp(120px,20vw,240px)] font-black text-white/[0.015] tracking-tighter uppercase leading-none italic">
          {song.title} // {song.title}
        </span>
      </motion.div>

      {/* Main layout wrapper */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 md:px-12 lg:px-16 pt-24 pb-32 flex flex-col gap-12">
        
        {/* ── SECTION 01: HERO CONTROL DECK ── */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row gap-8 lg:gap-12 items-start md:items-stretch border-b border-white/10 pb-12 w-full relative"
        >
          <Crosshair className="top-0 -left-4" />
          <Crosshair className="bottom-0 -right-4" />

          {/* Left: Cover Art (max-w-[300px]) */}
          <div className="w-full md:w-[300px] flex-shrink-0 flex flex-col justify-center relative">
            <div className="relative aspect-square border border-white/10 group/cover overflow-hidden bg-[#050505] shadow-[20px_20px_40px_rgba(0,0,0,0.6)]">
              <img
                src={song.coverUrl}
                className={cn(
                  "w-full h-full object-cover transition-all duration-[2s]",
                  isActivePlaying ? "scale-100 grayscale-0" : "scale-110 grayscale group-hover/cover:grayscale-0"
                )}
                alt=""
              />
              {/* Scanline Overlay */}
              <div className="absolute inset-0 pointer-events-none opacity-[0.05] bg-scanline" />

              {/* Mechanical Ring Decor */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-6 border border-white/5 rounded-full pointer-events-none group-hover/cover:border-[#1db954]/20 transition-colors duration-1000"
              />

              {/* Corner Accents */}
              <div className="absolute top-0 left-0 p-3 border-t-2 border-l-2 border-[#1db954]/40" />
              <div className="absolute bottom-0 right-0 p-3 border-b-2 border-r-2 border-[#1db954]/40" />

              {/* Interaction Overlay */}
              <div
                className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover/cover:opacity-100 transition-all duration-500 backdrop-blur-sm cursor-pointer"
                onClick={handlePlay}
              >
                <div className="w-16 h-16 border-2 border-white flex items-center justify-center group/playbtn">
                  {isActivePlaying ? (
                    <div className="flex gap-1 items-end h-6">
                      {[0, 1, 2].map(i => (
                        <motion.div
                          key={i}
                          animate={{ height: [8, 24, 12] }}
                          transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
                          className="w-1 bg-white"
                        />
                      ))}
                    </div>
                  ) : (
                    <Headphones size={24} className="text-white group-hover/playbtn:scale-110 transition-transform" />
                  )}
                </div>
              </div>
            </div>

            {/* Spectrum Decor */}
            <div className="h-[1px] bg-white/10 flex items-center justify-center gap-1 mt-4">
              {Array.from({ length: 30 }).map((_, i) => (
                <div key={i} className="w-[1px] h-2 bg-white/20" />
              ))}
            </div>
          </div>

          {/* Right: Info & Controls */}
          <div className="flex-1 flex flex-col justify-between py-2 min-w-0">
            {/* Header Metadata */}
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <Zap size={10} className="text-[#1db954]" />
                  <span className="text-[9px] font-black uppercase tracking-[0.4em] text-[#1db954]">Core_Signal_v4</span>
                </div>
                <span className="text-[7px] font-black text-white/20 uppercase tracking-[0.2em] italic">Registry_Point: {song.id.slice(0, 12)}</span>
              </div>
              <div className="text-3xl font-black italic text-white/10 tabular-nums">
                {rankDisplay}
              </div>
            </div>

            {/* Song Details */}
            <div className="space-y-4 my-6">
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-black uppercase leading-[0.9] tracking-tighter italic text-white break-words">
                {song.title}
              </h1>
              <div className="flex items-center gap-3">
                <span className="text-[9px] font-black text-[#1db954] uppercase tracking-[0.3em]">AUTH_NODE:</span>
                <Link to={`/artist/${song.artistId}`} className="text-lg md:text-xl font-black text-white/50 uppercase tracking-widest hover:text-[#1db954] transition-all italic underline-offset-4 decoration-2 decoration-[#1db954]/20 hover:decoration-[#1db954]">
                  {song.artist.stageName}
                </Link>
              </div>
              <p className="max-w-xl text-[9px] font-black text-white/20 uppercase tracking-[0.2em] leading-relaxed italic">
                All audio transmissions are synchronized across the global RingBeat broadcast network. Data manifest verified at {new Date(song.createdAt).getFullYear()} cycle.
              </p>
            </div>

            {/* Main Controls Console */}
            <div className="flex flex-col gap-3 border-t border-white/[0.05] pt-6">
              <div className="flex items-center justify-between px-1 mb-1">
                <div className="flex items-center gap-4">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[7px] font-black text-[#1db954] uppercase tracking-widest leading-none">Transmission_Control</span>
                    <LedStatus active={isActivePlaying} />
                  </div>
                </div>
                <div className="flex gap-2 items-center opacity-40">
                  <Terminal size={10} />
                  <span className="text-[6px] font-black uppercase tracking-[0.3em]">Core_Engine: v4.2.8</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 items-stretch">
                {/* Main Playback Button (Unit 01) */}
                <div className="flex-1 min-w-[200px] relative group/btn">
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={handlePlay}
                    className={cn(
                      "w-full h-16 flex items-center justify-center transition-all duration-500 relative overflow-hidden border border-white/5 shadow-[5px_5px_15px_rgba(0,0,0,0.3)]",
                      isActivePlaying ? "bg-white text-black border-white" : "bg-[#1db954] text-black hover:bg-white"
                    )}
                  >
                    <div className="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-black/10" />
                    <div className="absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-black/10" />
                    
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={isActivePlaying ? 'halt' : 'init'}
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        className="flex items-center gap-4 relative z-10"
                      >
                        {isActivePlaying ? (
                          <Pause size={18} className="fill-current" />
                        ) : (
                          <Play size={18} className="fill-current" />
                        )}
                        <div className="flex flex-col items-start">
                          <span className="text-sm font-black uppercase tracking-tighter italic leading-none">
                            {isActivePlaying ? "Terminate_Stream" : "Initiate_Protocol"}
                          </span>
                          <span className="text-[6px] font-black uppercase tracking-[0.2em] opacity-40 mt-0.5">PB_E_99 // ACTIVE</span>
                        </div>
                      </motion.div>
                    </AnimatePresence>

                    <motion.div
                      animate={{ x: ['-100%', '200%'] }}
                      transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                      className="absolute inset-y-0 w-20 bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none"
                    />
                  </motion.button>
                </div>

                {/* Interaction Hub (Unit 02) */}
                <div className="flex gap-4 sm:w-auto">
                  <button
                    onClick={() => toggleLike(song.id, song.title)}
                    className={cn(
                      "flex-1 sm:flex-initial sm:w-16 h-16 flex flex-col items-center justify-center gap-1 border border-white/5 transition-all hover:border-[#1db954]/40 bg-white/[0.01] group/like shadow-[5px_5px_15px_rgba(0,0,0,0.3)]",
                      isLiked(song.id) ? "bg-[#1db954]/10 text-[#1db954] border-[#1db954]/30" : "text-white/20 hover:text-white"
                    )}
                    title="Storage_Unit"
                  >
                    <Heart size={16} className={cn("transition-transform group-hover/like:scale-110", isLiked(song.id) && "fill-current")} />
                    <span className="text-[6px] font-black uppercase tracking-[0.1em]">Storage</span>
                  </button>
                  <button
                    onClick={(e) => openTrackMenu(e, { ...song, artistName: song.artist?.stageName })}
                    className="flex-1 sm:flex-initial sm:w-16 h-16 flex flex-col items-center justify-center gap-1 border border-white/5 text-white/20 hover:text-white hover:border-white/20 bg-white/[0.01] transition-all group/opt shadow-[5px_5px_15px_rgba(0,0,0,0.3)]"
                    title="Options_Set"
                  >
                    <MoreHorizontal size={16} className="transition-transform group-hover/opt:scale-110" />
                    <span className="text-[6px] font-black uppercase tracking-[0.1em]">Options</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* ── SECTION 02: TECHNICAL & CREATIVE SYSTEM ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 w-full items-start">
          
          {/* Left Column (Specs Manifest Grid - lg:col-span-7) */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            <div className="flex items-center gap-3">
              <span className="text-[7px] font-black text-[#1db954] uppercase tracking-widest px-2 py-0.5 border border-[#1db954]/20">MANIFEST_INDEX: 02</span>
              <h3 className="text-xs font-black text-white/40 uppercase tracking-widest italic">Sonic_Specification_Manifest</h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 gap-4">
              {[
                { label: 'Signal_Type', value: 'PCM_MASTER', color: 'text-[#1db954]', icon: Zap, index: '01' },
                { label: 'Unit_Length', value: `${Math.floor(song.duration / 60)}:${(song.duration % 60).toString().padStart(2, '0')}`, icon: Info, index: '02' },
                { label: 'Broadcast', value: 'DISTRIBUTE', icon: Share2, index: '03' },
                { label: 'Registry', value: `IDX_${song.id.slice(0, 4)}`, icon: Database, index: '04' },
                { label: 'Signal Quality', value: 'Lossless / 24-bit', icon: Activity, index: '05' },
                { label: 'Transmission', value: '192.0 kHz Sample', icon: Radio, index: '06' },
                { label: 'Creation Cycle', value: new Date(song.createdAt).toLocaleDateString('vi-VN'), icon: Calendar, index: '07' },
                { label: 'Spectrum Genre', value: song.genre?.name || 'Unknown', icon: Mic2, index: '08' },
              ].map((item, i) => (
                <div key={i} className="group/data relative overflow-hidden border border-white/5 bg-white/[0.01] hover:bg-white/[0.02] transition-all cursor-default shadow-[5px_5px_15px_rgba(0,0,0,0.3)] min-h-[90px] flex flex-col">
                  {/* Technical Header Strip */}
                  <div className="flex items-center justify-between p-2.5 border-b border-white/[0.03]">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[5px] font-black text-[#1db954]">{item.index}</span>
                      <span className="text-[6px] font-black text-white/20 uppercase tracking-[0.2em]">{item.label}</span>
                    </div>
                    <item.icon size={8} className="text-white/10 group-hover/data:text-[#1db954] transition-colors" />
                  </div>

                  {/* Centered Value */}
                  <div className="flex-1 flex items-center justify-center p-3">
                    <span className={cn("text-xs font-black italic tracking-tighter uppercase leading-none text-center", item.color || "text-white/80")}>
                      {item.value}
                    </span>
                  </div>

                  {/* Corner ornament */}
                  <div className="absolute bottom-0 right-0 w-1.5 h-1.5 border-r border-b border-white/10 group-hover/data:border-[#1db954]/40 transition-colors" />
                </div>
              ))}
            </div>
          </div>

          {/* Right Column (Creator Node & Verified Playbacks - lg:col-span-5) */}
          <div className="lg:col-span-5 flex flex-col gap-8">
            
            {/* Verified Playbacks Widget */}
            <div className="border border-white/5 bg-white/[0.01] p-6 shadow-[5px_5px_15px_rgba(0,0,0,0.3)] relative group/playback overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 pointer-events-none select-none text-[80px] font-black text-white/[0.01] group-hover/playback:text-white/[0.02] transition-colors leading-none italic font-mono -mt-6 -mr-4">01</div>
              
              <div className="flex justify-between items-start mb-4">
                <TechnicalIndicator label="Stream_Index" index="01" />
                <div className="flex gap-4 opacity-20 group-hover/playback:opacity-40 transition-opacity">
                  <Shield size={12} />
                  <Globe size={12} />
                  <Cpu size={12} />
                </div>
              </div>

              <div className="flex flex-col mt-2">
                <span className="text-3xl font-black text-white tabular-nums leading-none tracking-tighter drop-shadow-[0_0_10px_rgba(255,255,255,0.05)]">
                  {formatPlayCount(song.playCount || 0)}
                </span>
                <span className="text-[7px] font-black text-white/20 uppercase tracking-[0.4em] mt-1">Verified_Playbacks</span>
              </div>
              
              {/* Visual waveform simulation */}
              <div className="h-6 flex items-end gap-0.5 mt-6 opacity-30 group-hover/playback:opacity-60 transition-opacity">
                {Array.from({ length: 32 }).map((_, i) => (
                  <div 
                    key={i} 
                    className="flex-1 bg-[#1db954]" 
                    style={{ 
                      height: `${Math.max(15, Math.sin(i * 0.3) * 60 + Math.random() * 30 + 10)}%` 
                    }} 
                  />
                ))}
              </div>
            </div>

            {/* Creator Node */}
            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-3">
                <span className="text-[7px] font-black text-[#1db954] uppercase tracking-widest px-2 py-0.5 border border-[#1db954]/20">MANIFEST_INDEX: 03</span>
                <h3 className="text-xs font-black text-white/40 uppercase tracking-widest italic">Creative_Entity</h3>
              </div>

              <Link to={`/artist/${song.artistId}`} className="group/artist block relative border border-white/5 bg-black p-6 hover:bg-white/[0.01] transition-all overflow-hidden shadow-[5px_5px_15px_rgba(0,0,0,0.3)]">
                <div className="absolute right-[-10px] top-[-10px] text-[100px] font-black text-white/[0.02] italic pointer-events-none select-none">NODE</div>

                <div className="flex flex-col sm:flex-row gap-6 relative z-10">
                  <div className="w-24 h-24 sm:w-28 sm:h-28 border border-white/10 overflow-hidden flex-shrink-0 relative shadow-[10px_10px_20px_rgba(0,0,0,0.5)]">
                    <img
                      src={song.artist.avatarUrl || song.coverUrl}
                      className="w-full h-full object-cover grayscale group-hover/artist:grayscale-0 transition-all duration-[2s] group-hover/artist:scale-105"
                      alt=""
                    />
                    <div className="absolute inset-0 opacity-10 bg-noise" />
                    <div className="absolute inset-0 border border-white/5 group-hover/artist:border-[#1db954]/40 transition-colors" />
                  </div>

                  <div className="flex-1 flex flex-col justify-between py-1 min-w-0">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="text-xl font-black text-white uppercase tracking-tighter italic transition-all group-hover/artist:text-[#1db954] truncate">{song.artist.stageName}</h4>
                        <div className="w-3.5 h-3.5 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <BadgeCheck size={10} className="text-white" />
                        </div>
                      </div>
                      <p className="text-[9px] text-white/40 font-black uppercase tracking-tight leading-relaxed italic line-clamp-2">
                        {song.artist.bio || "Primary creative entity within the RingBeat network. No further telemetry available for this node."}
                      </p>
                    </div>

                    <div className="flex gap-6 mt-4 flex-wrap">
                      <div className="flex flex-col">
                        <span className="text-[6px] font-black text-white/20 uppercase tracking-widest mb-0.5">Status</span>
                        <div className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#1db954] animate-pulse" />
                          <span className="text-[8px] font-black text-white uppercase tracking-widest italic">Operational</span>
                        </div>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[6px] font-black text-white/20 uppercase tracking-widest mb-0.5">Entity_Class</span>
                        <span className="text-[8px] font-black text-white uppercase tracking-widest">Verified_Artist</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </div>

            {/* System Footer Strip */}
            <div className="pt-4 border-t border-white/5 opacity-10 mt-auto">
              <div className="flex justify-between items-center text-[6px] font-black uppercase tracking-[0.5em]">
                <span>System_Registry_Broadcast</span>
                <span>Signal_Point_STABLE_4.2.8</span>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* Industrial Overlay */}
      <div className="fixed bottom-0 left-0 right-0 p-8 flex items-center justify-between pointer-events-none z-50">
        <div className="flex items-center gap-6 pointer-events-auto opacity-20 hover:opacity-100 transition-opacity">
          <div className="w-12 h-[1px] bg-[#1db954]" />
          <span className="text-[8px] font-black text-white uppercase tracking-[0.5em]">RingBeat Signal Detected</span>
        </div>
        <span className="text-[14px] font-black text-white/5 italic">MANIFEST_TRK_v4</span>
      </div>

      {/* ── CONTEXT MENU ── */}
      {trackMenu && (
        <SongContextMenu
          song={trackMenu.song} position={trackMenu.position} onClose={closeTrackMenu}
          onPlay={() => handlePlay()}
        />
      )}
    </div>
  );
};
