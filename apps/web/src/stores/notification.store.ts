import { create } from 'zustand';
import { api } from '../lib/api';
import { socketService } from '../lib/socket';
import { toast } from 'sonner';

export interface Notification {
  _id: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  isRead: boolean;
  createdAt: string;
}

interface NotificationStore {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  isInitialized: boolean;
  
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  addNotification: (n: Notification) => void;
  initialize: () => void;
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,
  isInitialized: false,

  fetchNotifications: async () => {
    set({ loading: true });
    try {
      const res: any = await api.get('/notifications');
      set({ 
        notifications: res.data.notifications, 
        unreadCount: res.data.unreadCount,
        loading: false 
      });
    } catch (error) {
      set({ loading: false });
    }
  },

  markAsRead: async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n._id === id ? { ...n, isRead: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  },

  markAllAsRead: async () => {
    try {
      await api.post('/notifications/read-all');
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
        unreadCount: 0,
      }));
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  },

  deleteNotification: async (id) => {
    try {
      await api.delete(`/notifications/${id}`);
      set((state) => ({
        notifications: state.notifications.filter((n) => n._id !== id),
        // Nếu xóa thông báo chưa đọc thì giảm count
        unreadCount: state.notifications.find(n => n._id === id)?.isRead 
          ? state.unreadCount 
          : Math.max(0, state.unreadCount - 1),
      }));
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  },

  addNotification: (n) => {
    set((state) => ({
      notifications: [n, ...state.notifications].slice(0, 50),
      unreadCount: state.unreadCount + 1,
    }));
    
    // Phát âm thanh hoặc rung nếu cần
    // Hiển thị Toast
    toast(n.title, {
      description: n.body,
      action: {
        label: "Xem",
        onClick: () => console.log("Navigate to notification data", n.data),
      },
    });
  },

  initialize: () => {
    // Luôn cố gắng connect socket trước
    socketService.connect();
    
    // Đảm bảo chỉ đăng ký listener một lần duy nhất
    if (get().isInitialized) return;
    
    const socket = socketService.getSocket();
    if (socket) {
      console.log('🔔 Đang đăng ký listener thông báo...');
      socket.on('new_notification', (n: Notification) => {
        console.log('📩 Nhận thông báo mới realtime:', n);
        get().addNotification(n);
      });
      set({ isInitialized: true });
    }
  }
}));
