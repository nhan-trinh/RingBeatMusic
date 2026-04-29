import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Howl } from 'howler';
import { api } from '../lib/api';
import { socketService } from '../lib/socket';

export interface Track {
  id: string;
  title: string;
  artistName: string;
  artistId?: string;
  coverUrl: string;
  audioUrl: string;
  canvasUrl?: string;
  duration: number; // in seconds
}

interface PlayerState {
  currentTrack: Track | null;
  
  // Advanced Queue System
  manualQueue: Track[];   // User-added songs (Play Next / Add to Queue)
  contextQueue: Track[];  // Songs from current Album/Playlist
  contextIndex: number;   // Current position in context queue
  
  isPlaying: boolean;
  volume: number;
  progress: number;
  duration: number;
  isShuffle: boolean;
  repeatMode: 'off' | 'all' | 'one';
  
  originalContextQueue: Track[]; // For un-shuffling
  currentContextId: string | null;
  _howl: Howl | null;
  hasRecordedPlay: boolean;
  isProcessingNext: boolean;
  initPlayer: () => void;

  // Actions
  setContextAndPlay: (tracks: Track[], startIndex?: number, contextId?: string) => void;
  addToManualQueue: (track: Track, atFront?: boolean) => void;
  removeFromManualQueue: (index: number) => void;
  clearManualQueue: () => void;
  moveManualQueueTrack: (fromIndex: number, toIndex: number) => void;
  
  playTrack: (track: Track, isFromManual?: boolean) => void;
  nextTrack: () => void;
  prevTrack: () => void;
  
  pause: () => void;
  resume: () => void;
  togglePlay: () => void;
  setVolume: (v: number) => void;
  seek: (time: number) => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  updateProgress: () => void;
}

