import { useEffect, useState } from 'react';
import { usePlayerStore } from '../../stores/player.store';
import { useUIStore } from '../../stores/ui.store';
import { useLibraryStore } from '../../stores/library.store';
import { api } from '../../lib/api';
import { X, Heart, MoreHorizontal, CheckCircle2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Link } from 'react-router-dom';
import { CanvasPlayer } from './CanvasPlayer';

export const NowPlayingSidebar = () => {
  const { currentTrack, isPlaying } = usePlayerStore();
  const { isNowPlayingVisible, setNowPlayingVisible } = useUIStore();
  const { isLiked, toggleLike, isFollowing, toggleFollow } = useLibraryStore();
  const [artist, setArtist] = useState<any>(null);
  const [canvasDims, setCanvasDims] = useState({ w: 9, h: 16 });

  useEffect(() => {
    setCanvasDims({ w: 9, h: 16 }); // Reset về mặc định khi đổi bài
    if (currentTrack?.artistId) {
      api.get(`/artists/${currentTrack.artistId}`).then((res: any) => {
        setArtist(res.data);
      }).catch(error => {
        console.error('Failed to fetch artist for sidebar:', error);
      });
    }
  }, [currentTrack?.artistId]);

  if (!isNowPlayingVisible || !currentTrack) return null;

  return (
    <aside className="w-[340px] flex-shrink-0 bg-[#000000] rounded-lg overflow-hidden flex flex-col animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="p-4 flex items-center justify-between bg-[#121212] sticky top-0 z-10">
        <h2 className="font-bold text-base hover:underline cursor-pointer">
          {currentTrack.title}
        </h2>
        <button
          onClick={() => setNowPlayingVisible(false)}
          className="p-1 hover:bg-white/10 rounded-full text-[#b3b3b3] hover:text-white transition-all"
        >
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#121212]">
        {/* Cover / Canvas Section */}
        <div
          className={cn(
            "transition-all duration-300",
            // Canvas: thêm padding để bo góc nổi bật, cover: giữ nguyên
            currentTrack.canvasUrl ? "px-3 pt-3" : "px-4 pt-0"
          )}
          style={currentTrack.canvasUrl ? { aspectRatio: `${canvasDims.w} / ${canvasDims.h}` } : {}}
        >
          <div className={cn(
            "w-full relative group overflow-hidden",
            currentTrack.canvasUrl
              // Canvas: bo góc + drop shadow mượt như Spotify
              ? "h-full rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.6)]"
              : "aspect-square rounded-lg bg-white/5 shadow-2xl"
          )}>
            {currentTrack.canvasUrl ? (
              <CanvasPlayer
                url={currentTrack.canvasUrl}
                isPlaying={isPlaying}
                onDimensionsReady={(w, h) => setCanvasDims({ w, h })}
              />
            ) : (
              <img
                src={currentTrack.coverUrl}
                alt={currentTrack.title}
                className="w-full h-full object-cover rounded-lg"
              />
            )}
            {/* Overlay Gradient */}
            <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>

        {/* Blur bleed shadow dưới canvas — tạo cảm giác float như Spotify */}
        {currentTrack.canvasUrl && (
          <div className="h-5 -mt-3 mx-8 blur-2xl opacity-30 bg-white/30 rounded-full pointer-events-none" />
        )}

        {/* Info Area */}
        <div className="px-4 py-2">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-2xl font-bold truncate hover:underline cursor-pointer">
                <Link to={`/track/${currentTrack.id}`}>{currentTrack.title}</Link>
              </h1>
              <p className="text-[#b3b3b3] hover:text-white hover:underline cursor-pointer">
                <Link to={`/artist/${currentTrack.artistId}`}>{currentTrack.artistName}</Link>
              </p>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => toggleLike(currentTrack.id, currentTrack.title)}
                className={cn("p-1 transition-all hover:scale-110", isLiked(currentTrack.id) ? "text-[#1db954]" : "text-[#b3b3b3] hover:text-white")}
              >
                <Heart size={20} className={isLiked(currentTrack.id) ? "fill-current" : ""} />
              </button>
              <button className="p-1 text-[#b3b3b3] hover:text-white">
                <MoreHorizontal size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* About Artist Card */}
        <div className="p-4">
          <div className="bg-[#242424] rounded-xl overflow-hidden group/card hover:bg-[#2a2a2a] transition-colors relative isolate border border-white/5">
            {/* Artist Cover/Avatar Header */}
            <div className="h-52 w-full relative overflow-hidden">
              <img
                src={artist?.avatarUrl || currentTrack.coverUrl}
                className="w-full h-full object-cover brightness-[0.85] group-hover/card:scale-110 transition-transform duration-700"
                alt=""
              />
              <div className="absolute top-4 left-4 z-20">
                <p className="text-[10px] font-black uppercase tracking-[0.15em] text-white drop-shadow-lg bg-black/20 backdrop-blur-sm px-2 py-0.5 rounded">Giới thiệu về nghệ sĩ</p>
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-[#242424] via-transparent to-transparent z-10" />
            </div>

            {/* Content info */}
            <div className="p-5 space-y-4 relative z-20 -mt-2">
              <div className="flex items-start justify-between">
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-extrabold text-lg hover:underline cursor-pointer tracking-tight">
                      {currentTrack.artistName}
                    </h3>
                    {artist?.isVerified && <CheckCircle2 size={18} className="text-[#3d91ff] fill-[#3d91ff] text-white" />}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xl font-black text-white">{artist?.followersCount?.toLocaleString() || '0'}</span>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#b3b3b3]">Người theo dõi</span>
                  </div>
                </div>
                <button
                  onClick={() => artist?.id && toggleFollow(artist.id, currentTrack.artistName)}
                  className={cn(
                    "text-xs font-bold px-5 py-2 rounded-full border border-white/20 hover:scale-105 active:scale-95 transition-all shadow-xl",
                    isFollowing(currentTrack.artistId || '') ? "bg-white text-black border-white" : "text-white border-white/30 hover:border-white"
                  )}
                >
                  {isFollowing(currentTrack.artistId || '') ? 'Đang theo dõi' : 'Theo dõi'}
                </button>
              </div>

              {artist?.bio && (
                <p className="text-sm text-[#b3b3b3] line-clamp-3 leading-6 font-medium">
                  {artist.bio}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Footer Credit */}
        <div className="p-4 mb-4">
          <div className="bg-[#242424] p-4 rounded-xl border border-white/5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold">Thành phẩm</span>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between group cursor-pointer">
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-white group-hover:underline">{currentTrack.artistName}</span>
                  <span className="text-xs text-[#b3b3b3]">Nghệ sĩ chính</span>
                </div>
                <button className={cn(
                  "text-xs font-bold px-3 py-1 rounded-full border transition-all",
                  isFollowing(currentTrack.artistId || '') ? "text-white border-[#727272]" : "text-white border-[#727272] hover:border-white"
                )}>
                  {isFollowing(currentTrack.artistId || '') ? 'Đang theo dõi' : 'Theo dõi'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};