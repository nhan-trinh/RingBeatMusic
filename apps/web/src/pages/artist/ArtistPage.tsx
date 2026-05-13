import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { usePlayerStore } from '../../stores/player.store';
import { useLibraryStore } from '../../stores/library.store';
import { Play, Pause, MoreHorizontal, BadgeCheck, Heart, Activity, Zap, Cpu, Globe, Shield, Radio, Share2, Layers } from 'lucide-react';
import { SongContextMenu, useContextMenu } from '../../components/shared/SongContextMenu';
import { formatTime, cn } from '../../lib/utils';
import { useInteractionTracker } from '../../hooks/useInteractionTracker';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { MediaCard } from '../../components/shared/MediaCard';

// ─── Decoration Components ──────────────────────────────────────────────────
const Crosshair = ({ className }: { className?: string }) => (
   <div className={`absolute w-4 h-4 text-[#1db954]/20 pointer-events-none ${className}`}>
      <div className="absolute top-1/2 left-0 w-full h-[1px] bg-current" />
      <div className="absolute top-0 left-1/2 w-[1px] h-full bg-current" />
   </div>
);

const TechnicalReadout = ({ label, value }: { label: string; value: string | number }) => (
   <div className="flex flex-col gap-1">
      <span className="text-[7px] font-black text-white/20 uppercase tracking-[0.4em]">{label}</span>
      <span className="text-sm font-black italic tracking-tighter text-white uppercase">{value}</span>
   </div>
);

