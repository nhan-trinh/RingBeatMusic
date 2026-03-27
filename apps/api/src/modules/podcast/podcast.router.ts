import { Router } from 'express';
import { podcastController } from './podcast.controller';
import { authMiddleware, authorize } from '../../shared/middleware/auth.middleware';

export const podcastRouter = Router();

// Public
podcastRouter.get('/shows', podcastController.listShows);
podcastRouter.get('/shows/:id', podcastController.getShow);
podcastRouter.get('/episodes/:id', podcastController.getEpisode);

// Auth required
podcastRouter.use(authMiddleware);

podcastRouter.post('/shows/:id/subscribe', podcastController.subscribe);
podcastRouter.delete('/shows/:id/subscribe', podcastController.unsubscribe);
podcastRouter.get('/episodes/:id/stream', podcastController.streamEpisode);
podcastRouter.get('/me/analytics', podcastController.getAnalytics);

// Podcast Host only
podcastRouter.post('/shows', authorize('PODCAST_HOST', 'ADMIN'), podcastController.createShow);
podcastRouter.patch('/shows/:id', authorize('PODCAST_HOST', 'ADMIN'), podcastController.updateShow);
podcastRouter.post('/shows/:showId/episodes', authorize('PODCAST_HOST', 'ADMIN'), podcastController.createEpisode);
podcastRouter.patch('/episodes/:id', authorize('PODCAST_HOST', 'ADMIN'), podcastController.updateEpisode);
podcastRouter.delete('/episodes/:id', authorize('PODCAST_HOST', 'ADMIN'), podcastController.deleteEpisode);
