import { Router } from 'express';
import { searchController } from './search.controller';
import { authMiddleware, authorize } from '../../shared/middleware/auth.middleware';

export const searchRouter = Router();

// Public routes
searchRouter.get('/', searchController.globalSearch);
searchRouter.get('/top-charts', searchController.getTopCharts);

// Protected routes
searchRouter.use(authMiddleware);
searchRouter.get('/discover-weekly', searchController.getDiscoverWeekly);

// Admin
searchRouter.post('/sync', authorize('ADMIN'), searchController.syncIndexes);
