import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../stores/auth.store';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:3001';

class SocketService {
  private socket: Socket | null = null;

  connect() {
    if (this.socket?.connected) return;

    const token = useAuthStore.getState().accessToken;
    
    this.socket = io(SOCKET_URL, {
      auth: token ? { token } : {},
      withCredentials: true,
      transports: ['websocket'],
    });

    this.socket.on('connect', () => {
      // Ẩn log theo yêu cầu
    });

    this.socket.on('disconnect', () => {
      // Ẩn log theo yêu cầu
    });

    this.socket.on('connect_error', (err) => {
      console.error('❌ Socket connect error:', err.message);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getSocket() {
    return this.socket;
  }

  on(event: string, callback: (...args: any[]) => void) {
    this.socket?.on(event, callback);
  }

  off(event: string, callback: (...args: any[]) => void) {
    this.socket?.off(event, callback);
  }

  emit(event: string, ...args: any[]) {
    this.socket?.emit(event, ...args);
  }
}

export const socketService = new SocketService();
