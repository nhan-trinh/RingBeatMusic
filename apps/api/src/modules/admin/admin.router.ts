import { Router } from 'express';
import { adminController } from './admin.controller';
import { authMiddleware, authorize } from '../../shared/middleware/auth.middleware';

export const adminRouter = Router();

adminRouter.use(authMiddleware);
adminRouter.use(authorize('ADMIN'));

// Users
adminRouter.get('/users', adminController.getUsers);
adminRouter.get('/users/:id', adminController.getUserById);
adminRouter.patch('/users/:id/role', adminController.changeRole);
adminRouter.post('/users/:id/ban', adminController.banUser);
adminRouter.post('/users/:id/unban', adminController.unbanUser);
adminRouter.post('/users/:id/reset-password', adminController.resetPassword);

// Content
adminRouter.get('/songs', adminController.getAllSongs);
adminRouter.delete('/songs/:id', adminController.deleteSong);
adminRouter.post('/artists/:id/verify', adminController.verifyArtist);
adminRouter.patch('/playlists/:id/feature', adminController.featurePlaylist);
adminRouter.patch('/playlists/:id/pin', adminController.pinPlaylist);

// Subscriptions / Payments
adminRouter.get('/subscriptions', adminController.getAllSubscriptions);
adminRouter.get('/payments', adminController.getAllPayments);
adminRouter.post('/payments/:id/refund', adminController.refundPayment);

// Audit
adminRouter.get('/audit-logs', adminController.getAuditLogs);

// Analytics
adminRouter.get('/analytics/overview', adminController.getOverview);
adminRouter.get('/analytics/top-songs', adminController.getTopSongs);
adminRouter.get('/analytics/top-artists', adminController.getTopArtists);
