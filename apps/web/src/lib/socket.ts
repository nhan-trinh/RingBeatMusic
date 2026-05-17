import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../stores/auth.store';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:3001';

class SocketService {
  private socket: Socket | null = null;

  connect() {
    const token = useAuthStore.getState().accessToken;

    if (!this.socket) {
      // Khởi tạo lần đầu
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
    } else {
      // Nếu đã có instance, kiểm tra xem token có đổi không
      const currentToken = (this.socket.auth as any)?.token;
      if (currentToken !== token) {
        // Cập nhật auth và reconnect trên CÙNG 1 instance để không mất các event listeners
        this.socket.auth = token ? { token } : {};
        this.socket.disconnect().connect();
      } else if (!this.socket.connected) {
        // Nếu bị ngắt kết nối trước đó thì connect lại
        this.socket.connect();
      }
    }
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

  off(event: string, callback?: (...args: any[]) => void) {
    this.socket?.off(event, callback);
  }

  emit(event: string, ...args: any[]) {
    this.socket?.emit(event, ...args);
  }
}

export const socketService = new SocketService();
