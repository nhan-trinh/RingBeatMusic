import { Server, Socket } from 'socket.io';
import { socketAuthMiddleware } from './middleware/socket.auth';
import { registerPlayerHandlers } from './handlers/player.handler';

export const initSocketServer = (io: Server) => {
  console.log('🔌 Socket.IO initialized');

  // Gắn Middleware xác thực JWT
  io.use(socketAuthMiddleware);

  io.on('connection', (socket: Socket) => {
    // Lưu lại user data từ middleware
    const user = (socket as any).user;
    
    // Tham gia room cá nhân dựa trên userId (để sync đa thiết bị)
    socket.join(`user:${user.id}`);
    console.log(`📡 Socket connected: [${socket.id}] - User: ${user.name}`);

    // Đăng ký các handler domain
    registerPlayerHandlers(io, socket, user);

    socket.on('disconnect', () => {
      console.log(`🔌 Socket disconnected: [${socket.id}]`);
    });
  });
};
