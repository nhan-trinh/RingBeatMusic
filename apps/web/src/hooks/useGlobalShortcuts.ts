import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { usePlayerStore } from '../stores/player.store';
import { useUIStore } from '../stores/ui.store';

export const useGlobalShortcuts = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { 
    togglePlay, 
    nextTrack, 
    prevTrack, 
    seek, 
    progress, 
    volume, 
    setVolume,
    currentTrack
  } = usePlayerStore();
  const { toggleFullscreen } = useUIStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Bỏ qua nếu đang gõ trong input/textarea
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' || 
        target.tagName === 'TEXTAREA' || 
        target.isContentEditable
      ) {
        return;
      }

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          togglePlay();
          break;
        case 'KeyF':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'KeyL':
          e.preventDefault();
          if (currentTrack) {
            if (location.pathname.startsWith('/lyrics/')) {
              navigate(-1);
            } else {
              navigate(`/lyrics/${currentTrack.id}`);
            }
          }
          break;
        case 'KeyM':
          e.preventDefault();
          setVolume(volume === 0 ? 0.5 : 0);
          break;
        case 'ArrowRight':
          e.preventDefault();
          seek(Math.min(progress + 10, usePlayerStore.getState().duration));
          break;
        case 'ArrowLeft':
          e.preventDefault();
          seek(Math.max(progress - 10, 0));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setVolume(Math.min(volume + 0.1, 1));
          break;
        case 'ArrowDown':
          e.preventDefault();
          setVolume(Math.max(volume - 0.1, 0));
          break;
        case 'KeyJ': // Spotify dùng J/K cho prev/next trong một số mode
          e.preventDefault();
          prevTrack();
          break;
        case 'KeyK':
          e.preventDefault();
          nextTrack();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    togglePlay, 
    toggleFullscreen, 
    currentTrack, 
    navigate, 
    location.pathname, 
    volume, 
    setVolume, 
    progress, 
    seek, 
    prevTrack, 
    nextTrack
  ]);
};
