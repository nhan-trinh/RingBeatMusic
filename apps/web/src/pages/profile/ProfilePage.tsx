import { memo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/auth.store';
import { api } from '../../lib/api';
import { User as UserIcon, AlertTriangle, Share2, Activity, Cpu, Zap, Database, Fingerprint } from 'lucide-react';
import { Skeleton } from '../../components/ui/Skeleton';
import { MediaCard } from '../../components/shared/MediaCard';
import { useUIStore } from '../../stores/ui.store';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export const ProfilePage = () => {
  const { id } = useParams();
  const { user: currentUser } = useAuthStore();
  const { openReportModal } = useUIStore();
  const queryClient = useQueryClient();
  const [isMutating, setIsMutating] = useState(false);

  const isOwnProfile = !id || id === currentUser?.id;
  const targetId = id || currentUser?.id;

  // 🛡️ IMPLEMENTING CACHING: 5 minutes staleTime for Profile
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['user-profile', targetId],
    queryFn: async () => {
      const res = await api.get(`/users/${targetId}`) as any;
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    enabled: !!targetId,
  });

  // 🛡️ CACHING for History: 1 minute
  const { data: history = [] } = useQuery({
    queryKey: ['user-history', targetId],
    queryFn: async () => {
      const res = await api.get('/users/history') as any;
      return res.data;
    },
    staleTime: 60 * 1000,
    enabled: !!targetId && isOwnProfile,
  });

  const handleFollow = async () => {
    if (!profile || isOwnProfile || isMutating) return;
    try {
      setIsMutating(true);
      await api.post(`/users/${profile.id}/follow`);
      toast.success('Registry Link Established');
      // Đợi refetch xong để UI đồng bộ hoàn toàn
      await queryClient.invalidateQueries({ queryKey: ['user-profile', targetId] });
    } catch (error) {
      console.error('Follow failed:', error);
      toast.error('Failed to establish registry link');
    } finally {
      setIsMutating(false);
    }
  };

  const handleUnfollow = async () => {
    if (!profile || isOwnProfile || isMutating) return;
    try {
      setIsMutating(true);
      await api.delete(`/users/${profile.id}/unfollow`);
      toast.info('Registry Link Terminated');
      // Đợi refetch xong
      await queryClient.invalidateQueries({ queryKey: ['user-profile', targetId] });
    } catch (error) {
      console.error('Unfollow failed:', error);
      toast.error('Failed to terminate registry link');
    } finally {
      setIsMutating(false);
    }
  };

  if (profileLoading) return <ProfileSkeleton />;

  if (!profile) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-black text-white selection:bg-[#1db954] selection:text-black">
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay z-0 bg-noise" />
        <Fingerprint size={80} className="mb-6 text-white/10" />
        <h2 className="text-3xl font-black uppercase tracking-tighter italic mb-2">Registry_Entry_Missing</h2>
        <p className="mb-8 text-[10px] font-black uppercase tracking-widest text-white/30 italic">The requested identity could not be located in the primary database.</p>
        <Link to="/" className="px-8 py-4 border border-white text-white font-black uppercase tracking-widest text-[10px] hover:bg-white hover:text-black transition-all">
          Return_to_Core_Terminal
        </Link>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full min-h-full bg-black overflow-y-auto no-scrollbar relative isolate selection:bg-[#1db954] selection:text-black text-white">
      {/* ── Texture Overlay ── */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay z-50 bg-noise" />

      {/* ── GIANT BACKGROUND LABEL (EDITORIAL) ── */}
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 select-none pointer-events-none z-0 overflow-hidden w-full text-center">
        <span className="text-[20vw] md:text-[25vw] font-black text-white/[0.02] tracking-tighter uppercase leading-none italic block">
          {profile.name}
        </span>
      </div>

      <div className="px-6 lg:px-12 pt-24 pb-32 relative z-10 w-full max-w-screen-2xl mx-auto">

        {/* ── IDENTITY MANIFEST (HEADER) ── */}
        <motion.header
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-20 flex flex-col md:flex-row items-start gap-12 border-b border-white/10 pb-16 relative"
        >
          {/* Avatar Terminal */}
          <div className="relative group flex-shrink-0">
            <div className="w-48 h-48 md:w-64 md:h-64 border-2 border-white/10 bg-[#050505] relative overflow-hidden group-hover:border-white transition-all duration-500 shadow-[30px_30px_80px_rgba(0,0,0,0.8)]">
              {profile.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt={profile.name}
                  className="w-full h-full object-cover grayscale transition-all duration-700 group-hover:grayscale-0 group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-white/[0.02]">
                  <UserIcon size={64} className="text-white/10" />
                </div>
              )}

              {isOwnProfile && (
                <Link
                  to="/settings"
                  className="absolute inset-0 bg-black/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-[10px] font-black uppercase tracking-[0.3em] backdrop-blur-sm z-20"
                >
                  Overwrite_Asset
                </Link>
              )}

              {/* Decorative Corner Label */}
              <div className="absolute top-2 left-2 z-10">
                <span className="text-[7px] font-black text-white/40 uppercase tracking-[0.5em] bg-black/60 px-1 py-0.5">Asset_ID: {profile.id.slice(0, 6)}</span>
              </div>
            </div>

            {/* Visual Glitch Decor */}
            <div className="absolute -bottom-4 -right-4 w-12 h-12 border-r-2 border-b-2 border-[#1db954] opacity-40" />
          </div>

          <div className="flex-1 flex flex-col gap-6 min-w-0">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-[2px] bg-[#1db954]" />
                <span className="text-[10px] font-black uppercase tracking-[0.5em] text-[#1db954]">
                  {profile.role === 'ARTIST' ? 'ARCHITECT_LEVEL_AUTH' : 'IDENTITY_UNIT_LOGGED'}
                </span>
              </div>

              <h1 className="text-6xl md:text-8xl lg:text-[7rem] font-black uppercase tracking-tighter leading-[0.8] italic truncate">
                {profile.name}
              </h1>
            </div>

            <div className="flex flex-wrap items-center gap-10 mt-4">
              <StatItem label="Signal_Collection" value={profile.stats?.playlists || 0} unit="SETS" />
              <StatItem label="Network_Reach" value={profile.stats?.followers || 0} unit="NODES" />
              <StatItem label="Connectivity" value={profile.stats?.following || 0} unit="NODES" />
            </div>

            <div className="flex flex-wrap items-center gap-4 mt-8">
              {!isOwnProfile && (
                <button
                  disabled={isMutating}
                  onClick={profile.isFollowing ? handleUnfollow : handleFollow}
                  className={cn(
                    "relative overflow-hidden px-10 py-4 font-black uppercase tracking-[0.2em] text-[11px] transition-all duration-500 min-w-[260px] flex items-center justify-center gap-2",
                    isMutating
                      ? "bg-[#050505] text-[#1db954] border border-[#1db954]/20 cursor-not-allowed shadow-none"
                      : profile.isFollowing
                        ? "border border-white text-white hover:bg-white hover:text-black"
                        : "bg-[#1db954] text-black border border-[#1db954] hover:bg-white hover:border-white shadow-[10px_10px_0px_rgba(29,185,84,0.1)]"
                  )}
                >
                  {isMutating ? (
                    <>
                      {/* Neon Green Laser sweep background */}
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-[#1db954]/10 to-transparent pointer-events-none"
                        initial={{ x: '-100%' }}
                        animate={{ x: '100%' }}
                        transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                      />
                      {/* Bottom glowing laser line */}
                      <motion.div
                        className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#1db954] shadow-[0_0_12px_#1db954] pointer-events-none"
                        initial={{ scaleX: 0, originX: 0 }}
                        animate={{ scaleX: [0, 1, 1, 0], originX: [0, 0, 1, 1] }}
                        transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                      />
                      
                      {/* Cyber Telemetry Blinking Text */}
                      <span className="relative z-10 flex items-center gap-2 tracking-[0.2em] font-mono text-[9px] font-bold text-[#1db954]">
                        <motion.span
                          animate={{ opacity: [1, 0, 1] }}
                          transition={{ repeat: Infinity, duration: 0.6, ease: "steps(2)" as any }}
                        >
                          ⚡
                        </motion.span>
                        {profile.isFollowing ? 'TERMINATING_LINK' : 'ESTABLISHING_LINK'}
                        <motion.span
                          animate={{ opacity: [0, 1, 0] }}
                          transition={{ repeat: Infinity, duration: 0.6, ease: "steps(2)" as any }}
                        >
                          _
                        </motion.span>
                      </span>
                    </>
                  ) : (
                    profile.isFollowing ? 'Halt_Observation' : 'Initialize_Link'
                  )}
                </button>
              )}

              <button
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  toast.success('Asset link captured to buffer');
                }}
                className="p-4 border border-white/10 text-white/40 hover:text-white hover:border-white transition-all bg-[#050505]"
                title="Capture_Link"
              >
                <Share2 size={16} />
              </button>

              {!isOwnProfile && currentUser && (
                <button
                  onClick={() => openReportModal(profile.id, 'USER', profile.name)}
                  className="p-4 border border-white/10 text-white/20 hover:text-red-500 hover:border-red-500 transition-all bg-[#050505]"
                >
                  <AlertTriangle size={16} />
                </button>
              )}
            </div>
          </div>

          {/* Editorial Vertical Spine (Right) */}
          <div className="hidden lg:flex absolute right-0 top-0 bottom-16 w-8 items-center justify-center border-l border-white/10 opacity-20 pointer-events-none">
            <span className="text-[7px] font-black uppercase tracking-[0.6em] whitespace-nowrap rotate-90 origin-center">
              PROFILE_SYSTEM_V4.0 // RINGBEAT_INTERNAL_ARCHIVE
            </span>
          </div>
        </motion.header>

        {/* ── MANIFEST SECTIONS ── */}
        <div className="space-y-32">

          {/* 01: RECENT ACTIVITY */}
          {isOwnProfile && (
            <ManifestSection title="Signal_History" index="01">
              {history.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-8">
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
                <EmptyState label="Archive_History_Empty" />
              )}
            </ManifestSection>
          )}

          {/* 02: DISCOGRAPHY (Artist only) */}
          {profile.role === 'ARTIST' && profile.albums?.length > 0 && (
            <ManifestSection title="Master_Archives" index="02">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-8">
                {profile.albums.map((album: any) => (
                  <MediaCard
                    key={album.id}
                    id={album.id}
                    title={album.title}
                    subtitle="COLLECTION"
                    coverUrl={album.coverUrl}
                    type="album"
                  />
                ))}
              </div>
            </ManifestSection>
          )}

          {/* 03: PUBLIC COLLECTIONS */}
          <ManifestSection title="Network_Libraries" index={isOwnProfile ? "02" : "01"}>
            {profile.playlists?.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-8">
                {profile.playlists.map((pl: any) => (
                  <MediaCard
                    key={pl.id}
                    id={pl.id}
                    title={pl.title}
                    subtitle={`SETS // ${pl.ownerName || profile.name}`}
                    coverUrl={pl.coverUrl}
                    type="playlist"
                    songs={pl.songs}
                    isPublic={pl.isPublic}
                    ownerId={pl.ownerId}
                  />
                ))}
              </div>
            ) : (
              <div className="py-24 border border-dashed border-white/5 flex flex-col items-center justify-center opacity-20 italic">
                <Database size={40} className="mb-4" />
                <p className="text-[10px] font-black uppercase tracking-[0.4em]">No_Public_Data_Detected</p>
              </div>
            )}
          </ManifestSection>

        </div>

        {/* ── FOOTER STATUS ── */}
        <footer className="mt-40 pt-12 border-t border-white/10 opacity-20 flex justify-between items-center">
          <div className="flex flex-col gap-1">
            <span className="text-[9px] font-black uppercase tracking-[0.4em] text-[#1db954]">Profile_Terminal_Success</span>
            <span className="text-[7px] font-black uppercase tracking-widest text-white">RingBeat Data Archives // Cluster: User-Registry-V4</span>
          </div>
          <div className="flex gap-8">
            <Cpu size={14} />
            <Zap size={14} />
          </div>
        </footer>
      </div>
    </div>
  );
};