let progressInterval: any;

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set, get) => ({
  currentTrack: null,
  manualQueue: [],
  contextQueue: [],
  contextIndex: -1,
  isPlaying: false,
  volume: 0.5,
  progress: 0,
  duration: 0,
  isShuffle: false,
  repeatMode: 'off',
  originalContextQueue: [],
  currentContextId: null,
  _howl: null,
  hasRecordedPlay: false,
  isProcessingNext: false,

  updateProgress: () => {
    const { _howl, isPlaying, currentTrack, hasRecordedPlay } = get();
    if (_howl && isPlaying) {
      const currentProgress = _howl.seek() as number;
      set({ progress: currentProgress });
      if (currentProgress > 30 && !hasRecordedPlay && currentTrack) {
        set({ hasRecordedPlay: true });
        api.post(`/songs/${currentTrack.id}/play`).catch(() => {});
      }
    }
  },

  setContextAndPlay: (tracks, startIndex = 0, contextId) => {
    set({ 
      contextQueue: tracks, 
      originalContextQueue: [...tracks], 
      isShuffle: false, 
      currentContextId: contextId || null,
      contextIndex: startIndex
    });
    if (tracks.length > 0) {
      get().playTrack(tracks[startIndex]);
    }
  },

  addToManualQueue: (track, atFront = false) => {
    const { manualQueue } = get();
    // Tránh trùng lặp bài đang trong manual queue nếu sếp muốn (tùy sếp, Spotify cho phép trùng)
    const newQueue = atFront ? [track, ...manualQueue] : [...manualQueue, track];
    set({ manualQueue: newQueue });
  },

  removeFromManualQueue: (index) => {
    const { manualQueue } = get();
    const newQueue = [...manualQueue];
    newQueue.splice(index, 1);
    set({ manualQueue: newQueue });
  },

  clearManualQueue: () => set({ manualQueue: [] }),

  moveManualQueueTrack: (fromIndex, toIndex) => {
    const { manualQueue } = get();
    const newQueue = [...manualQueue];
    const [moved] = newQueue.splice(fromIndex, 1);
    newQueue.splice(toIndex, 0, moved);
    set({ manualQueue: newQueue });
  },

  playTrack: (track) => {
    const { _howl, volume } = get();
    if (_howl) _howl.unload();
    if (progressInterval) clearInterval(progressInterval);

    const sound = new Howl({
      src: [track.audioUrl],
      html5: true,
      volume,
      onplay: () => {
        set({ isPlaying: true, duration: sound.duration() });
        progressInterval = setInterval(() => get().updateProgress(), 200);
      },
      onpause: () => set({ isPlaying: false }),
      onend: () => {
        const { repeatMode, _howl } = get();
        if (repeatMode === 'one' && _howl) {
          _howl.seek(0);
          _howl.play();
        } else {
          set({ isPlaying: false });
          clearInterval(progressInterval);
          get().nextTrack();
        }
      },
      onloaderror: () => {
        console.error('Lỗi load audio, chuyển bài...');
        setTimeout(() => get().nextTrack(), 1500);
      }
    });

    set({
      _howl: sound,
      currentTrack: track,
      progress: 0,
      duration: track.duration || 0,
      hasRecordedPlay: false,
    });

    sound.play();

    socketService.emit('player:play', {
      songId: track.id,
      title: track.title,
      artistName: track.artistName,
      coverUrl: track.coverUrl,
      position: 0
    });
  },

  initPlayer: () => {
    const { currentTrack, volume, progress, _howl } = get();
    if (!currentTrack || _howl) return;

    const sound = new Howl({
      src: [currentTrack.audioUrl],
      html5: true,
      volume,
      onplay: () => {
        set({ isPlaying: true, duration: sound.duration() });
        progressInterval = setInterval(() => get().updateProgress(), 200);
      },
      onpause: () => set({ isPlaying: false }),
      onend: () => {
        const { repeatMode, _howl } = get();
        if (repeatMode === 'one' && _howl) {
          _howl.seek(0);
          _howl.play();
        } else {
          set({ isPlaying: false });
          clearInterval(progressInterval);
          get().nextTrack();
        }
      },
    });

    sound.seek(progress);
    set({ _howl: sound, duration: currentTrack.duration || 0 });
  },

  nextTrack: () => {
    const { manualQueue, contextQueue, contextIndex, repeatMode, isProcessingNext } = get();
    if (isProcessingNext) return;
    set({ isProcessingNext: true });

    try {
      // 1. Ưu tiên Manual Queue
      if (manualQueue.length > 0) {
        const nextFromManual = manualQueue[0];
        const remainingManual = manualQueue.slice(1);
        set({ manualQueue: remainingManual });
        get().playTrack(nextFromManual, true);
        return;
      }

      // 2. Chuyển sang Context Queue
      if (contextIndex < contextQueue.length - 1) {
        const nextIndex = contextIndex + 1;
        set({ contextIndex: nextIndex });
        get().playTrack(contextQueue[nextIndex]);
      } else if (repeatMode === 'all' && contextQueue.length > 0) {
        set({ contextIndex: 0 });
        get().playTrack(contextQueue[0]);
      } else {
        get().pause();
        set({ progress: 0 });
      }
    } finally {
      set({ isProcessingNext: false });
    }
  },

  prevTrack: () => {
    const { contextIndex, progress, contextQueue, repeatMode, seek } = get();
    if (progress > 3) {
      seek(0);
    } else if (contextIndex > 0) {
      const nextIndex = contextIndex - 1;
      set({ contextIndex: nextIndex });
      get().playTrack(contextQueue[nextIndex]);
    } else if (repeatMode === 'all' && contextQueue.length > 0) {
      const nextIndex = contextQueue.length - 1;
      set({ contextIndex: nextIndex });
      get().playTrack(contextQueue[nextIndex]);
    } else {
      seek(0);
    }
  },

  pause: () => {
    const { _howl, progress } = get();
    if (_howl) {
      _howl.pause();
      socketService.emit('player:pause', { position: progress });
    }
  },

  resume: () => {
    const { _howl, currentTrack, progress } = get();
    if (_howl && currentTrack) {
      _howl.play();
      socketService.emit('player:play', {
        songId: currentTrack.id,
        title: currentTrack.title,
        artistName: currentTrack.artistName,
        coverUrl: currentTrack.coverUrl,
        position: progress
      });
    }
  },

  togglePlay: () => get().isPlaying ? get().pause() : get().resume(),

  setVolume: (v) => {
    const { _howl } = get();
    if (_howl) _howl.volume(v);
    set({ volume: v });
  },

  seek: (time) => {
    const { _howl } = get();
    if (_howl) {
      _howl.seek(time);
      set({ progress: time });
    }
  },

  toggleShuffle: () => {
    const { isShuffle, originalContextQueue, currentTrack, contextQueue } = get();
    if (isShuffle) {
      const newIndex = currentTrack ? originalContextQueue.findIndex(t => t.id === currentTrack.id) : 0;
      set({ isShuffle: false, contextQueue: originalContextQueue, contextIndex: newIndex });
    } else {
      const shuffled = [...contextQueue].sort(() => Math.random() - 0.5);
      if (currentTrack) {
        const filtered = shuffled.filter(t => t.id !== currentTrack.id);
        const newQueue = [currentTrack, ...filtered];
        set({ isShuffle: true, contextQueue: newQueue, contextIndex: 0 });
      } else {
        set({ isShuffle: true, contextQueue: shuffled, contextIndex: 0 });
      }
    }
  },

    toggleRepeat: () => {
      const { repeatMode } = get();
      const nextMode = repeatMode === 'off' ? 'all' : repeatMode === 'all' ? 'one' : 'off';
      set({ repeatMode: nextMode });
    },
  }),
  {
    name: 'ringbeat-player-storage',
    partialize: (state) => ({
      currentTrack: state.currentTrack,
      manualQueue: state.manualQueue,
      contextQueue: state.contextQueue,
      contextIndex: state.contextIndex,
      volume: state.volume,
      progress: state.progress,
      isShuffle: state.isShuffle,
      repeatMode: state.repeatMode,
      originalContextQueue: state.originalContextQueue,
      currentContextId: state.currentContextId,
    }),
  }
));
