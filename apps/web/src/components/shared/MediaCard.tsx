import { usePlayerStore } from '../../stores/player.store';
import { Play, Pause, X, Music2, Cpu, Zap } from 'lucide-react';
import { cn } from '../../lib/utils';
import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { SongContextMenu, useContextMenu } from './SongContextMenu';
import { PlaylistContextMenu, usePlaylistContextMenu } from './PlaylistContextMenu';
import { AlbumContextMenu, useAlbumContextMenu } from './AlbumContextMenu';
import { ArtistContextMenu, useArtistContextMenu } from './ArtistContextMenu';
import { useLibraryStore } from '../../stores/library.store';

interface MediaCardProps {
  id: string;
  title: string;
  subtitle: string;
  coverUrl: string;
  isCircle?: boolean;
  songs?: any[];
  type?: 'playlist' | 'album' | 'artist' | 'song' | 'profile';
  isPublic?: boolean;
  ownerId?: string;
  artistId?: string;
  artistName?: string;
  onRemove?: () => void;
}

// Tách riêng để memo hoạt động đúng
export const MediaCard = memo(({ id, title, subtitle, coverUrl, isCircle = false, songs = [], type = 'playlist', isPublic, ownerId, artistId, artistName, onRemove }: MediaCardProps) => {
  const { setContextAndPlay, currentContextId, isPlaying, togglePlay } = usePlayerStore();
  const navigate = useNavigate();
  const { updatePlaylist } = useLibraryStore();
  const { menu: songMenu, openMenu: openSongMenu, closeMenu: closeSongMenu } = useContextMenu();
  const { menu: playlistMenu, openPlaylistMenu, closePlaylistMenu } = usePlaylistContextMenu();
  const { menu: albumMenu, openAlbumMenu, closeAlbumMenu } = useAlbumContextMenu();
  const { menu: artistMenu, openArtistMenu, closeArtistMenu } = useArtistContextMenu();

  const isThisPlaying = currentContextId === id && isPlaying;

  const handlePlayClick = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (songs.length === 0) return;
    if (currentContextId === id) {
      togglePlay();
    } else {
      setContextAndPlay(songs, 0, id);
    }
  };

  const handleCardClick = () => {
    if (type === 'song') {
      if (songs && songs.length > 0) {
        setContextAndPlay(songs, 0, id);
      }
    } else if (type === 'artist') {
      navigate(`/artist/${id}`);
    } else if (type === 'album') {
      navigate(`/album/${id}`);
    } else if (type === 'profile') {
      navigate(`/profile/${id}`);
    } else {
      navigate(`/playlist/${id}`);
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    if (type === 'song' && songs && songs.length > 0) {
      openSongMenu(e, songs[0]);
    } else if (type === 'playlist') {
      openPlaylistMenu(e, { id, title, coverUrl, isPublic, ownerId: ownerId || '' });
    } else if (type === 'album') {
      openAlbumMenu(e, { id, title, artistId, artistName: artistName || subtitle });
    } else if (type === 'artist') {
      openArtistMenu(e, { id, name: title });
    }
  };

  return (
    <div
      onClick={handleCardClick}
      onContextMenu={handleContextMenu}
      className="bg-black p-3 flex flex-col border border-white/5 hover:border-white/20 transition-colors cursor-pointer group relative overflow-hidden will-change-auto"
    >
      <div className={cn(
        "relative mb-4 w-full pb-[100%] overflow-hidden bg-[#050505] border border-white/5",
        isCircle && "rounded-full"
      )}>
        {/* Technical Index Overlay */}
        <div className="absolute top-3 left-3 z-20 flex flex-col gap-0.5 pointer-events-none mix-blend-difference">
          <span className="text-[7px] font-black text-white/40 uppercase tracking-[0.3em]">REF_{id.slice(0, 6)}</span>
          <span className="text-[6px] font-black text-[#1db954] uppercase tracking-[0.2em]">{type}</span>
        </div>

        {/* Scanline Effect — CSS-only, không tốn JS */}
        <div className="absolute inset-0 z-10 opacity-0 group-hover:opacity-[0.15] pointer-events-none transition-opacity duration-300 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />

        {coverUrl ? (
          <img
            src={coverUrl}
            alt={title}
            loading="lazy"
            decoding="async"
            className={cn(
              "absolute top-0 left-0 w-full h-full object-cover transition-[filter,transform] duration-500",
              "grayscale group-hover:grayscale-0 group-hover:scale-105",
              isCircle && "p-2"
            )}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Music2 size={32} className="text-white/5" />
          </div>
        )}

        {/* Remove Button */}
        {onRemove && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onRemove();
            }}
            className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center bg-black/80 text-white hover:bg-white hover:text-black transition-all z-30 border border-white/10 opacity-0 group-hover:opacity-100"
          >
            <X size={14} />
          </button>
        )}

        {/* Play Button - Brutalist Block */}
        <button
          onClick={handlePlayClick}
          className={cn(
            "absolute bottom-0 right-0 w-12 h-12 flex items-center justify-center bg-[#1db954] text-black transition-transform duration-300 z-30 shadow-[-4px_-4px_0px_rgba(0,0,0,0.3)]",
            (isThisPlaying && songs.length > 0)
              ? "translate-y-0 translate-x-0"
              : "translate-y-full translate-x-full group-hover:translate-y-0 group-hover:translate-x-0"
          )}
        >
          {isThisPlaying ? <Pause size={20} className="fill-current" /> : <Play size={20} className="fill-current ml-0.5" />}
        </button>

        {/* Industrial Corner Decor */}
        <div className="absolute bottom-2 left-2 flex gap-1 items-center z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
           <Cpu size={8} className="text-[#1db954]" />
           <Zap size={8} className="text-white/20" />
        </div>
      </div>

      <div className="flex flex-col gap-1 min-w-0 relative">
        <h3 className={cn(
          "font-black uppercase tracking-tighter truncate text-[13px] leading-tight transition-colors",
          isThisPlaying ? "text-[#1db954]" : "text-white"
        )}>
          {title}
        </h3>
        <div className="flex items-center justify-between overflow-hidden">
           <p className="text-white/20 text-[8px] font-black uppercase tracking-widest truncate max-w-[70%]">
             {subtitle}
           </p>
           <span className="text-[6px] font-black text-[#1db954] opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
             STABLE_SIGNAL
           </span>
        </div>
      </div>

      {/* Context Menus — rendered via portal, không ảnh hưởng layout */}
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

      {albumMenu && (
        <AlbumContextMenu
          album={albumMenu.album}
          position={albumMenu.position}
          onClose={closeAlbumMenu}
        />
      )}

      {artistMenu && (
        <ArtistContextMenu
          artist={artistMenu.artist}
          position={artistMenu.position}
          onClose={closeArtistMenu}
        />
      )}
    </div>
  );
});

MediaCard.displayName = 'MediaCard';
