import { Router } from 'express';
import { playlistController } from './playlist.controller';
import { authMiddleware, optionalAuthMiddleware } from '../../shared/middleware/auth.middleware';
import { validateRequest } from '../../shared/middleware/validate.middleware';
import { 
  createPlaylistSchema, 
  updatePlaylistSchema, 
  addSongSchema, 
  reorderSongsSchema 
} from './playlist.schema';

export const playlistRouter = Router();

// GET /:id dùng optionalAuth – public playlist trợ được, private chỉ được nếu owner
playlistRouter.get('/:id', optionalAuthMiddleware, playlistController.getDetails);

// Protected (Yêu cầu đăng nhập)
playlistRouter.use(authMiddleware);

playlistRouter.get('/', playlistController.getMine);
playlistRouter.post('/', validateRequest(createPlaylistSchema), playlistController.create);
playlistRouter.post('/hide-song', playlistController.hideSong); // Phải đặt trên :id để ko bị bắt nhầm tham số

playlistRouter.patch('/:id', validateRequest(updatePlaylistSchema), playlistController.update);
playlistRouter.delete('/:id', playlistController.delete);

// Cập nhật quan hệ bài hát và playlist
playlistRouter.post('/:id/songs', validateRequest(addSongSchema), playlistController.addSong);
playlistRouter.delete('/:id/songs/:songId', playlistController.removeSong);
playlistRouter.patch('/:id/songs/reorder', validateRequest(reorderSongsSchema), playlistController.reorderSongs);

// Follow / Unfollow playlist
playlistRouter.post('/:id/follow', playlistController.follow);
playlistRouter.delete('/:id/follow', playlistController.unfollow);
