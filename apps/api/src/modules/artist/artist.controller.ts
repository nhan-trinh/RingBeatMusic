import { Request, Response } from 'express';
import { ArtistService } from './artist.service';
import { sendSuccess } from '../../shared/utils/response';
import { catchAsync } from '../../shared/utils/catch-async';

export const artistController = {
  getProfile: catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await ArtistService.getProfile(id);
    sendSuccess(res, result, 'Lấy thông tin Artist thành công');
  }),

  getMyProfile: catchAsync(async (req: Request, res: Response) => {
    const user = req.user!;
    const result = await ArtistService.getMyProfile(user.id);
    sendSuccess(res, result, 'Lấy thông tin của bạn thành công');
  }),

  setupProfile: catchAsync(async (req: Request, res: Response) => {
    const user = req.user!;
    const result = await ArtistService.setupProfile(user.id, req.body);
    sendSuccess(res, result, 'Tạo profile nghệ sĩ thành công', 201);
  }),

  uploadAvatar: catchAsync(async (req: Request, res: Response) => {
    const user = req.user!;
    if (!req.file) {
      res.status(400).json({ message: 'Không có file ảnh' }); return;
    }
    const result = await ArtistService.uploadAvatar(user.id, req.file);
    sendSuccess(res, result, 'Cập nhật ảnh đại diện thành công');
  }),

  updateProfile: catchAsync(async (req: Request, res: Response) => {
    const user = req.user!;
    const result = await ArtistService.updateProfile(user.id, req.body);
    sendSuccess(res, result, 'Cập nhật Profile thành công');
  }),

  getAnalytics: catchAsync(async (req: Request, res: Response) => {
    const user = req.user!;
    const result = await ArtistService.getAnalytics(user.id);
    sendSuccess(res, result, 'Lấy Analytics thành công');
  }),

  requestVerification: catchAsync(async (req: Request, res: Response) => {
    const user = req.user!;
    const result = await ArtistService.requestVerification(user.id);
    sendSuccess(res, result, 'Yêu cầu của bạn đang được xử lý');
  }),

  followArtist: catchAsync(async (req: Request, res: Response) => {
    const user = req.user!;
    const result = await ArtistService.follow(user.id, req.params.id);
    sendSuccess(res, result, 'Đang theo dõi nghệ sĩ');
  }),

  unfollowArtist: catchAsync(async (req: Request, res: Response) => {
    const user = req.user!;
    const result = await ArtistService.unfollow(user.id, req.params.id);
    sendSuccess(res, result, 'Bỏ theo dõi nghệ sĩ');
  }),

  getMySongs: catchAsync(async (req: Request, res: Response) => {
    const user = req.user!;
    const result = await ArtistService.getMySongs(user.id);
    sendSuccess(res, result, 'Danh sách bài hát của bạn');
  }),

  getMyAlbums: catchAsync(async (req: Request, res: Response) => {
    const user = req.user!;
    const result = await ArtistService.getMyAlbums(user.id);
    sendSuccess(res, result, 'Danh sách album của bạn');
  }),

  getAll: catchAsync(async (_req: Request, res: Response) => {
    const result = await ArtistService.getMultiple();
    sendSuccess(res, result, 'Danh sách nghệ sĩ');
  }),
};
