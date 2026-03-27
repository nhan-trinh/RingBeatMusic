import { Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';

export const socketAuthMiddleware = (socket: Socket, next: (err?: Error) => void) => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.headers['authorization']?.split(' ')[1];

    if (!token) {
      return next(new Error('Authentication token is required'));
    }

    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as any;

    // Gắn thông tin vào socket để dùng sau này
    (socket as any).user = {
      id: decoded.id,
      role: decoded.role,
      name: decoded.name // or custom payloads
    };

    next();
  } catch (error) {
    next(new Error('Invalid or expired token'));
  }
};
