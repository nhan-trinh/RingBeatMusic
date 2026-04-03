import { Router } from 'express';
import { songController } from './song.controller';
import { authMiddleware, authorize } from '../../shared/middleware/auth.middleware';
import { validateRequest } from '../../shared/middleware/validate.middleware';
import { createSongSchema, streamSongSchema } from './song.schema';

export const songRouter = Router();

// Publicly available (but play tracking and streaming requires auth technically)
songRouter.get('/mock-queue', songController.getMockQueue);
songRouter.get('/', songController.getAll);
songRouter.get('/artist/:artistId', songController.getArtistSongs);

// Protected routes (Require login)
songRouter.use(authMiddleware);

songRouter.get('/:id/stream', validateRequest(streamSongSchema), songController.getStreamUrl);
songRouter.post('/:id/play', songController.recordPlay);
songRouter.post('/:id/like', songController.likeSong);
songRouter.delete('/:id/like', songController.unlikeSong);

// Quản lý riêng của ARTIST
songRouter.post('/', authorize('ARTIST'), validateRequest(createSongSchema), songController.createMetadata);
songRouter.post('/:id/upload-complete', authorize('ARTIST'), songController.uploadComplete);
