import { Server, Socket } from 'socket.io';
import { socketAuthMiddleware } from './middleware/socket.auth';
import { registerPlayerHandlers } from './handlers/player.handler';

let io: Server;

export const initSocketServer = (socketIo: Server) => {
  io = socketIo;
  console.log('🔌 Socket.IO initialized');

  // Gắn Middleware xác thực JWT
  io.use(socketAuthMiddleware);

  io.on('connection', (socket: Socket) => {
    // Lưu lại user data từ middleware
    const user = (socket as any).user;
    
    // Tham gia room cá nhân dựa trên userId (để push thông báo đích danh)
    socket.join(`user:${user.id}`);
    console.log(`📡 Socket connected: [${socket.id}] - User: ${user.name}`);

    // Đăng ký các handler domain (vd: player sync)
    registerPlayerHandlers(io, socket, user);

    socket.on('disconnect', () => {
      console.log(`🔌 Socket disconnected: [${socket.id}]`);
    });
  });
};

/**
 * Lấy instance io để gửi thông báo từ các Service khác
 */
export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io chưa được khởi tạo!');
  }
  return io;
};
