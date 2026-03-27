import { Request, Response } from 'express';
import { SongService } from './song.service';
import { sendSuccess } from '../../shared/utils/response';
import { catchAsync } from '../../shared/utils/catch-async';

export const songController = {
  createMetadata: catchAsync(async (req: Request, res: Response) => {
    const user = req.user!;
    const result = await SongService.createSongMetadata(user.id, req.body);
    sendSuccess(res, result, 'Đã tạo metadata bài hát, vui lòng upload audio', 201);
  }),

  uploadComplete: catchAsync(async (req: Request, res: Response) => {
    const user = req.user!;
    const result = await SongService.uploadComplete(user.id, req.params.id);
    sendSuccess(res, result, 'Upload hoàn tất');
  }),

  getStreamUrl: catchAsync(async (req: Request, res: Response) => {
    // If not logged in, we reject them at middleware.
    const user = req.user!;
    const reqQuality = req.query.quality as string || '128';
    const result = await SongService.getStreamUrl(req.params.id, user.role, reqQuality);
    sendSuccess(res, result, 'Lấy stream URL thành công');
  }),

  getAll: catchAsync(async (_req: Request, res: Response) => {
    const result = await SongService.getMultiple();
    sendSuccess(res, result, 'Danh sách bài hát mới nổi');
  }),

  getArtistSongs: catchAsync(async (req: Request, res: Response) => {
    const result = await SongService.getMultiple(req.params.artistId);
    sendSuccess(res, result, 'Bài hát của nghệ sĩ');
  }),

  recordPlay: catchAsync(async (req: Request, res: Response) => {
    const result = await SongService.recordPlay(req.params.id);
    sendSuccess(res, result, 'Đã ghi nhận tương tác');
  }),

  likeSong: catchAsync(async (req: Request, res: Response) => {
    const user = req.user!;
    const result = await SongService.likeSong(user.id, req.params.id);
    sendSuccess(res, result, 'Đã thích');
  }),

  unlikeSong: catchAsync(async (req: Request, res: Response) => {
    const user = req.user!;
    const result = await SongService.unlikeSong(user.id, req.params.id);
    sendSuccess(res, result, 'Bỏ thích');
  }),
};
