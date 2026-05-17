import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { MediaCard } from '../../components/shared/MediaCard';
import { motion } from 'framer-motion';
import { Cpu, Zap, Activity, Globe, ChevronLeft } from 'lucide-react';

export const SectionPage = () => {
  const { id } = useParams();
  const { data = [], isLoading: loading } = useQuery({
    queryKey: ['section', id],
    queryFn: async () => {
      const res = await api.get(`/search?q=${id}`) as any;
      if (id === 'new-albums') return res.data.albums || [];
      if (id === 'new-releases' || id === 'top-songs' || id === 'trending' || id === 'made-for-you' || id === 'daily-mix' || id === 'listen-again') {
        return res.data.songs || [];
      }
      return res.data.songs || res.data.playlists || res.data.albums || [];
    },
    enabled: !!id,
  });

  const getTitle = () => {
    switch (id) {
      case 'new-releases': return 'New_Releases';
      case 'top-songs': return 'Top_Archive';
      case 'made-for-you': return 'Personal_Curated';
      case 'trending': return 'Trending_Signals';
      case 'new-albums': return 'Fresh_Albums';
      case 'daily-mix': return 'Daily_Buffer';
      case 'listen-again': return 'Recurrent_Stream';
      default: return 'Archive_Explore';
    }
  };

  const getSubtext = () => {
    switch (id) {
      case 'new-releases': return 'Recent audio transmissions synchronized to primary node.';
      case 'top-songs': return 'Highest interaction frequencies across all system clusters.';
      case 'made-for-you': return 'Neural-link preferences identified. Custom stream active.';
      case 'trending': return 'Rapidly ascending signal strength detected in global archive.';
      case 'new-albums': return 'Multi-track containers released for widespread distribution.';
      default: return 'Accessing decrypted public archive manifests...';
    }
  };

  return (
    <div className="flex-1 w-full min-h-full bg-black overflow-y-auto no-scrollbar relative isolate selection:bg-[#1db954] selection:text-black">
      {/* Texture Layer */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay z-50 bg-noise" />

      <div className="px-6 lg:px-12 pt-20 pb-32 relative z-10 w-full max-w-screen-2xl mx-auto">
        
        {/* ── BACK NAVIGATION ── */}
        <Link to="/" className="inline-flex items-center gap-2 group mb-12">
           <div className="w-8 h-8 flex items-center justify-center border border-white/10 bg-white/[0.02] group-hover:border-[#1db954] transition-colors">
              <ChevronLeft size={14} className="group-hover:text-[#1db954] transition-colors" />
           </div>
           <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 group-hover:text-white transition-colors">Return_to_Core</span>
        </Link>

        {/* ── HEADER MANIFEST ── */}
        <header className="mb-20 grid lg:grid-cols-[1fr_300px] gap-12 items-end border-b border-white/10 pb-16">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
               <div className="w-12 h-[2px] bg-[#1db954]" />
               <span className="text-[10px] font-black uppercase tracking-[0.5em] text-[#1db954]">Archive_Access_v4</span>
            </div>
            <h1 className="text-6xl md:text-8xl font-black text-white uppercase tracking-tighter leading-none italic">
               {getTitle()}
            </h1>
            <p className="max-w-xl text-white/30 text-xs font-black uppercase tracking-widest leading-relaxed">
              {getSubtext()}
            </p>
          </div>

          <div className="hidden lg:flex flex-col gap-6 opacity-20">
             <TechnicalReadout icon={Cpu} label="System_ID" value={`SEC_${id?.slice(0, 3).toUpperCase()}_0x0`} />
             <TechnicalReadout icon={Globe} label="Signal_Domain" value="Local_Storage" />
             <TechnicalReadout icon={Activity} label="Buffer_Status" value="100%_Synchronized" />
          </div>
        </header>

        {/* ── GRID CONTENT ── */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="aspect-square bg-white/[0.03] border border-white/5 animate-pulse" />
            ))}
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-x-6 gap-y-12"
          >
            {data.map((item: any) => (
              <MediaCard 
                key={item.id}
                id={item.id}
                title={item.title}
                subtitle={item.artistName || item.description || ''}
                coverUrl={item.coverUrl}
                type={id === 'new-releases' || id === 'top-songs' || id === 'trending' || id === 'made-for-you' || id === 'daily-mix' || id === 'listen-again' ? 'song' : id === 'new-albums' ? 'album' : 'playlist'}
                songs={id === 'new-releases' || id === 'top-songs' || id === 'trending' || id === 'made-for-you' || id === 'daily-mix' || id === 'listen-again' ? [item] : (id === 'new-albums' ? [] : item.songs)}
                ownerId={item.ownerId}
                artistId={item.artistId}
                artistName={item.artistName}
              />
            ))}
          </motion.div>
        )}

        {/* ── FOOTER MARKER ── */}
        <div className="mt-32 pt-8 border-t border-white/10 flex justify-between items-center opacity-10">
           <span className="text-[8px] font-black uppercase tracking-[0.5em]">RingBeat Archive Explorer // System_Stable</span>
           <Zap size={12} />
        </div>
      </div>
    </div>
  );
};

const TechnicalReadout = ({ icon: Icon, label, value }: { icon: any; label: string; value: string }) => (
  <div className="flex items-center gap-4">
    <div className="w-10 h-10 flex items-center justify-center border border-white/10 bg-white/[0.02]">
      <Icon size={16} className="text-[#1db954]" />
    </div>
    <div className="flex flex-col">
      <span className="text-[7px] font-black uppercase tracking-[0.4em] text-white/40">{label}</span>
      <span className="text-[12px] font-black uppercase tracking-widest text-white">{value}</span>
    </div>
  </div>
);
