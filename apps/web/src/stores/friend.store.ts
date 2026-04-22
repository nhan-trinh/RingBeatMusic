import { create } from 'zustand';
import { api } from '../lib/api';
import { socketService } from '../lib/socket';

interface FriendActivity {
  user: {
    id: string;
    name: string;
    avatarUrl: string;
  };
  currentSong: {
    id: string;
    title: string;
    artistName: string;
    coverUrl?: string;
  } | null;
  isPlaying: boolean;
  timestamp: number;
}

interface FriendState {
  activities: FriendActivity[];
  isLoading: boolean;
  fetchActivities: () => Promise<void>;
  updateActivity: (payload: any) => void;
  initialize: () => void;
}

export const useFriendStore = create<FriendState>((set, get) => ({
  activities: [],
  isLoading: false,

  fetchActivities: async () => {
    set({ isLoading: true });
    try {
      const res = await api.get('/users/following/activity') as any;
      set({ activities: res.data });
    } catch (err) {
      console.error('❌ Lỗi khi lấy hoạt động bạn bè:', err);
    } finally {
      set({ isLoading: false });
    }
  },

  updateActivity: (payload: any) => {
    const { activities } = get();
    const index = activities.findIndex(a => a.user.id === payload.userId);

    if (index !== -1) {
      const newActivities = [...activities];
      const current = newActivities[index];
      
      newActivities[index] = {
        ...current,
        // Nếu payload gửi object currentSong mới thì dùng, nếu không giữ cái cũ (với update isPlaying)
        currentSong: payload.currentSong !== undefined ? payload.currentSong : current.currentSong,
        isPlaying: payload.isPlaying !== undefined ? payload.isPlaying : current.isPlaying,
        timestamp: payload.timestamp || Date.now()
      };

      // Sắp xếp lại theo timestamp mới nhất
      newActivities.sort((a, b) => b.timestamp - a.timestamp);
      set({ activities: newActivities });
    } else {
      // Nếu là friend mới (có thể vừa follow), fetch lại danh sách để lấy full info
      get().fetchActivities();
    }
  },

  initialize: () => {
    // 1. Lấy dữ liệu ban đầu
    get().fetchActivities();

    // 2. Lắng nghe socket
    socketService.on('friend:activity_update', (payload: any) => {
      get().updateActivity(payload);
    });
  }
}));
