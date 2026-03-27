import { Request, Response } from 'express';
import { SearchService } from './search.service';
import { sendSuccess } from '../../shared/utils/response';
import { catchAsync } from '../../shared/utils/catch-async';

export const searchController = {
  syncIndexes: catchAsync(async (_req: Request, res: Response) => {
    const result = await SearchService.syncIndexes();
    sendSuccess(res, result, 'Bắt đầu nạp toàn bộ CSDL lên MeiliSearch');
  }),

  globalSearch: catchAsync(async (req: Request, res: Response) => {
    const q = req.query.q as string;
    const type = req.query.type as string; // Optional
    const result = await SearchService.globalSearch(q, type);
    sendSuccess(res, result, 'Kết quả tìm kiếm');
  }),

  getTopCharts: catchAsync(async (_req: Request, res: Response) => {
    const result = await SearchService.getTopCharts();
    sendSuccess(res, result, 'Danh sách Top Charts');
  }),

  getDiscoverWeekly: catchAsync(async (req: Request, res: Response) => {
    const user = req.user!;
    const result = await SearchService.discoverWeekly(user.id);
    sendSuccess(res, result, 'Khám phá ca khúc dành riêng cho bạn');
  }),
};
