import { Router } from 'express';
import { artistController } from './artist.controller';
import { authMiddleware } from '../../shared/middleware/auth.middleware';
import { authorize } from '../../shared/middleware/auth.middleware';
import { validateRequest } from '../../shared/middleware/validate.middleware';
import { updateArtistSchema } from './artist.schema';

export const artistRouter = Router();

// Public routes (không cần đăng nhập hoặc chung)
artistRouter.get('/', artistController.getAll);
artistRouter.get('/:id', artistController.getProfile);

// Protected routes cho ARTIST
artistRouter.use(authMiddleware);
artistRouter.use(authorize('ARTIST'));

artistRouter.patch('/me', validateRequest(updateArtistSchema), artistController.updateProfile);
artistRouter.get('/me/analytics', artistController.getAnalytics);
artistRouter.get('/me/songs', artistController.getMySongs);
artistRouter.get('/me/albums', artistController.getMyAlbums);
// Verified Badge request
artistRouter.post('/request-verify', artistController.requestVerification);

// Social Follow
artistRouter.post('/:id/follow', artistController.followArtist);
artistRouter.delete('/:id/follow', artistController.unfollowArtist);