export const ArtistPage = () => {
   const { id } = useParams();
   const containerRef = useRef<HTMLDivElement>(null);
   const { scrollY } = useScroll({ container: containerRef });

   // Parallax effects
   const watermarkX = useTransform(scrollY, [0, 1000], [0, -200]);
   const heroOpacity = useTransform(scrollY, [0, 400], [1, 0]);
   const heroScale = useTransform(scrollY, [0, 400], [1, 0.95]);

   const { data: artist, isLoading: loading } = useQuery({
      queryKey: ['artist', id],
      queryFn: async () => {
         const res = await api.get(`/artists/${id}`) as any;
         return res.data;
      },
      enabled: !!id,
   });

   const { setContextAndPlay, currentContextId, currentTrack, isPlaying, togglePlay } = usePlayerStore();
   const { isFollowing, toggleFollow, isLiked, toggleLike } = useLibraryStore();
   const { menu: trackMenu, openMenu: openTrackMenu, closeMenu: closeTrackMenu } = useContextMenu();

   useInteractionTracker('ARTIST', id);

   if (loading) {
      return (
         <div className="flex-1 w-full min-h-full bg-black p-8 lg:p-16 flex flex-col gap-12 relative overflow-hidden">
            <div className="absolute inset-0 opacity-[0.02] bg-[radial-gradient(#1db954_1px,transparent_1px)] [background-size:20px_20px]" />
            <div className="h-64 bg-white/5 animate-pulse border border-white/10" />
            <div className="space-y-4">
               {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="h-16 bg-white/5 border border-white/10 animate-pulse" />
               ))}
            </div>
         </div>
      );
   }

   if (!artist) {
      return <div className="p-32 text-center font-black uppercase tracking-[0.5em] text-white/20 italic">Architect_Profile_Lost // 404_NULL</div>;
   }

   const isThisPlaying = currentContextId === id && isPlaying;
   const trackList = artist.songs.map((item: any) => ({
      id: item.song.id, title: item.song.title, artistName: item.song.artist.stageName, artistId: item.song.artistId,
      coverUrl: item.song.coverUrl, audioUrl: item.song.audioUrl320 || item.song.audioUrl128,
      canvasUrl: item.song.canvasUrl, duration: item.song.duration, hasLyrics: !!item.song.lyrics,
   }));

   const handleMainPlay = () => {
      if (trackList.length === 0) return;
      if (currentContextId === id) {
         togglePlay();
      } else {
         setContextAndPlay(trackList, 0, id);
      }
   };

   const handleTrackPlay = (index: number) => {
      if (currentContextId === id && currentTrack?.id === trackList[index].id) {
         togglePlay();
      } else {
         setContextAndPlay(trackList, index, id);
      }
   };

   return (
      <div
         ref={containerRef}
         className="flex-1 w-full h-full bg-black overflow-y-auto no-scrollbar relative isolate selection:bg-[#1db954] selection:text-black text-white group/page"
      >

         {/* ── BACKGROUND LAYER ── */}
         <div className="fixed inset-0 opacity-[0.02] pointer-events-none z-0 bg-[radial-gradient(#1db954_1px,transparent_1px)] [background-size:32px_32px]" />
         <div className="fixed inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay z-50 bg-noise" />

         {/* Giant Background Label (Editorial Watermark with Parallax) */}
         <motion.div
            style={{ x: watermarkX }}
            className="fixed -left-40 bottom-0 select-none pointer-events-none origin-center -rotate-90 whitespace-nowrap z-0"
         >
            <span className="text-[clamp(100px,15vw,200px)] font-black text-white/[0.015] tracking-tighter uppercase leading-none italic">
               {artist.stageName} // {artist.stageName}
            </span>
         </motion.div>

         <div className="px-6 lg:px-12 pt-8 pb-32 relative z-10 w-full mx-auto">

            {/* ── TECHNICAL STRIP ── */}
            <div className="flex items-center justify-between py-4 border-b border-white/10 mb-12 opacity-40 hover:opacity-100 transition-opacity">
               <div className="flex gap-10">
                  <span className="text-[7px] font-black uppercase tracking-[0.5em]">System_Registry: {artist.id.slice(0, 12)}</span>
                  <span className="text-[7px] font-black uppercase tracking-[0.5em] hidden md:block">Module: ARCHITECT_V4.2</span>
               </div>
               <div className="flex gap-4">
                  <Shield size={12} className="text-[#1db954]" />
                  <Globe size={12} />
               </div>
            </div>

            {/* ── KINETIC HERO SECTION ── */}
            <motion.section
               style={{ opacity: heroOpacity, scale: heroScale }}
               className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-12 lg:gap-16 items-start mb-24 relative"
            >
               <Crosshair className="-top-4 -left-4" />

               {/* Primary Identity: Avatar & Mechanical Visuals */}
               <div className="w-full flex flex-col gap-8 relative">
                  <div className="relative group/avatar border border-white/10 aspect-square overflow-hidden bg-[#050505] shadow-[20px_20px_60px_rgba(0,0,0,0.5)]">
                     <motion.img
                        initial={{ scale: 1.2, filter: 'grayscale(1)' }}
                        animate={{ scale: 1, filter: 'grayscale(1)' }}
                        whileHover={{ scale: 1.05, filter: 'grayscale(0)' }}
                        transition={{ duration: 1.5 }}
                        src={artist.avatarUrl}
                        alt={artist.stageName}
                        className="w-full h-full object-cover"
                     />

                     {/* Decorative Technical Ring */}
                     <div className="absolute inset-4 border border-white/5 rounded-full pointer-events-none group-hover/avatar:border-[#1db954]/20 transition-colors duration-1000" />
                     <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                        className="absolute inset-0 border-t border-[#1db954]/10 rounded-full pointer-events-none"
                     />

                     {/* Scanline & Noise Overlay */}
                     <div className="absolute inset-0 opacity-[0.05] pointer-events-none bg-scanline" />

                     {artist.isVerified && (
                        <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1 bg-black/80 border border-[#1db954]/40 backdrop-blur-md z-20">
                           <BadgeCheck size={12} className="text-[#1db954]" />
                           <span className="text-[7px] font-black uppercase tracking-widest text-[#1db954]">Verified_Architect</span>
                        </div>
                     )}

                     {/* Vertical Identity Tab */}
                     <div className="absolute top-0 right-0 bottom-0 w-6 bg-black/80 border-l border-white/10 flex items-center justify-center pointer-events-none">
                        <span className="[writing-mode:vertical-rl] text-[6px] font-black uppercase tracking-[0.5em] text-white/20 italic">REG_UNIT_042</span>
                     </div>
                  </div>

                  {/* Identity Dashboard (Grid) */}
                  <div className="grid grid-cols-2 gap-px bg-white/5 border border-white/5">
                     {[
                        { label: "Signal_Followers", value: artist.followersCount?.toLocaleString() },
                        { label: "Manifest_Size", value: `${artist.songs.length} Units` },
                        { label: "Stream_Status", value: "Nominal" },
                        { label: "Entity_Point", value: artist.id.slice(0, 6) }
                     ].map((stat, i) => (
                        <div key={i} className="p-4 bg-black hover:bg-white/[0.02] transition-all relative group/stat overflow-hidden">
                           <TechnicalReadout label={stat.label} value={stat.value || 'N/A'} />
                           <div className="absolute bottom-0 left-0 w-0 h-[1.5px] bg-[#1db954] group-hover/stat:w-full transition-all duration-500" />
                        </div>
                     ))}
                  </div>
               </div>

               {/* Secondary Identity: Editorial Typography & Actions */}
               <div className="flex flex-col justify-between self-stretch pt-2 min-w-0">
                  <div className="space-y-8">
                     <div className="relative">
                        <h1 className="text-6xl md:text-8xl lg:text-9xl font-black uppercase tracking-tighter leading-[0.75] italic text-white transition-all duration-1000 selection:bg-white selection:text-black">
                           {artist.stageName}
                        </h1>
                        <div className="absolute -top-10 -left-2 text-[8px] font-black text-[#1db954] uppercase tracking-[0.6em] opacity-40">Architect_Profile</div>
                     </div>

                     <div className="max-w-xl relative">
                        <p className="text-[11px] md:text-[12px] font-black uppercase tracking-widest leading-relaxed text-white/30 italic border-l-4 border-[#1db954] pl-8 py-3 bg-white/[0.01]">
                           {artist.bio || "This creative entity operates within the rhythmic spectrum of the modern RingBeat network. No further telemetry available for this node at this time."}
                        </p>
                        <Crosshair className="-bottom-4 -right-4" />
                     </div>
                  </div>

                  {/* Action Hub - High Contrast */}
                  <div className="flex flex-wrap items-center gap-5 mt-12 lg:mt-0">
                     <motion.button
                        whileTap={{ scale: 0.96, x: [-2, 2, -2, 2, 0] }}
                        onClick={handleMainPlay}
                        disabled={trackList.length === 0}
                        className="group relative flex items-center gap-6 px-10 py-5 bg-[#1db954] text-black transition-all hover:bg-white disabled:opacity-20 shadow-[12px_12px_0px_rgba(29,185,84,0.05)] active:shadow-none active:translate-x-1 active:translate-y-1"
                     >
                        <AnimatePresence mode="wait">
                           <motion.div
                              key={isThisPlaying ? 'pause' : 'play'}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              className="flex items-center gap-4"
                           >
                              {isThisPlaying ? <Pause size={24} className="fill-current" /> : <Play size={24} className="fill-current" />}
                              <span className="text-[12px] font-black uppercase tracking-[0.4em] italic">{isThisPlaying ? "Halt_Stream" : "Init_Protocol"}</span>
                           </motion.div>
                        </AnimatePresence>

                     </motion.button>

                     <button
                        onClick={() => id && toggleFollow(id, artist.stageName)}
                        className={cn(
                           "px-10 py-7 border-2 transition-all duration-500 text-[11px] font-black uppercase tracking-[0.4em] relative overflow-hidden group/follow",
                           isFollowing(id || '') ? "bg-white text-black border-white" : "border-white/10 text-white hover:border-white"
                        )}
                     >
                        <span className="relative z-10">{isFollowing(id || '') ? 'Following_Architect' : 'Initialize_Follow'}</span>
                        {!isFollowing(id || '') && <div className="absolute inset-0 bg-white/5 translate-x-full group-hover/follow:translate-x-0 transition-transform duration-500" />}
                     </button>

                     <div className="flex gap-4">
                        <button className="p-7 border border-white/5 text-white/20 hover:text-[#1db954] hover:border-[#1db954]/20 transition-all">
                           <Share2 size={20} />
                        </button>
                        <button className="p-7 border border-white/5 text-white/20 hover:text-white transition-all">
                           <MoreHorizontal size={20} />
                        </button>
                     </div>
                  </div>
               </div>
            </motion.section>

            {/* ── TRANSMISSION MANIFEST (Tracklist) ── */}
            <section className="relative mt-24">
               <div className="flex items-center justify-between mb-16 border-b border-white/10 pb-8 relative">
                  <div className="flex flex-col gap-3">
                     <div className="flex items-center gap-3">
                        <span className="text-[9px] font-black text-[#1db954] uppercase tracking-widest px-3 py-1 border border-[#1db954]/20">ARCHIVE_MANIFEST_01</span>
                        <div className="w-16 h-[1px] bg-white/10" />
                     </div>
                     <h2 className="text-5xl md:text-6xl font-black text-white uppercase tracking-tighter italic leading-none">Popular_Transmissions</h2>
                  </div>
                  <div className="flex items-center gap-6 opacity-20">
                     <Activity size={24} className="text-[#1db954]" />
                     <Layers size={24} />
                  </div>
               </div>

               <div className="flex flex-col gap-px ">
                  {artist.songs.map((item: any, index: number) => {
                     const track = item.song;
                     const isRowPlaying = currentContextId === id && currentTrack?.id === track.id;

                     return (
                        <motion.div
                           key={item.songId}
                           onClick={() => handleTrackPlay(index)}
                           onContextMenu={(e) => openTrackMenu(e, { ...track, artistName: artist.stageName })}
                           initial={{ opacity: 0, y: 20 }}
                           whileInView={{ opacity: 1, y: 0 }}
                           viewport={{ once: true }}
                           transition={{ delay: index * 0.05 }}
                           whileHover={{ x: 12, backgroundColor: 'rgba(255, 255, 255, 0.02)' }}
                           className={cn(
                              "group grid grid-cols-[60px_1fr_200px_120px] gap-8 items-center px-8 py-6 bg-black transition-all cursor-pointer relative overflow-hidden border-b border-white/5",
                              isRowPlaying && "bg-white/[0.04]"
                           )}
                        >
                           {/* Index / Status */}
                           <div className="flex items-center justify-center relative">
                              {isRowPlaying ? (
                                 <div className="flex gap-1.5 items-end h-5">
                                    {[0, 1, 2].map(i => (
                                       <motion.div
                                          key={i}
                                          animate={{ height: [6, 20, 10] }}
                                          transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
                                          className="w-[3px] bg-[#1db954]"
                                       />
                                    ))}
                                 </div>
                              ) : (
                                 <>
                                    <span className="text-[14px] font-black italic text-white/10 group-hover:text-[#1db954] transition-colors">{(index + 1).toString().padStart(2, '0')}</span>
                                    <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-1 h-0 bg-[#1db954] group-hover:h-8 transition-all duration-300" />
                                 </>
                              )}
                           </div>

                           {/* Metadata & Title */}
                           <div className="flex items-center gap-10 min-w-0">
                              <div className="w-14 h-14 border border-white/10 overflow-hidden relative flex-shrink-0 bg-[#050505]">
                                 <img src={track.coverUrl} className={cn("w-full h-full object-cover transition-all duration-[1s]", isRowPlaying ? "grayscale-0" : "grayscale group-hover:grayscale-0 group-hover:scale-110")} />
                                 <div className="absolute inset-0 opacity-10 bg-noise pointer-events-none" />
                              </div>
                              <div className="min-w-0 flex flex-col gap-2">
                                 <p className={cn(
                                    "text-[18px] font-black uppercase tracking-tighter truncate transition-colors leading-none",
                                    isRowPlaying ? "text-[#1db954]" : "text-white group-hover:text-[#1db954]"
                                 )}>
                                    {track.title}
                                 </p>
                                 <div className="flex items-center gap-4">
                                    <span className="text-[8px] font-black uppercase tracking-[0.4em] text-white/10">SIG_DATA: {track.id.slice(0, 8)}</span>
                                    <div className="w-10 h-[1px] bg-white/5" />
                                    <span className="text-[8px] font-black uppercase tracking-[0.4em] text-[#1db954]/40">Active_Signal</span>
                                 </div>
                              </div>
                           </div>

                           {/* Playback Stats */}
                           <div className="hidden md:flex flex-col gap-1.5 border-l border-white/5 pl-8">
                              <span className="text-[8px] font-black text-white/10 uppercase tracking-widest">Transmission_Units</span>
                              <span className="text-[12px] font-black text-white/30 group-hover:text-white transition-colors tabular-nums tracking-tighter">{track.playCount.toLocaleString()}</span>
                           </div>

                           {/* Actions & Time */}
                           <div className="flex items-center justify-end gap-10">
                              <button
                                 onClick={(e) => { e.stopPropagation(); toggleLike(track.id, track.title); }}
                                 className={cn(
                                    "transition-all hover:scale-125",
                                    isLiked(track.id) ? "text-[#1db954]" : "text-white/10 hover:text-white"
                                 )}
                              >
                                 <Heart size={18} className={isLiked(track.id) ? "fill-current" : ""} />
                              </button>
                              <span className="text-[12px] font-black italic text-white/20 group-hover:text-white tabular-nums">{formatTime(track.duration)}</span>
                           </div>

                           {/* Selection Indicator */}
                           {isRowPlaying && <div className="absolute right-0 top-0 bottom-0 w-1.5 bg-[#1db954] shadow-[0_0_20px_#1db954]" />}
                        </motion.div>
                     );
                  })}
               </div>
            </section>

            {/* ── DISCOGRAPHY SECTION (Albums) ── */}
            {artist.albums && artist.albums.length > 0 && (
               <section className="relative mt-32">
                  <div className="flex items-center justify-between mb-16 border-b border-white/10 pb-8 relative">
                     <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-3">
                           <span className="text-[9px] font-black text-[#1db954] uppercase tracking-widest px-3 py-1 border border-[#1db954]/20">COLLECTION_MANIFEST_02</span>
                           <div className="w-16 h-[1px] bg-white/10" />
                        </div>
                        <h2 className="text-5xl md:text-6xl font-black text-white uppercase tracking-tighter italic leading-none">Studio_Records</h2>
                     </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-8">
                     {artist.albums.map((album: any) => (
                        <MediaCard
                           key={album.id}
                           id={album.id}
                           title={album.title}
                           subtitle={`ALBUM // ${new Date(album.releaseDate).getFullYear()}`}
                           coverUrl={album.coverUrl}
                           type="album"
                        />
                     ))}
                  </div>
               </section>
            )}

            {/* ── SYSTEM STATUS FOOTER ── */}
            <footer className="mt-48 pt-16 border-t-2 border-white/10 opacity-20 relative overflow-hidden group/footer">
               <Crosshair className="-top-2 -left-2 scale-75" />
               <div className="flex flex-col md:flex-row justify-between items-end gap-12">
                  <div className="space-y-6">
                     <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-4">
                           <span className="text-[12px] font-black text-[#1db954] uppercase tracking-[0.6em]">RingBeat_Architect_Archive</span>
                           <div className="h-[1px] w-24 bg-[#1db954]/20 group-hover/footer:w-48 transition-all duration-1000" />
                        </div>
                        <p className="text-[8px] font-black uppercase tracking-widest text-white/40 max-w-md leading-loose italic">
                           All artist metadata and audio transmissions are encrypted and verified via the global RingBeat node network. Data manifest integrity verified at source. Version 4.2.8 Stable.
                        </p>
                     </div>
                     <div className="flex gap-10">
                        <div className="flex flex-col gap-1">
                           <span className="text-[6px] font-black text-white/20 uppercase tracking-widest">Network_Core</span>
                           <Zap size={16} className="text-[#1db954]" />
                        </div>
                        <div className="flex flex-col gap-1">
                           <span className="text-[6px] font-black text-white/20 uppercase tracking-widest">Registry_Module</span>
                           <Cpu size={16} />
                        </div>
                        <div className="flex flex-col gap-1">
                           <span className="text-[6px] font-black text-white/20 uppercase tracking-widest">Signal_Broadcaster</span>
                           <Radio size={16} />
                        </div>
                     </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                     <div className="text-[24px] font-black text-white/5 italic select-none">SYSTEM_ARTIST_MANIFEST</div>
                     <div className="text-[8px] font-black text-white/10 uppercase tracking-widest">Registry_ID: {artist.id.toUpperCase()}</div>
                  </div>
               </div>
            </footer>
         </div>

         {/* ── CONTEXT MENU ── */}
         {trackMenu && (
            <SongContextMenu
               song={trackMenu.song} position={trackMenu.position} onClose={closeTrackMenu}
               onPlay={() => {
                  const idx = artist.songs.findIndex((s: any) => s.song.id === trackMenu.song.id);
                  if (idx !== -1) handleTrackPlay(idx);
               }}
            />
         )}
      </div>
   );
};
