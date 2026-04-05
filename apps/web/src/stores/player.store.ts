import { create } from 'zustand';
import { Howl } from 'howler';
import { api } from '../lib/api';

export interface Track {
  id: string;
  title: string;
  artistName: string;
  artistId?: string;
  coverUrl: string;
  audioUrl: string;
  duration: number; // in seconds
}

interface PlayerState {
  currentTrack: Track | null;
  currentIndex: number;
  queue: Track[];
  isPlaying: boolean;
  volume: number;
  progress: number;
  duration: number;
  isShuffle: boolean;
  repeatMode: 'off' | 'all' | 'one';
  originalQueue: Track[];
  currentContextId: string | null;
  _howl: Howl | null;
  hasRecordedPlay: boolean;
  
  setQueueAndPlay: (queue: Track[], startIndex?: number, contextId?: string) => void;
  playTrack: (index: number) => void;
  pause: () => void;
  resume: () => void;
  togglePlay: () => void;
  setVolume: (v: number) => void;
  seek: (time: number) => void;
  nextTrack: () => void;
  prevTrack: () => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  updateProgress: () => void;
}

let progressInterval: any;

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentTrack: null,
  currentIndex: -1,
  queue: [],
  isPlaying: false,
  volume: 0.5,
  progress: 0,
  duration: 0,
  isShuffle: false,
  repeatMode: 'off',
  originalQueue: [],
  currentContextId: null,
  _howl: null,
  hasRecordedPlay: false,

  updateProgress: () => {
    const { _howl, isPlaying, currentTrack, hasRecordedPlay } = get();
    if (_howl && isPlaying) {
      const currentProgress = _howl.seek() as number;
      set({ progress: currentProgress });

      // Ghi nhận lượt nghe nếu phát hơn 10 giây
      if (currentProgress > 10 && !hasRecordedPlay && currentTrack) {
        set({ hasRecordedPlay: true });
        api.post(`/songs/${currentTrack.id}/play`).catch(() => {});
      }
    }
  },

  setQueueAndPlay: (queue, startIndex = 0, contextId) => {
    set({ queue, originalQueue: [...queue], isShuffle: false, currentContextId: contextId || null });
    if (queue.length > 0) {
      get().playTrack(startIndex);
    }
  },

  playTrack: (index) => {
    const { queue, _howl, volume } = get();
    if (index < 0 || index >= queue.length) return;

    if (_howl) {
      _howl.unload(); // Dừng bài cũ
    }
    if (progressInterval) {
      clearInterval(progressInterval);
    }

    const track = queue[index];

    const sound = new Howl({
      src: [track.audioUrl],
      html5: true, // Bắt buộc html5 để load streaming, không phải chờ tải xong
      volume,
      onplay: () => {
        set({ isPlaying: true, duration: sound.duration() });
        progressInterval = setInterval(() => {
          get().updateProgress();
        }, 1000);
      },
      onpause: () => {
        set({ isPlaying: false });
      },
      onend: () => {
        const { repeatMode, nextTrack, _howl } = get();
        if (repeatMode === 'one' && _howl) {
          _howl.seek(0);
          _howl.play();
        } else {
          set({ isPlaying: false });
          clearInterval(progressInterval);
          nextTrack();
        }
      },
      onloaderror: () => {
        console.error('Lỗi load audio');
        set({ isPlaying: false });
      },
      onplayerror: () => {
        sound.once('unlock', function() {
          sound.play();
        });
      }
    });

    set({
      _howl: sound,
      currentTrack: track,
      currentIndex: index,
      progress: 0,
      duration: track.duration || 0,
      hasRecordedPlay: false,
    });

    sound.play();
  },

  pause: () => {
    const { _howl } = get();
    if (_howl) {
      _howl.pause();
    }
  },

  resume: () => {
    const { _howl } = get();
    if (_howl) {
      _howl.play();
    }
  },

  togglePlay: () => {
    const { isPlaying, resume, pause } = get();
    if (isPlaying) {
      pause();
    } else {
      resume();
    }
  },

  setVolume: (v) => {
    const { _howl } = get();
    if (_howl) {
      _howl.volume(v);
    }
    set({ volume: v });
  },

  seek: (time) => {
    const { _howl } = get();
    if (_howl) {
      _howl.seek(time);
      set({ progress: time });
    }
  },

  nextTrack: () => {
    const { currentIndex, queue, playTrack, repeatMode } = get();
    if (currentIndex < queue.length - 1) {
      playTrack(currentIndex + 1);
    } else {
      if (repeatMode === 'all') {
        playTrack(0);
      } else {
        get().pause();
        set({ progress: 0 });
      }
    }
  },

  prevTrack: () => {
    const { currentIndex, progress, playTrack, seek, queue, repeatMode } = get();
    if (progress > 3) {
      seek(0);
    } else if (currentIndex > 0) {
      playTrack(currentIndex - 1);
    } else if (repeatMode === 'all') {
      playTrack(queue.length - 1);
    } else {
      seek(0);
    }
  },

  toggleShuffle: () => {
    const { isShuffle, originalQueue, currentTrack, queue } = get();
    if (isShuffle) {
      // Turn OFF shuffle
      // Revert to originalQueue, find where the current song is
      const newIndex = currentTrack ? originalQueue.findIndex(t => t.id === currentTrack.id) : 0;
      set({ isShuffle: false, queue: originalQueue, currentIndex: newIndex });
    } else {
      // Turn ON shuffle
      const shuffled = [...queue].sort(() => Math.random() - 0.5);
      // Giữ bài hiện tại lên đầu tiên của list shuffle
      if (currentTrack) {
        const filtered = shuffled.filter(t => t.id !== currentTrack.id);
        const newQueue = [currentTrack, ...filtered];
        set({ isShuffle: true, queue: newQueue, currentIndex: 0 });
      } else {
        set({ isShuffle: true, queue: shuffled });
      }
    }
  },

  toggleRepeat: () => {
    const { repeatMode } = get();
    const nextMode = repeatMode === 'off' ? 'all' : repeatMode === 'all' ? 'one' : 'off';
    set({ repeatMode: nextMode });
  },
}));
