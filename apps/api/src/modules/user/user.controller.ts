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
};
