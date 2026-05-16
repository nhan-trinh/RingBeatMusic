import { Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';

export const socketAuthMiddleware = (socket: Socket, next: (err?: Error) => void) => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.headers['authorization']?.split(' ')[1];

    if (!token) {
      // Cho phép khách kết nối để nhận các event công khai
      (socket as any).user = null;
      return next();
    }

    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as any;

    // Gắn thông tin vào socket để dùng sau này
    (socket as any).user = {
      id: decoded.sub, 
      role: decoded.role,
      name: decoded.name
    };

    next();
  } catch (error) {
    // Ngay cả khi token sai/hết hạn, vẫn cho phép kết nối như một khách (guest)
    (socket as any).user = null;
    next();
  }
};
