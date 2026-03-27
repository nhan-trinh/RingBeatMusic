import { Router } from 'express';
import { playlistController } from './playlist.controller';
import { authMiddleware } from '../../shared/middleware/auth.middleware';
import { validateRequest } from '../../shared/middleware/validate.middleware';
import { 
  createPlaylistSchema, 
  updatePlaylistSchema, 
  addSongSchema, 
  reorderSongsSchema 
} from './playlist.schema';

export const playlistRouter = Router();

// Lấy chi tiết playlist có thể ko cần auth (hoặc auth thụ động) để lấy public
// Ta dùng middleware tuỳ biến cho việc cho phép passthrough nếu token lỗi hoặc ko có
// tạm thời định tuyến bảo vệ hoàn toàn 
playlistRouter.get('/:id', playlistController.getDetails);

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
