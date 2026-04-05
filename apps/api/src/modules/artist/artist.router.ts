import { Router } from 'express';
import { artistController } from './artist.controller';
import { authMiddleware, authorize } from '../../shared/middleware/auth.middleware';
import { validateRequest } from '../../shared/middleware/validate.middleware';
import { updateArtistSchema } from './artist.schema';
import multer from 'multer';

export const artistRouter = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB limit

// ─── PUBLIC (không cần đăng nhập) ─────────────────────────────────────────
artistRouter.get('/', artistController.getAll);

// ─── PROTECTED (cần đăng nhập) ────────────────────────────────────────────
artistRouter.use(authMiddleware);

// Setup profile cho artist mới (role ARTIST nhưng chưa có bản ghi Artist)
artistRouter.post('/setup-profile', authorize('ARTIST', 'ADMIN'), artistController.setupProfile);

// Upload avatar
artistRouter.post('/me/avatar', authorize('ARTIST', 'ADMIN'), upload.single('avatar'), artistController.uploadAvatar);

// /me routes phải đứng TRƯỚC /:id để tránh bị bắt nhầm
artistRouter.get('/me', authorize('ARTIST', 'ADMIN'), artistController.getMyProfile);
artistRouter.patch('/me', authorize('ARTIST', 'ADMIN'), validateRequest(updateArtistSchema), artistController.updateProfile);
artistRouter.get('/me/analytics', authorize('ARTIST', 'ADMIN'), artistController.getAnalytics);
artistRouter.get('/me/songs', authorize('ARTIST', 'ADMIN'), artistController.getMySongs);
artistRouter.get('/me/albums', authorize('ARTIST', 'ADMIN'), artistController.getMyAlbums);
artistRouter.post('/request-verify', authorize('ARTIST'), artistController.requestVerification);

// Social Follow – mọi user đã đăng nhập đều follow được
artistRouter.post('/:id/follow', artistController.followArtist);
artistRouter.delete('/:id/follow', artistController.unfollowArtist);

// Public profile (sau cùng để /:id không nuốt các route /me phía trên)
artistRouter.get('/:id', artistController.getProfile);
