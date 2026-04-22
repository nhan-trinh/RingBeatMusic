import { useUIStore } from '../../stores/ui.store';
import { useFriendStore } from '../../stores/friend.store';
import { X, Users, Music2, Clock, Headphones } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

const Equalizer = () => (
  <div className="flex items-end gap-[2px] h-3 w-3 mb-0.5">
    <div className="equalizer-bar h-full" />
    <div className="equalizer-bar h-full" />
    <div className="equalizer-bar h-full" />
    <div className="equalizer-bar h-full" />
  </div>
);

export const FriendActivitySidebar = () => {
  const { isFriendActivityVisible, setFriendActivityVisible } = useUIStore();
  const { activities, isLoading } = useFriendStore();

  if (!isFriendActivityVisible) return null;

  return (
    <aside className="w-[300px] flex-shrink-0 bg-black flex flex-col h-full border-l border-white/5 animate-in fade-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-white/5">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <Users size={18} className="text-[#1db954]" />
          Friend Activity
        </h2>
        <button
          onClick={() => setFriendActivityVisible(false)}
          className="p-1 text-[#b3b3b3] hover:text-white transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
        {isLoading && activities.length === 0 ? (
          <div className="flex flex-col gap-4 p-2">
             {[1,2,3,4].map(i => (
               <div key={i} className="animate-pulse flex items-center gap-3">
                 <div className="w-12 h-12 rounded-full bg-white/10" />
                 <div className="flex-1 space-y-2">
                   <div className="h-3 bg-white/10 rounded w-2/3" />
                   <div className="h-2 bg-white/10 rounded w-1/2" />
                 </div>
               </div>
             ))}
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-12 space-y-4 px-4 bg-white/5 rounded-xl mx-2 mt-4">
            <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center mx-auto text-[#b3b3b3]">
               <Users size={28} />
            </div>
            <p className="text-xs text-[#b3b3b3] leading-relaxed">
              Theo dõi bạn bè để cùng nhau khám phá những giai điệu mới.
            </p>
            <Link 
              to="/search" 
              className="inline-block px-5 py-2 bg-white text-black rounded-full text-xs font-bold hover:scale-105 transition-all active:scale-95"
            >
              Tìm kiếm bạn bè
            </Link>
          </div>
        ) : (
          activities.map((activity) => (
            <div 
              key={activity.user.id} 
              className="group flex gap-3 p-3 rounded-lg glass-hover relative cursor-pointer overflow-hidden"
            >
              {/* Avatar Wrapper */}
              <div className="relative shrink-0">
                <Link to={`/profile/${activity.user.id}`} className="block relative">
                  <img
                    src={activity.user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(activity.user.name)}&background=random`}
                    alt={activity.user.name}
                    className="w-12 h-12 rounded-full object-cover ring-2 ring-transparent group-hover:ring-[#1db954]/50 transition-all duration-300"
                  />
                  {/* Playing Signal */}
                  {activity.isPlaying && (
                    <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center animate-in fade-in duration-300">
                      <Equalizer />
                    </div>
                  )}
                  {/* Status Dot */}
                  <div className={cn(
                    "absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-black transition-colors duration-300",
                    activity.isPlaying ? "bg-[#1db954]" : "bg-[#7f7f7f]"
                  )} />
                </Link>
              </div>

              {/* Info Area */}
              <div className="flex-1 min-w-0 flex flex-col justify-center">
                <div className="flex items-center justify-between gap-1 mb-0.5">
                  <Link 
                    to={`/profile/${activity.user.id}`}
                    className="text-[13px] font-bold text-white hover:text-[#1db954] transition-colors truncate"
                  >
                    {activity.user.name}
                  </Link>
                  <span className="text-[10px] text-[#b3b3b3] shrink-0 font-medium">
                    {formatDistanceToNow(activity.timestamp, { addSuffix: false, locale: vi })}
                  </span>
                </div>

                {activity.currentSong ? (
                  <div className="flex items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "text-[11px] font-medium truncate flex items-center gap-1.5 transition-colors",
                        activity.isPlaying ? "text-white" : "text-[#b3b3b3]"
                      )}>
                        {activity.isPlaying ? (
                          <Headphones size={12} className="text-[#1db954] shrink-0" />
                        ) : (
                          <Music2 size={12} className="shrink-0" />
                        )}
                        <span className="truncate">{activity.currentSong.title}</span>
                      </p>
                      <p className="text-[11px] text-[#b3b3b3] truncate pl-3.5 mt-0.5 group-hover:text-white/70 transition-colors">
                        {activity.currentSong.artistName}
                      </p>
                    </div>
                    {/* Song Cover Thumbnail */}
                    {activity.currentSong.coverUrl && (
                      <div className="shrink-0 w-8 h-8 rounded bg-white/5 overflow-hidden shadow-lg border border-white/5 group-hover:border-white/20 transition-all">
                        <img 
                          src={activity.currentSong.coverUrl} 
                          alt={activity.currentSong.title} 
                          className="w-full h-full object-cover grayscale-[0.3] group-hover:grayscale-0 transition-all"
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-[11px] text-[#b3b3b3] italic flex items-center gap-1.5">
                     <Clock size={11} className="opacity-50" />
                     Vừa hoạt động
                  </p>
                )}
              </div>

              {/* Subtle accent line */}
              <div className="absolute left-0 top-1/4 bottom-1/4 w-0.5 bg-[#1db954] scale-y-0 group-hover:scale-y-100 transition-transform duration-300 origin-center" />
            </div>
          ))
        )}
      </div>
      
      {/* Footer / Hint */}
      <div className="p-4 pt-2 border-t border-white/5">
        <p className="text-[10px] text-[#535353] text-center italic">
          Khám phá gu âm nhạc của bạn bè
        </p>
      </div>
    </aside>
  );
};