/* ── COMPONENT ABSTRACTIONS (Optimized) ── */

const StatItem = memo(({ label, value, unit }: { label: string; value: number | string; unit: string }) => (
  <div className="flex flex-col gap-1">
    <span className="text-[8px] font-black text-white/20 uppercase tracking-[0.4em]">{label}</span>
    <div className="flex items-baseline gap-2">
      <span className="text-3xl font-black italic tracking-tighter text-white">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </span>
      <span className="text-[8px] font-black text-[#1db954]/60 uppercase tracking-widest">{unit}</span>
    </div>
  </div>
));
StatItem.displayName = 'StatItem';

const ManifestSection = memo(({ title, index, children }: { title: string; index: string; children: React.ReactNode }) => (
  <section className="w-full">
    <div className="flex items-center gap-4 mb-10">
      <div className="flex flex-col">
        <span className="text-[10px] font-black text-[#1db954] mb-1 italic">{index}</span>
        <h2 className="text-3xl font-black uppercase tracking-tighter italic text-white">{title}</h2>
      </div>
      <div className="h-[1px] flex-1 bg-white/10 mt-6" />
    </div>
    {children}
  </section>
));
ManifestSection.displayName = 'ManifestSection';

const EmptyState = memo(({ label }: { label: string }) => (
  <div className="py-24 border border-white/5 bg-[#050505] flex flex-col items-center justify-center opacity-40">
    <Activity size={32} className="mb-4 text-white/10" />
    <p className="text-[9px] font-black uppercase tracking-[0.5em] italic">{label}</p>
  </div>
));
EmptyState.displayName = 'EmptyState';

const ProfileSkeleton = () => (
  <div className="flex-1 w-full min-h-full bg-black overflow-hidden relative">
    <div className="absolute inset-0 opacity-[0.03] bg-noise" />
    <div className="px-6 lg:px-12 pt-24 space-y-16">
      <div className="flex flex-col md:flex-row items-start gap-12 border-b border-white/10 pb-16">
        <Skeleton className="w-48 h-48 md:w-64 md:h-64 rounded-none border border-white/10" />
        <div className="space-y-6 flex-1 w-full pt-4">
          <Skeleton className="h-4 w-32 bg-white/5" />
          <Skeleton className="h-32 w-full bg-white/5" />
          <div className="flex gap-10">
            <Skeleton className="h-12 w-24 bg-white/5" />
            <Skeleton className="h-12 w-24 bg-white/5" />
          </div>
        </div>
      </div>
      <div className="space-y-12">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-48 bg-white/5" />
          <Skeleton className="h-[1px] flex-1 bg-white/5" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Skeleton key={i} className="aspect-square bg-white/5 border border-white/5" />
          ))}
        </div>
      </div>
    </div>
  </div>
);