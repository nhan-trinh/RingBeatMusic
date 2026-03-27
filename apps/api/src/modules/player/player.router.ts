import { Router } from 'express';
import { playerController } from './player.controller';
import { authMiddleware } from '../../shared/middleware/auth.middleware';

export const playerRouter = Router();

playerRouter.use(authMiddleware);

// MongoDB Logs
playerRouter.post('/play-count', playerController.recordPlay);
playerRouter.get('/history', playerController.getHistory);
playerRouter.get('/recently-played', playerController.getRecentlyPlayed);

// Redis Queue
playerRouter.get('/queue', playerController.getQueue);
playerRouter.post('/queue', playerController.updateQueue); 

// Skip Control (Dành cho Web Player tự kiểm soát luồng)
playerRouter.get('/check-skip', playerController.checkSkipLimit);
