import { Router } from 'express';
import { homeController } from './home.controller';
import { optionalAuthMiddleware } from '../../shared/middleware/auth.middleware';

export const homeRouter = Router();

// Publicly available mock route (nhưng nếu có token thì gắn vào user)
homeRouter.get('/feed', optionalAuthMiddleware, homeController.getFeed);
homeRouter.get('/personalized', optionalAuthMiddleware, homeController.getPersonalized);
homeRouter.get('/settings', homeController.getSettings);
