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
          className={cn("px-4 pt-0 transition-all duration-300", currentTrack.canvasUrl && "p-0")}
          style={currentTrack.canvasUrl ? { aspectRatio: `${canvasDims.w} / ${canvasDims.h}` } : {}}
        >
          <div className={cn(
            "w-full relative group overflow-hidden",
            currentTrack.canvasUrl ? "h-full" : "aspect-square rounded-lg bg-white/5 shadow-2xl"
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
            <div className="h-48 w-full relative">
              <img 
                src={artist?.avatarUrl || currentTrack.coverUrl} 
                className="w-full h-full object-cover brightness-75 group-hover/card:scale-105 transition-transform duration-500" 
                alt="" 
              />
              <div className="absolute top-4 left-4">
                 <p className="text-[10px] font-bold uppercase tracking-widest text-white drop-shadow-md">Giới thiệu về nghệ sĩ</p>
              </div>
            </div>

            {/* Content info */}
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-bold text-base hover:underline cursor-pointer whitespace-nowrap overflow-hidden text-ellipsis max-w-[140px]">
                      {currentTrack.artistName}
                    </h3>
                    {artist?.isVerified && <CheckCircle2 size={16} className="text-[#3d91ff] fill-[#3d91ff] text-white" />}
                  </div>
                  <p className="text-sm text-[#b3b3b3]">{artist?.followersCount?.toLocaleString() || '0'} người theo dõi</p>
                </div>
                <button 
                  onClick={() => artist?.id && toggleFollow(artist.id, currentTrack.artistName)}
                  className={cn(
                    "text-xs font-bold px-4 py-1.5 rounded-full border border-[#727272] hover:scale-105 transition-all",
                    isFollowing(currentTrack.artistId || '') ? "bg-white text-black border-white" : "text-white border-[#727272] hover:border-white"
                  )}
                >
                  {isFollowing(currentTrack.artistId || '') ? 'Đang theo dõi' : 'Theo dõi'}
                </button>
              </div>

              {artist?.bio && (
                <p className="text-sm text-[#b3b3b3] line-clamp-3 leading-relaxed">
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
