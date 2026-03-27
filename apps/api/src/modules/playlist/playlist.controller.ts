import { Request, Response } from 'express';
import { PlaylistService } from './playlist.service';
import { sendSuccess } from '../../shared/utils/response';
import { catchAsync } from '../../shared/utils/catch-async';

export const playlistController = {
  create: catchAsync(async (req: Request, res: Response) => {
    const user = req.user!;
    const result = await PlaylistService.createPlaylist(user.id, req.body, user.role);
    sendSuccess(res, result, 'Playlist được tạo thành công', 201);
  }),

  getMine: catchAsync(async (req: Request, res: Response) => {
    const user = req.user!;
    const result = await PlaylistService.getMine(user.id);
    sendSuccess(res, result, 'Playlist cá nhân');
  }),

  getDetails: catchAsync(async (req: Request, res: Response) => {
    const user = req.user;
    const result = await PlaylistService.getPlaylistDetails(req.params.id, user?.id);
    sendSuccess(res, result, 'Playlist details');
  }),

  update: catchAsync(async (req: Request, res: Response) => {
    const user = req.user!;
    const result = await PlaylistService.updatePlaylist(req.params.id, user.id, req.body);
    sendSuccess(res, result, 'Cập nhật playlist thành công');
  }),

  delete: catchAsync(async (req: Request, res: Response) => {
    const user = req.user!;
    const result = await PlaylistService.deletePlaylist(req.params.id, user.id);
    sendSuccess(res, result, 'Xóa playlist thành công');
  }),

  addSong: catchAsync(async (req: Request, res: Response) => {
    const user = req.user!;
    const { songId, position } = req.body;
    const result = await PlaylistService.addSong(req.params.id, user.id, songId, position);
    sendSuccess(res, result, 'Đã thêm bài hát');
  }),

  removeSong: catchAsync(async (req: Request, res: Response) => {
    const user = req.user!;
    const result = await PlaylistService.removeSong(req.params.id, user.id, req.params.songId);
    sendSuccess(res, result, 'Đã gỡ bài hát');
  }),

  reorderSongs: catchAsync(async (req: Request, res: Response) => {
    const user = req.user!;
    const result = await PlaylistService.reorderSongs(req.params.id, user.id, req.body.songs);
    sendSuccess(res, result, 'Sắp xếp hoàn tất');
  }),

  hideSong: catchAsync(async (req: Request, res: Response) => {
    const user = req.user!;
    const { songId, localPlaylistId } = req.body;
    const result = await PlaylistService.hideSong(user.id, songId, localPlaylistId);
    sendSuccess(res, result);
  })
};
