import { Request, Response } from 'express';
import { PlayerService } from './player.service';
import { sendSuccess } from '../../shared/utils/response';
import { catchAsync } from '../../shared/utils/catch-async';

export const playerController = {
  getQueue: catchAsync(async (req: Request, res: Response) => {
    const user = req.user!;
    const result = await PlayerService.getQueue(user.id);
    sendSuccess(res, result, 'Danh sách hàng đợi hiện tại');
  }),

  updateQueue: catchAsync(async (req: Request, res: Response) => {
    const user = req.user!;
    const result = await PlayerService.updateQueue(user.id, req.body.songIds);
    sendSuccess(res, result, 'Đã cập nhật hàng đợi');
  }),

  recordPlay: catchAsync(async (req: Request, res: Response) => {
    const user = req.user!;
    const { songId, durationPlayed, completed } = req.body;
    const result = await PlayerService.recordPlay(user.id, songId, durationPlayed, completed);
    sendSuccess(res, result, 'Đã ghi nhận tương tác phát nhạc');
  }),

  getHistory: catchAsync(async (req: Request, res: Response) => {
    const user = req.user!;
    const result = await PlayerService.getHistory(user.id);
    sendSuccess(res, result, 'Lịch sử phát nhạc của bạn');
  }),

  getRecentlyPlayed: catchAsync(async (req: Request, res: Response) => {
    const user = req.user!;
    const result = await PlayerService.getRecentlyPlayed(user.id);
    sendSuccess(res, result, 'Bài hát nghe gần đây');
  }),

  checkSkipLimit: catchAsync(async (req: Request, res: Response) => {
    const user = req.user!;
    const result = await PlayerService.checkSkipLimit(user.id, user.role);
    sendSuccess(res, result);
  })
};
