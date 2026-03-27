import { Request, Response, NextFunction, RequestHandler } from 'express';

// Wrapper để bắt lỗi (catch) tự động từ các route async
export const catchAsync = (fn: RequestHandler): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
