import { usePlayerStore } from '../../stores/player.store';
import { Play, Pause } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SongContextMenu, useContextMenu } from './SongContextMenu';
import { PlaylistContextMenu, usePlaylistContextMenu } from './PlaylistContextMenu';
import { useLibraryStore } from '../../stores/library.store';

interface MediaCardProps {
  id: string;
  title: string;
  subtitle: string;
  coverUrl: string;
  isCircle?: boolean;
  songs?: any[];
  type?: 'playlist' | 'album' | 'artist' | 'song';
  isPublic?: boolean;
  ownerId?: string;
}

export const MediaCard = ({ id, title, subtitle, coverUrl, isCircle = false, songs = [], type = 'playlist', isPublic, ownerId }: MediaCardProps) => {
  const { setQueueAndPlay, currentContextId, isPlaying, togglePlay } = usePlayerStore();
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();
  const { updatePlaylist } = useLibraryStore();
  const { menu: songMenu, openMenu: openSongMenu, closeMenu: closeSongMenu } = useContextMenu();
  const { menu: playlistMenu, openPlaylistMenu, closePlaylistMenu } = usePlaylistContextMenu();

  // Nhận diện theo ngữ cảnh Card Id
  const isThisPlaying = currentContextId === id && isPlaying;

  const handlePlayClick = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation(); // Không ăn click parent
    }
    if (songs.length === 0) return;

    // Nếu đang phát list này thì sang Pause
    if (currentContextId === id) {
      togglePlay();
    } else {
      setQueueAndPlay(songs, 0, id);
    }
  };

  const handleCardClick = () => {
    if (type === 'song') {
      if (songs && songs.length > 0) {
        setQueueAndPlay(songs, 0, id);
      }
    } else if (type === 'artist') {
      navigate(`/artist/${id}`);
    } else if (type === 'album') {
      navigate(`/album/${id}`);
    } else {
      navigate(`/playlist/${id}`);
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    if (type === 'song' && songs && songs.length > 0) {
      openSongMenu(e, songs[0]);
    } else if (type === 'playlist') {
      openPlaylistMenu(e, { id, title, coverUrl, isPublic, ownerId: ownerId || '' });
    }
  };

  return (
    <div
      data-id={id}
      onClick={handleCardClick}
      onContextMenu={handleContextMenu}
      className="hover:bg-[#282828] p-4 flex flex-col rounded-md transition-colors cursor-pointer group relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative mb-4 w-full pb-[100%] shadow-[0_8px_24px_rgba(0,0,0,0.5)]">
        <img
          src={coverUrl}
          alt={title}
          className={cn("absolute top-0 left-0 w-full h-full object-cover", isCircle ? "rounded-full" : "rounded flex-1")}
        />

        {/* Nút Play xanh lá thần thánh */}
        <button
          onClick={handlePlayClick}
          className={cn(
            "absolute bottom-2 right-2 w-12 h-12 flex items-center justify-center rounded-full bg-[#1db954] text-black shadow-xl hover:scale-105 hover:bg-[#1ed760] transition-all duration-300 z-10",
            // Nếu Spotify: Show nút khi hover VÀ kéo từ dưới lên (translate-y)
            (isHovered || isThisPlaying) ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"
          )}
        >
          {isThisPlaying ? <Pause size={24} className="fill-current" /> : <Play size={24} className="fill-current ml-1" />}
        </button>
      </div>

      <h3 className="text-white font-bold text-base truncate mb-1">{title}</h3>
      <p className="text-[#a7a7a7] text-sm font-medium line-clamp-2">{subtitle}</p>

      {songMenu && (
        <SongContextMenu 
          song={songMenu.song}
          position={songMenu.position}
          onClose={closeSongMenu}
          onPlay={() => handlePlayClick()}
        />
      )}

      {playlistMenu && (
        <PlaylistContextMenu 
          playlist={playlistMenu.playlist}
          position={playlistMenu.position}
          onClose={closePlaylistMenu}
          onRename={() => {
            const newTitle = prompt('Nhập tên mới cho playlist:', title);
            if (newTitle && newTitle.trim() && newTitle !== title) {
              updatePlaylist(id, { title: newTitle.trim() });
            }
          }}
        />
      )}
    </div>
  );
};
