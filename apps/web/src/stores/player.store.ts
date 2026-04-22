import { create } from 'zustand';
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
  isProcessingNext: boolean;
  
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
  isProcessingNext: false,

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
        }, 200);
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
        const errorTrackId = track.id;
        console.error('Lỗi load audio, tự động chuyển bài sau 1.5s...');
        set({ isPlaying: false });
        // Chỉ tự động chuyển bài nếu sau 1.5s User vẫn đang ở đúng bài lỗi đó
        setTimeout(() => {
          if (get().currentTrack?.id === errorTrackId) {
            get().nextTrack();
          }
        }, 1500);
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

    // SOCIAL: Thông báo cho server để broadcast tới bạn bè
    socketService.emit('player:play', {
      songId: track.id,
      title: track.title,
      artistName: track.artistName,
      coverUrl: track.coverUrl,
      position: 0
    });
  },

  pause: () => {
    const { _howl, progress } = get();
    if (_howl) {
      _howl.pause();
      // SOCIAL: Thông báo tạm dừng
      socketService.emit('player:pause', { position: progress });
    }
  },

  resume: () => {
    const { _howl, currentTrack, progress } = get();
    if (_howl && currentTrack) {
      _howl.play();
      // SOCIAL: Thông báo phát lại
      socketService.emit('player:play', {
        songId: currentTrack.id,
        title: currentTrack.title,
        artistName: currentTrack.artistName,
        coverUrl: currentTrack.coverUrl,
        position: progress
      });
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

  nextTrack: async () => {
    const state = get();
    if (state.isProcessingNext) return;

    set({ isProcessingNext: true });

    try {
      const { currentIndex, queue, playTrack, repeatMode } = get();
      
      if (currentIndex < queue.length - 1) {
        playTrack(currentIndex + 1);
      } else if (repeatMode === 'all' && queue.length > 0) {
        playTrack(0);
      } else {
        // Hết queue -> Dừng nhạc (Không gọi Radio nữa)
        get().pause();
        set({ progress: 0 });
      }
    } catch (error) {
      console.error('Lỗi khi chuyển bài:', error);
      get().pause();
      set({ progress: 0 });
    } finally {
      set({ isProcessingNext: false });
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
