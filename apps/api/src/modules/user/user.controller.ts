import { Request, Response } from 'express';
import { UserService } from './user.service';
import { sendSuccess } from '../../shared/utils/response';
import { catchAsync } from '../../shared/utils/catch-async';

export const userController = {
  getProfile: catchAsync(async (req: Request, res: Response) => {
    const user = req.user!;
    const result = await UserService.getProfile(user.id);
    sendSuccess(res, result, 'Lấy thông tin người dùng thành công');
  }),

  updateProfile: catchAsync(async (req: Request, res: Response) => {
    const user = req.user!;
    const result = await UserService.updateProfile(user.id, req.body);
    sendSuccess(res, result, 'Cập nhật thông tin thành công');
  }),

  changePassword: catchAsync(async (req: Request, res: Response) => {
    const user = req.user!;
    const result = await UserService.changePassword(user.id, req.body);
    sendSuccess(res, result, 'Đổi mật khẩu thành công');
  }),

  uploadAvatar: catchAsync(async (req: Request, res: Response) => {
    const user = req.user!;
    const result = await UserService.uploadAvatar(user.id, req.file as Express.Multer.File);
    sendSuccess(res, result, 'Cập nhật avatar thành công');
  }),

  getLibrary: catchAsync(async (req: Request, res: Response) => {
    const user = req.user!;
    const result = await UserService.getLibrary(user.id);
    sendSuccess(res, result, 'Thư viện âm nhạc');
  }),

  // Phase 9
  getRecentlyPlayed: catchAsync(async (req: Request, res: Response) => {
    const user = req.user!;
    const result = await UserService.getRecentlyPlayed(user.id);
    sendSuccess(res, result, 'Lịch sử nghe nhạc gần đây');
  }),

  getPublicProfile: catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const currentUserId = req.user?.id;
    const result = await UserService.getPublicProfile(id, currentUserId);
    sendSuccess(res, result, 'Hồ sơ người dùng');
  }),

  // Social (Phase 16)
  followUser: catchAsync(async (req: Request, res: Response) => {
    const user = req.user!;
    const { id } = req.params;
    const result = await UserService.followUser(user.id, id);
    sendSuccess(res, result, 'Theo dõi thành công');
  }),

  unfollowUser: catchAsync(async (req: Request, res: Response) => {
    const user = req.user!;
    const { id } = req.params;
    const result = await UserService.unfollowUser(user.id, id);
    sendSuccess(res, result, 'Bỏ theo dõi thành công');
  }),

  getFollowingActivity: catchAsync(async (req: Request, res: Response) => {
    const user = req.user!;
    const result = await UserService.getFollowingActivity(user.id);
    sendSuccess(res, result, 'Hoạt động bạn bè');
  }),
};
