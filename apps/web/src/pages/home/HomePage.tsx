import { useMemo, memo, useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { MediaCard } from '../../components/shared/MediaCard';
import { RecentCard } from '../../components/shared/RecentCard';
import { MediaCarousel } from '../../components/shared/MediaCarousel';
import { Link } from 'react-router-dom';
import { Cpu, Database, Zap, Activity, Shield, Globe, Box, Terminal } from 'lucide-react';
import vBg from '../../assets/HERO-SECTION-BGDEMO.mp4';
import { useHeroConfig } from '../../hooks/useHeroConfig';

// ─── Decoration Components ──────────────────────────────────────────────────
const Crosshair = ({ className }: { className?: string }) => (
  <div className={`absolute w-4 h-4 text-white/20 pointer-events-none ${className}`}>
    <div className="absolute top-1/2 left-0 w-full h-[1px] bg-current" />
    <div className="absolute top-0 left-1/2 w-[1px] h-full bg-current" />
  </div>
);

const TechnicalStrip = () => (
  <div className="flex items-center gap-8 py-2 border-b border-white/5 opacity-10 hover:opacity-40 transition-opacity">
    <div className="flex items-center gap-2">
      <div className="w-1.5 h-1.5 rounded-full bg-[#1db954] animate-pulse" />
      <span className="text-[7px] font-black uppercase tracking-[0.4em]">CORE_LINK_STABLE</span>
    </div>
    <div className="h-2 w-[1px] bg-white/20" />
    <span className="text-[7px] font-black uppercase tracking-[0.4em]">REGISTRY: LOCAL_NODE_ARCHIVE</span>
    <div className="h-2 w-[1px] bg-white/20" />
    <span className="text-[7px] font-black uppercase tracking-[0.4em]">UPTIME: 99.9%</span>
  </div>
);

export const HomePage = () => {
  const { data: heroConfig, isLoading: isHeroLoading } = useHeroConfig();

  const { data: feedData } = useQuery({
    queryKey: ['homeFeed'],
    queryFn: async () => {
      const res = await api.get('/home/feed') as any;
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: personalizedData } = useQuery({
    queryKey: ['personalizedFeed'],
    queryFn: async () => {
      try {
        const res = await api.get('/home/personalized') as any;
        return res.data;
      } catch (e) {
        return null;
      }
    },
    staleTime: 5 * 60 * 1000,
  });

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Morning_Archive';
    if (hour < 18) return 'Afternoon_Stream';
    return 'Evening_Session';
  }, []);

  if (!feedData) {
    return (
      <div className="p-8 pt-24 min-h-full w-full bg-black text-white selection:bg-[#1db954] selection:text-black relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.02] bg-[radial-gradient(#1db954_1px,transparent_1px)] [background-size:20px_20px]" />
        <div className="flex flex-col gap-12 animate-pulse relative z-10">
          <div className="h-20 w-64 bg-white/5" />
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-20 bg-white/5 border border-white/10" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full min-h-full bg-black overflow-y-auto no-scrollbar relative isolate selection:bg-[#1db954] selection:text-black">
      {/* Background Accents */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none z-0 bg-[radial-gradient(#1db954_1px,transparent_1px)] [background-size:32px_32px]" />
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay z-50 bg-noise" />

      <div className="px-6 lg:px-12 pt-8 pb-32 relative z-10 w-full max-w-screen-2xl mx-auto">
        <TechnicalStrip />

        {/* ── HERO SECTION (Ultra-Redesigned with Video Background) ── */}
        <section className="mt-8 mb-24 relative group overflow-hidden border border-white/5">
          {/* Background Video Layer */}
          <div className="absolute inset-0 z-0 overflow-hidden">
            {isHeroLoading ? (
              <div className="w-full h-full bg-[#111] animate-pulse" />
            ) : heroConfig?.backgroundType === 'image' && heroConfig?.backgroundUrl ? (
              <img 
                src={heroConfig.backgroundUrl}
                alt="Hero Background"
                className="w-full h-full object-cover opacity-40 grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-1000"
              />
            ) : (
              <video 
                autoPlay 
                muted 
                loop 
                playsInline 
                className="w-full h-full object-cover opacity-40 grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-1000"
              >
                <source src={heroConfig?.backgroundUrl || vBg} type="video/mp4" />
              </video>
            )}
            
            {/* Brutalist Overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent z-10" />
            <div className="absolute inset-0 bg-[radial-gradient(transparent_1px,#000_1px)] [background-size:4px_4px] opacity-30 z-20" />
            <div className="absolute inset-0 border-[20px] border-black z-30 pointer-events-none opacity-40" />
          </div>

          <div className="relative z-40 px-8 lg:px-16 py-20 lg:py-32">
            <Crosshair className="top-4 left-4" />
            <Crosshair className="bottom-4 right-4" />

            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-12 relative">
              <div className="space-y-10">
                <div className="flex items-center gap-4">
                  <div className="px-3 py-1 bg-[#1db954] text-black text-[9px] font-black uppercase tracking-[0.4em] flex items-center gap-2">
                    <Terminal size={10} />
                    LIVE_FEED: ACTIVE
                  </div>
                  <div className="flex gap-1">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="w-1 h-3 bg-[#1db954]/40 animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-white uppercase tracking-tighter leading-[0.8] italic transition-all duration-1000 group-hover:tracking-normal group-hover:text-[#1db954]">
                    {greeting}
                  </h1>
                  <div className="flex items-center gap-4 opacity-50">
                    <div className="h-[1px] w-24 bg-white" />
                    <span className="text-[10px] font-black uppercase tracking-[0.5em]">System_Identity_Verified</span>
                  </div>
                </div>

                <p className="max-w-xl text-white/50 text-[12px] font-black uppercase tracking-[0.2em] leading-relaxed italic border-l-4 border-[#1db954] pl-8 py-4 bg-black/40 backdrop-blur-sm">
                  {heroConfig?.heroText || 'Truy cập vào hệ thống âm thanh tần số cao. Dữ liệu telemetry cho thấy tín hiệu ổn định trên toàn bộ các node thứ cấp. Sẵn sàng truyền phát tín hiệu đồng bộ.'}
                </p>
                
                <div className="flex items-center gap-8">
                   <button className="px-8 py-4 bg-white text-black font-black uppercase tracking-[0.4em] text-[10px] hover:bg-[#1db954] hover:text-black transition-all shadow-[8px_8px_0px_rgba(255,255,255,0.1)] active:translate-x-1 active:translate-y-1 active:shadow-none">
                     SYNCHRONIZE_NOW
                   </button>
                   <div className="flex flex-col gap-1">
                      <span className="text-[7px] font-black text-white/20 uppercase tracking-widest">Latency: 14ms</span>
                      <span className="text-[7px] font-black text-[#1db954] uppercase tracking-widest">Signal: Excellent</span>
                   </div>
                </div>
              </div>

              <div className="flex flex-col gap-8 opacity-20 group-hover:opacity-60 transition-all duration-1000 border-l border-white/10 pl-12 hidden lg:flex">
                <TechnicalReadout icon={Cpu} label="System_Core" value="Stable_v4.2" />
                <TechnicalReadout icon={Globe} label="Access_Point" value="Node_Primary" />
                <TechnicalReadout icon={Shield} label="Security" value="Encrypted_S2" />
                <div className="mt-4 pt-4 border-t border-white/10">
                   <div className="text-[8px] font-black text-white/40 uppercase tracking-[0.3em] mb-2">Data_Stream_Log</div>
                   <div className="w-32 h-1 bg-white/5 overflow-hidden">
                      <div className="w-1/2 h-full bg-[#1db954] animate-[shimmer_2s_infinite]" />
                   </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── 01: RECENTLY PLAYED ── */}
        <Section title="Recently Played" index="01" icon={Activity}>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-16">
            {feedData.recentlyPlayed?.map((item: any) => (
              <RecentCard
                key={item.id}
                id={item.id}
                title={item.title}
                coverUrl={item.coverUrl}
                type="playlist"
                songs={item.songs}
              />
            ))}
          </div>
        </Section>

        {/* ── 02: RECENTLY VISITED ── */}
        {personalizedData?.recentlyVisited?.length > 0 && (
          <Section title="Recently Visited" index="02" icon={Box}>
            <MediaCarousel>
              {personalizedData.recentlyVisited.map((item: any) => (
                <MediaCard
                  key={`${item.type}-${item.id}`}
                  id={item.id}
                  title={item.title}
                  subtitle={item.subTitle || item.type}
                  coverUrl={item.coverUrl}
                  type={item.type?.toLowerCase() as any}
                  songs={item.type === 'SONG' ? [item] : item.songs}
                  isCircle={item.type === 'ARTIST'}
                />
              ))}
            </MediaCarousel>
          </Section>
        )}

        {/* ── 03: DAILY MIX ── */}
        {personalizedData?.dailyMix?.length > 0 && (
          <Section title="Daily Mix" index="03" icon={Zap} showAllLink="/section/daily-mix">
            <MediaCarousel>
              {personalizedData.dailyMix.map((song: any) => (
                <MediaCard key={song.id} id={song.id} title={song.title} subtitle={song.artistName} coverUrl={song.coverUrl} type="song" songs={[song]} />
              ))}
            </MediaCarousel>
          </Section>
        )}

        {/* ── 04: LISTEN AGAIN ── */}
        {personalizedData?.listenAgain?.length > 0 && (
          <Section title="Listen Again" index="04" icon={Activity} showAllLink="/section/listen-again">
            <MediaCarousel>
              {personalizedData.listenAgain.map((item: any) => (
                <MediaCard key={item.id} id={item.id} title={item.title} subtitle={item.artistName} coverUrl={item.coverUrl} type="song" songs={[item]} />
              ))}
            </MediaCarousel>
          </Section>
        )}

        {/* ── 05: MADE FOR YOU ── */}
        <Section title="Made For You" index="05" icon={Database} showAllLink="/section/made-for-you">
          <MediaCarousel>
            {feedData.madeForYou?.map((item: any) => (
              <MediaCard key={item.id} id={item.id} title={item.title} subtitle={item.description} coverUrl={item.coverUrl} songs={item.songs} isPublic={item.isPublic} ownerId={item.ownerId} />
            ))}
          </MediaCarousel>
        </Section>

        {/* ── 06: TRENDING ── */}
        {feedData.trending?.length > 0 && (
          <Section title="Trending" index="06" icon={Zap} showAllLink="/section/trending">
            <MediaCarousel>
              {feedData.trending?.map((item: any) => (
                <MediaCard key={item.id} id={item.id} title={item.title} subtitle={item.description} coverUrl={item.coverUrl} songs={item.songs} isPublic={item.isPublic} ownerId={item.ownerId} />
              ))}
            </MediaCarousel>
          </Section>
        )}

        {/* ── 07: NEW RELEASES ── */}
        {feedData.newReleases?.length > 0 && (
          <Section title="New Releases" index="07" icon={Box} showAllLink="/section/new-releases">
            <MediaCarousel>
              {feedData.newReleases?.map((song: any) => (
                <MediaCard key={song.id} id={song.id} title={song.title} subtitle={song.artistName} coverUrl={song.coverUrl} type="song" songs={[song]} />
              ))}
            </MediaCarousel>
          </Section>
        )}

        {/* ── 08: TOP SONGS ── */}
        {feedData.topSongs?.length > 0 && (
          <Section title="Top Songs" index="08" icon={Activity} showAllLink="/section/top-songs">
            <MediaCarousel>
              {feedData.topSongs?.map((song: any) => (
                <MediaCard key={song.id} id={song.id} title={song.title} subtitle={song.artistName} coverUrl={song.coverUrl} type="song" songs={[song]} />
              ))}
            </MediaCarousel>
          </Section>
        )}

        {/* ── 09: NEW ALBUMS ── */}
        {feedData.newAlbums?.length > 0 && (
          <Section title="New Albums" index="09" icon={Database} showAllLink="/section/new-albums">
            <MediaCarousel>
              {feedData.newAlbums?.map((album: any) => (
                <MediaCard key={album.id} id={album.id} title={album.title} subtitle={album.artistName} coverUrl={album.coverUrl} type="album" />
              ))}
            </MediaCarousel>
          </Section>
        )}

        {/* ── 10: RECOMMENDED ARTISTS ── */}
        {personalizedData?.recommendedArtists?.length > 0 && (
          <Section title="Recommended Artists" index="10" icon={Globe}>
            <MediaCarousel>
              {personalizedData.recommendedArtists.map((artist: any) => (
                <MediaCard key={artist.id} id={artist.id} title={artist.stageName} subtitle="Artist" coverUrl={artist.avatarUrl} type="artist" isCircle={true} />
              ))}
            </MediaCarousel>
          </Section>
        )}

        {/* ── SYSTEM STATUS ── */}
        <footer className="mt-24 pt-12 border-t border-white/10 relative">
          <Crosshair className="-top-2 -left-2 scale-50" />
          <div className="flex flex-col lg:flex-row justify-between items-center gap-8 opacity-20">
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-black uppercase tracking-[0.5em] text-[#1db954]">RingBeat_System_Broadcast</span>
              <p className="text-[8px] font-black uppercase tracking-widest leading-loose text-white/40 max-w-sm">
                All audio transmissions are encrypted and verified through the local data manifest archive. Version 4.2 Stable.
              </p>
            </div>
            <div className="flex items-center gap-12 text-white/40">
              <div className="flex flex-col items-end">
                <span className="text-[7px] font-black uppercase">Registry_ID</span>
                <span className="text-[9px] font-black tabular-nums">426A9239-5F6</span>
              </div>
              <div className="flex gap-4">
                <Zap size={14} className="hover:text-[#1db954] transition-colors cursor-crosshair" />
                <Activity size={14} className="hover:text-[#1db954] transition-colors cursor-crosshair" />
                <Globe size={14} className="hover:text-[#1db954] transition-colors cursor-crosshair" />
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

const Section = memo(({ title, index, icon: Icon, showAllLink, children }: { title: string; index: string; icon?: any; showAllLink?: string; children: React.ReactNode }) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        if (ref.current) observer.unobserve(ref.current);
      }
    }, { rootMargin: '300px' });

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={ref} className="mb-24 w-full min-h-[350px] relative group/section">
      <div className="flex items-end justify-between mb-10 border-b border-white/5 pb-6 relative">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <span className="text-[8px] font-black text-[#1db954] uppercase tracking-widest px-2 py-0.5 border border-[#1db954]/20">INDEX_{index}</span>
            <div className="w-12 h-[1px] bg-white/10 group-hover/section:w-20 transition-all duration-700" />
          </div>
          <div className="flex items-center gap-4">
            {Icon && <Icon size={20} className="text-[#1db954] opacity-20 group-hover/section:opacity-100 transition-opacity" />}
            <h2 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter italic leading-none">
              {title}
            </h2>
          </div>
        </div>
        {showAllLink && (
          <Link to={showAllLink} className="text-[9px] font-black text-white/20 hover:text-[#1db954] transition-all uppercase tracking-[0.4em] px-6 py-2 border border-white/5 hover:border-[#1db954] relative overflow-hidden group/link">
            <span className="relative z-10">Expand_Manifest</span>
            <div className="absolute inset-0 bg-white opacity-0 group-hover/link:opacity-5 transition-opacity" />
          </Link>
        )}

        {/* Dynamic Accent */}
        <div className="absolute bottom-[-1px] left-0 w-0 h-[1px] bg-[#1db954] group-hover/section:w-1/4 transition-all duration-1000" />
      </div>

      <div className={!isVisible ? 'opacity-0' : 'opacity-100 transition-opacity duration-1000'}>
        {isVisible ? children : (
          <div className="w-full h-[250px] bg-white/5 animate-pulse flex items-center justify-center opacity-30">
            <div className="w-12 h-[1px] bg-[#1db954] animate-pulse" />
          </div>
        )}
      </div>
    </section>
  );
});

Section.displayName = 'Section';

const TechnicalReadout = ({ icon: Icon, label, value }: { icon: any; label: string; value: string }) => (
  <div className="flex flex-col gap-2">
    <div className="flex items-center gap-3">
      <Icon size={14} className="text-[#1db954]" />
      <span className="text-[8px] font-black uppercase tracking-[0.4em] text-white/40">{label}</span>
    </div>
    <span className="text-sm font-black uppercase tracking-widest text-white italic pl-6">{value}</span>
  </div>
);
