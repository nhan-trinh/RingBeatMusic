import { usePlayerStore } from '../../stores/player.store';
import { Play, Pause } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface RecentCardProps {
  id: string;
  title: string;
  coverUrl: string;
  songs?: any[];
  isSong?: boolean;
  type?: 'artist' | 'album' | 'playlist' | 'song';
}

export const RecentCard = ({ id, title, coverUrl, songs = [], isSong = false, type = 'playlist' }: RecentCardProps) => {
  const { setContextAndPlay, currentContextId, isPlaying, togglePlay } = usePlayerStore();
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();

  const isThisPlaying = currentContextId === id && isPlaying;

  const handlePlayClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (songs.length === 0) return;
    if (currentContextId === id) {
      togglePlay();
    } else {
      setContextAndPlay(songs, 0, id);
    }
  };

  const handleCardClick = () => {
    if (type === 'artist') {
      navigate(`/artist/${id}`);
    } else if (type === 'album') {
      navigate(`/album/${id}`);
    } else if (type === 'song') {
      if (songs.length > 0) {
        setContextAndPlay(songs, 0, id);
      } else {
        navigate(`/track/${id}`);
      }
    } else {
      navigate(`/playlist/${id}`);
    }
  };

  return (
    <div 
      data-id={id}
      onClick={handleCardClick}
      className="bg-white/10 hover:bg-white/20 flex items-center rounded overflow-hidden transition-colors cursor-pointer group pr-4"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <img 
        src={coverUrl} 
        alt={title} 
        className={cn(
          "w-12 h-12 md:w-16 md:h-16 object-cover shadow-[0_8px_24px_rgba(0,0,0,0.5)]",
          type === 'artist' ? "rounded-full p-2" : "rounded-none"
        )} 
      />
      
      <div className="flex-1 px-4 truncate">
        <h3 className="text-white font-bold text-[15px] truncate">{title}</h3>
      </div>
      
      {/* Nút play nhỏ hơn xíu */}
      <button 
        onClick={handlePlayClick}
        className={cn(
          "w-10 h-10 flex items-center justify-center flex-shrink-0 rounded-full bg-[#1db954] text-black shadow-xl hover:scale-105 hover:bg-[#1ed760] transition-all duration-300",
          (isHovered || isThisPlaying) ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
      >
        {isThisPlaying ? <Pause size={20} className="fill-current" /> : <Play size={20} className="fill-current ml-1" />}
      </button>
    </div>
  );
};
