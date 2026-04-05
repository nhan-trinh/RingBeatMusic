import { Request, Response } from 'express';
import { AlbumService } from './album.service';
import { sendSuccess } from '../../shared/utils/response';
import { catchAsync } from '../../shared/utils/catch-async';

export const albumController = {
  createAlbum: catchAsync(async (req: Request, res: Response) => {
    const user = req.user!;
    const result = await AlbumService.createAlbum(user.id, req.body);
    sendSuccess(res, result, 'Tạo album thành công', 201);
  }),

  getAlbum: catchAsync(async (req: Request, res: Response) => {
    const result = await AlbumService.getAlbum(req.params.id);
    sendSuccess(res, result, 'Lấy chi tiết album thành công');
  }),

  updateAlbum: catchAsync(async (req: Request, res: Response) => {
    const user = req.user!;
    const result = await AlbumService.updateAlbum(user.id, req.params.id, req.body);
    sendSuccess(res, result, 'Cập nhật album thành công');
  }),

  deleteAlbum: catchAsync(async (req: Request, res: Response) => {
    const user = req.user!;
    const result = await AlbumService.deleteAlbum(user.id, req.params.id);
    sendSuccess(res, result, 'Xóa album thành công');
  }),

  uploadCover: catchAsync(async (req: Request, res: Response) => {
    const user = req.user!;
    if (!req.file) { res.status(400).json({ message: 'Không có file ảnh' }); return; }
    const result = await AlbumService.uploadCover(user.id, req.params.id, req.file);
    sendSuccess(res, result, 'Cập nhật ảnh bìa album thành công');
  }),

  reorderSongs: catchAsync(async (req: Request, res: Response) => {
    const user = req.user!;
    const result = await AlbumService.reorderSongs(req.params.id, user.id, req.body.songs);
    sendSuccess(res, result, 'Sắp xếp hoàn tất');
  }),

  followAlbum: catchAsync(async (req: Request, res: Response) => {
    const user = req.user!;
    const albumId = req.params.id;
    // Assuming Prisma allows raw insertion here for speed, though a Service is better.
    // For simplicity, doing it via a service call or direct.
    const result = await AlbumService.follow(user.id, albumId);
    sendSuccess(res, result, 'Theo dõi album thành công');
  }),

  unfollowAlbum: catchAsync(async (req: Request, res: Response) => {
    const user = req.user!;
    const albumId = req.params.id;
    const result = await AlbumService.unfollow(user.id, albumId);
    sendSuccess(res, result, 'Đã bỏ theo dõi album');
  }),

  addSong: catchAsync(async (req: Request, res: Response) => {
    const user = req.user!;
    const result = await AlbumService.addSongToAlbum(user.id, req.params.id, req.body.songId);
    sendSuccess(res, result, 'Thêm bài hát vào album thành công');
  }),

  removeSong: catchAsync(async (req: Request, res: Response) => {
    const user = req.user!;
    const result = await AlbumService.removeSongFromAlbum(user.id, req.params.id, req.params.songId);
    sendSuccess(res, result, 'Xóa bài hát khỏi album thành công');
  }),
};
