import { Router } from 'express';
import { moderationController } from './moderation.controller';
import { authMiddleware } from '../../shared/middleware/auth.middleware';
import { authorize } from '../../shared/middleware/auth.middleware';

export const moderationRouter = Router();

moderationRouter.use(authMiddleware);
moderationRouter.use(authorize('MODERATOR', 'ADMIN'));

moderationRouter.get('/songs/pending', moderationController.getPendingSongs);
moderationRouter.post('/songs/:id/approve', moderationController.approveSong);
moderationRouter.post('/songs/:id/reject', moderationController.rejectSong);

moderationRouter.get('/reports', moderationController.getReports);
moderationRouter.post('/reports/:id/resolve', moderationController.resolveReport);
moderationRouter.post('/reports/:id/dismiss', moderationController.dismissReport);

moderationRouter.post('/users/:id/strike', moderationController.issueStrike);
