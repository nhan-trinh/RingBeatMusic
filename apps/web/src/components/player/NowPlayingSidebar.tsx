import { useState, useEffect } from 'react';
import { usePlayerStore } from '../../stores/player.store';
import { useUIStore } from '../../stores/ui.store';
import { useLibraryStore } from '../../stores/library.store';
import { api } from '../../lib/api';
import { X, Heart, MoreHorizontal, CheckCircle2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Link } from 'react-router-dom';
import { CanvasPlayer } from './CanvasPlayer';
import { FastAverageColor } from 'fast-average-color';

export const NowPlayingSidebar = () => {
  const { currentTrack, isPlaying } = usePlayerStore();
  const { isNowPlayingVisible, setNowPlayingVisible } = useUIStore();
  const { isLiked, toggleLike, isFollowing, toggleFollow } = useLibraryStore();
  const [artist, setArtist] = useState<any>(null);
  const [bgColor, setBgColor] = useState('#121212');

  useEffect(() => {
    if (!currentTrack) return;
    setBgColor('#121212');
    setArtist(null);

    if (currentTrack.coverUrl) {
      const fac = new FastAverageColor();
      const imgUrl = `${currentTrack.coverUrl}${currentTrack.coverUrl.includes('?') ? '&' : '?'}cb=${Date.now()}`;
      fac.getColorAsync(imgUrl, { crossOrigin: 'anonymous' })
        .then(color => setBgColor(color.hex))
        .catch(() => setBgColor('#1a1a1a'))
        .finally(() => fac.destroy());
    }

    if (currentTrack.artistId) {
      api.get(`/artists/${currentTrack.artistId}`).then((res: any) => {
        setArtist(res.data);
      }).catch(() => { });
    }
  }, [currentTrack?.id, currentTrack?.artistId]);

  if (!isNowPlayingVisible || !currentTrack) return null;

  return (
    <aside
      className="w-[340px] flex-shrink-0 rounded-lg overflow-hidden relative group/sidebar flex flex-col"
      style={{ background: bgColor }}
    >
      {/* ══ CASE 1: CÓ CANVAS VIDEO (Beautiful UI) ══ */}
      {currentTrack.canvasUrl ? (
        <>
          {/* Layer 1: Canvas Video lót toàn bộ */}
          <CanvasPlayer
            url={currentTrack.canvasUrl}
            isPlaying={isPlaying}
            className="absolute inset-0 w-full h-full"
          />

          {/* Layer 2: Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/10 to-black/75" />

          {/* Layer 3: Close Button (Floating) */}
          <div className="absolute top-0 left-0 right-0 p-3 flex items-center justify-between z-30">
            <span className="text-[11px] font-black text-white/70 uppercase tracking-widest drop-shadow-md">
              Đang phát
            </span>
            <button
              onClick={() => setNowPlayingVisible(false)}
              className="p-1.5 bg-black/30 hover:bg-black/50 rounded-full text-white/80 hover:text-white transition-all backdrop-blur-sm"
            >
              <X size={18} />
            </button>
          </div>

          {/* Layer 4: Content Scroll (With 55% Spacer) */}
          <div className="absolute inset-0 overflow-y-auto custom-scrollbar flex flex-col z-10">
            <div className="flex-1 min-h-[55%]" />
            <div className="bg-gradient-to-t from-black/80 via-black/40 to-transparent">
              <SongInfo currentTrack={currentTrack} isLiked={isLiked} toggleLike={toggleLike} />
            </div>
            <div className="bg-black/80 backdrop-blur-md">
              <ArtistInfo artist={artist} currentTrack={currentTrack} isFollowing={isFollowing} toggleFollow={toggleFollow} />
              <CreditsInfo artist={artist} currentTrack={currentTrack} isFollowing={isFollowing} toggleFollow={toggleFollow} />
            </div>
          </div>
        </>
      ) : (
        /* ══ CASE 2: KHÔNG CÓ CANVAS (Standard Block UI) ══ */
        <>
          {/* Header (Non-floating) */}
          <div className="p-4 py-3 flex items-center justify-between shrink-0">
            <span className="text-[13px] font-bold text-white uppercase tracking-tight">
              Đang phát
            </span>
            <button
              onClick={() => setNowPlayingVisible(false)}
              className="p-1.5 text-[#b3b3b3] hover:text-white hover:bg-white/10 rounded-full transition-all"
            >
              <X size={20} />
            </button>
          </div>

          {/* Scrollable Content (No Spacer) */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 pt-0 space-y-5">
            {/* Square Image Block */}
            <div className="relative aspect-square w-full rounded-lg overflow-hidden shadow-[0_8px_24px_rgba(0,0,0,0.5)] group/image">
              <img
                src={currentTrack.coverUrl}
                alt={currentTrack.title}
                className="w-full h-full object-cover group-hover/image:scale-105 transition-transform duration-700"
              />
            </div>

            {/* Song Info (Standard position) */}
            <div className="space-y-1">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h1 className="text-2xl font-black text-white leading-tight truncate">
                    <Link to={`/track/${currentTrack.id}`} className="hover:underline">
                      {currentTrack.title}
                    </Link>
                  </h1>
                  <p className="text-base text-[#b3b3b3] font-semibold truncate">
                    <Link to={`/artist/${currentTrack.artistId}`} className="hover:underline hover:text-white">
                      {currentTrack.artistName}
                    </Link>
                  </p>
                </div>
                <button
                  onClick={() => toggleLike(currentTrack.id, currentTrack.title)}
                  className={cn(
                    "mt-1.5 flex-shrink-0 transition-transform active:scale-90",
                    isLiked(currentTrack.id) ? "text-[#1db954]" : "text-[#b3b3b3] hover:text-white"
                  )}
                >
                  <Heart size={24} className={isLiked(currentTrack.id) ? "fill-current" : ""} />
                </button>
              </div>
            </div>

            {/* Artist Info & Credits (Standard transparency) */}
            <ArtistInfo artist={artist} currentTrack={currentTrack} isFollowing={isFollowing} toggleFollow={toggleFollow} standard />
            <CreditsInfo artist={artist} currentTrack={currentTrack} isFollowing={isFollowing} toggleFollow={toggleFollow} standard />
          </div>
        </>
      )}
    </aside>
  );
};

// ─── Sub-Components ──────────────────────────────────────────────────────────

const SongInfo = ({ currentTrack, isLiked, toggleLike }: any) => (
  <div className="px-4 pt-2 pb-3">
    <h1 className="text-[22px] font-black text-white leading-tight drop-shadow-lg line-clamp-2 mb-1">
      <Link to={`/track/${currentTrack.id}`} className="hover:underline">
        {currentTrack.title}
      </Link>
    </h1>
    <div className="flex items-center justify-between gap-2">
      <p className="text-sm text-white/75 font-semibold truncate flex-1">
        <Link to={`/artist/${currentTrack.artistId}`} className="hover:underline hover:text-white">
          {currentTrack.artistName}
        </Link>
      </p>
      <div className="flex items-center gap-0.5 shrink-0">
        <button
          onClick={() => toggleLike(currentTrack.id, currentTrack.title)}
          className={cn(
            "p-1.5 rounded-full transition-all hover:scale-110",
            isLiked(currentTrack.id) ? "text-[#1db954]" : "text-white/80 hover:text-white"
          )}
        >
          <Heart size={20} className={isLiked(currentTrack.id) ? "fill-current" : ""} />
        </button>
        <button className="p-1.5 rounded-full text-white/80 hover:text-white transition-all">
          <MoreHorizontal size={20} />
        </button>
      </div>
    </div>
  </div>
);

const ArtistInfo = ({ artist, currentTrack, isFollowing, toggleFollow, standard }: any) => (
  <div className={cn("pb-1", standard ? "" : "px-3 pb-3")}>
    <div className={cn(
      "rounded-2xl overflow-hidden border border-white/10 group/card shadow-xl",
      standard ? "bg-white/5" : "bg-black/40 backdrop-blur-md"
    )}>
      <div className="h-48 w-full relative overflow-hidden">
        <img
          src={artist?.avatarUrl || currentTrack.coverUrl}
          className="w-full h-full object-cover brightness-75 group-hover/card:scale-110 transition-transform duration-[3s]"
          alt=""
        />
        <div className="absolute inset-0"
          style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.25) 0%, transparent 40%, rgba(0,0,0,0.65) 100%)' }}
        />
        <div className="absolute top-3 left-3 z-10">
          <p className="text-[9px] font-black uppercase tracking-widest text-white/80 bg-black/50 backdrop-blur-sm px-2 py-1 rounded">
            Giới thiệu về nghệ sĩ
          </p>
        </div>
        <div className="absolute bottom-3 left-4 right-4 z-10">
          <div className="flex items-center gap-1.5 mb-0.5">
            <h3 className="font-black text-base text-white drop-shadow tracking-tight">
              {currentTrack.artistName}
            </h3>
            {artist?.isVerified && (
              <CheckCircle2 size={14} className="text-[#3d91ff] fill-[#3d91ff]" />
            )}
          </div>
          <span className="text-xs font-semibold text-white/65">
            {artist?.followersCount?.toLocaleString() || '0'} người theo dõi
          </span>
        </div>
      </div>

      <div className="px-4 py-3 space-y-3">
        {artist?.bio && (
          <p className="text-xs text-[#b3b3b3] line-clamp-3 leading-relaxed">
            {artist.bio}
          </p>
        )}
        <button
          onClick={() => artist?.id && toggleFollow(artist.id, currentTrack.artistName)}
          className={cn(
            "w-full py-2 rounded-full font-bold text-sm transition-all active:scale-95 border",
            isFollowing(currentTrack.artistId || '')
              ? "bg-transparent text-white border-white/40 hover:border-white"
              : "bg-white text-black border-white hover:bg-white/90"
          )}
        >
          {isFollowing(currentTrack.artistId || '') ? 'Đang theo dõi' : 'Theo dõi'}
        </button>
      </div>
    </div>
  </div>
);

