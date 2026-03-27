import { Router } from 'express';
import { albumController } from './album.controller';
import { authMiddleware, authorize } from '../../shared/middleware/auth.middleware';
import { validateRequest } from '../../shared/middleware/validate.middleware';
import { createAlbumSchema, updateAlbumSchema, addSongToAlbumSchema } from './album.schema';

export const albumRouter = Router();

// Public
albumRouter.get('/:id', albumController.getAlbum);

// Protected (ARTIST only cho thao tác tạo/sửa)
albumRouter.use(authMiddleware);

// Album CRUD by ARTIST
albumRouter.post('/', authorize('ARTIST'), validateRequest(createAlbumSchema), albumController.createAlbum);
albumRouter.patch('/:id', authorize('ARTIST', 'ADMIN'), validateRequest(updateAlbumSchema), albumController.updateAlbum);
albumRouter.delete('/:id', authorize('ARTIST', 'ADMIN'), albumController.deleteAlbum);

// Tính năng Social Follow
albumRouter.post('/:id/follow', albumController.followAlbum);
albumRouter.delete('/:id/follow', albumController.unfollowAlbum);

// Quan hệ Album - Song
albumRouter.post('/:id/songs', authorize('ARTIST'), validateRequest(addSongToAlbumSchema), albumController.addSong);
albumRouter.delete('/:id/songs/:songId', authorize('ARTIST'), albumController.removeSong);
