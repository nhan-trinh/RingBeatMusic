import { Request, Response } from 'express';
import { catchAsync } from '../../shared/utils/catch-async';
import { sendSuccess } from '../../shared/utils/response';
import { HomeService } from './home.service';

export const homeController = {
  getFeed: catchAsync(async (req: Request, res: Response) => {
    const data = await HomeService.getFeed(req.user?.id);
    sendSuccess(res, data, 'Lấy dữ liệu trang chủ thành công');
  }),
  getSettings: catchAsync(async (_req: Request, res: Response) => {
    const data = await HomeService.getSettings();
    sendSuccess(res, data);
  }),
  getPersonalized: catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) return sendSuccess(res, {}, 'Chưa đăng nhập');
    
    const data = await HomeService.getPersonalizedData(userId);
    return sendSuccess(res, data, 'Lấy dữ liệu cá nhân hóa thành công');
  }),
};