const CreditsInfo = ({ artist, currentTrack, isFollowing, toggleFollow, standard }: any) => (
  <div className={cn("pb-6", standard ? "" : "px-3 pb-4")}>
    <div className={cn(
      "p-4 rounded-2xl border border-white/10 shadow-xl",
      standard ? "bg-white/5" : "bg-black/40 backdrop-blur-md"
    )}>
      <h4 className="text-[10px] font-black text-[#b3b3b3] uppercase tracking-widest mb-3">Thành phẩm</h4>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          {artist?.avatarUrl ? (
            <img src={artist.avatarUrl} className="w-9 h-9 rounded-full object-cover shrink-0" alt="" />
          ) : (
            <div className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center font-bold text-xs shrink-0">
              {currentTrack.artistName?.[0] ?? '?'}
            </div>
          )}
          <div className="flex flex-col min-w-0">
            <Link
              to={`/artist/${currentTrack.artistId}`}
              className="text-sm font-bold hover:underline truncate text-white"
            >
              {currentTrack.artistName}
            </Link>
            <span className="text-xs text-[#b3b3b3]">Nghệ sĩ chính</span>
          </div>
        </div>
        <button
          onClick={() => artist?.id && toggleFollow(artist.id, currentTrack.artistName)}
          className={cn(
            "shrink-0 text-xs font-bold px-3 py-1.5 rounded-full border transition-all ml-2",
            isFollowing(currentTrack.artistId || '')
              ? "text-white border-white/30 hover:border-white"
              : "text-white border-white/50 hover:bg-white/10"
          )}
        >
          {isFollowing(currentTrack.artistId || '') ? 'Đang theo dõi' : 'Theo dõi'}
        </button>
      </div>
    </div>
  </div>
);
