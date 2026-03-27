import { Router } from 'express';
import { notificationController } from './notification.controller';
import { authMiddleware } from '../../shared/middleware/auth.middleware';

export const notificationRouter = Router();

notificationRouter.use(authMiddleware);

notificationRouter.get('/', notificationController.getNotifications);
notificationRouter.get('/unread-count', notificationController.getUnreadCount);
notificationRouter.patch('/read-all', notificationController.markAllAsRead);
notificationRouter.patch('/:id/read', notificationController.markAsRead);
