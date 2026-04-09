import { Request, Response } from 'express';
import { NotificationService } from './notification.service';
import { sendSuccess } from '../../shared/utils/response';
import { catchAsync } from '../../shared/utils/catch-async';

export const notificationController = {
  getNotifications: catchAsync(async (req: Request, res: Response) => {
    const user = req.user!;
    const result = await NotificationService.getNotifications(user.id, Number(req.query.page) || 1);
    sendSuccess(res, result);
  }),

  markAsRead: catchAsync(async (req: Request, res: Response) => {
    const user = req.user!;
    const result = await NotificationService.markAsRead(user.id, req.params.id);
    sendSuccess(res, result, 'Đã đánh dấu đọc');
  }),

  markAllAsRead: catchAsync(async (req: Request, res: Response) => {
    const user = req.user!;
    const result = await NotificationService.markAllAsRead(user.id);
    sendSuccess(res, result);
  }),

  getUnreadCount: catchAsync(async (req: Request, res: Response) => {
    const user = req.user!;
    const result = await NotificationService.getUnreadCount(user.id);
    sendSuccess(res, result);
  }),

  deleteNotification: catchAsync(async (req: Request, res: Response) => {
    const user = req.user!;
    const result = await NotificationService.deleteNotification(user.id, req.params.id);
    sendSuccess(res, result);
  }),
};
