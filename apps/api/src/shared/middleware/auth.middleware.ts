import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AppError, ErrorCodes } from '../utils/app-error';
import { Role } from '@prisma/client';

// Mở rộng Express Request để thêm user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: Role;
        jti?: string;
        exp?: number;
      };
    }
  }
}

interface JwtPayload {
  sub: string;
  role: Role;
  jti?: string;
  iat: number;
  exp: number;
}

// Middleware xác thực JWT Access Token
export const authMiddleware = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('Chưa xác thực', 401, ErrorCodes.UNAUTHORIZED));
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload;
    req.user = { id: payload.sub, role: payload.role, jti: payload.jti, exp: payload.exp };
    next();
  } catch {
    next(new AppError('Token không hợp lệ hoặc đã hết hạn', 401, ErrorCodes.TOKEN_EXPIRED));
  }
};

// Middleware phân quyền theo role
export const authorize = (...roles: Role[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError('Chưa xác thực', 401, ErrorCodes.UNAUTHORIZED));
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError('Không có quyền truy cập', 403, ErrorCodes.FORBIDDEN));
    }

    next();
  };
};

export const authenticate = authMiddleware;

// Middleware auth tùy chọn – gắn user nếu có token, không block nếu không có
export const optionalAuthMiddleware = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(); // Không có token → tiếp tục mà không gắn user
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload;
    req.user = { id: payload.sub, role: payload.role, jti: payload.jti, exp: payload.exp };
  } catch {
    // Token lỗi → bỏ qua, tiếp tục như anonymous
  }
  next();
};
