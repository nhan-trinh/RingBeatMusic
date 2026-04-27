import { Request, Response } from 'express';
import { ModerationService } from './moderation.service';
import { sendSuccess } from '../../shared/utils/response';
import { catchAsync } from '../../shared/utils/catch-async';

export const moderationController = {
  getPendingSongs: catchAsync(async (_req: Request, res: Response) => {
    const result = await ModerationService.getPendingSongs();
    sendSuccess(res, result, 'Danh sách bài hát chờ duyệt');
  }),

  approveSong: catchAsync(async (req: Request, res: Response) => {
    const moderator = req.user!;
    const result = await ModerationService.approveSong(moderator.id, req.params.id);
    sendSuccess(res, result);
  }),

  rejectSong: catchAsync(async (req: Request, res: Response) => {
    const moderator = req.user!;
    const { reason } = req.body;
    const result = await ModerationService.rejectSong(moderator.id, req.params.id, reason);
    sendSuccess(res, result);
  }),

  getReports: catchAsync(async (req: Request, res: Response) => {
    const result = await ModerationService.getReports(req.query.status as string);
    sendSuccess(res, result, 'Danh sách report');
  }),

  resolveReport: catchAsync(async (req: Request, res: Response) => {
    const moderator = req.user!;
    const { note } = req.body;
    const result = await ModerationService.resolveReport(moderator.id, req.params.id, 'RESOLVED', note);
    sendSuccess(res, result);
  }),

  dismissReport: catchAsync(async (req: Request, res: Response) => {
    const moderator = req.user!;
    const { note } = req.body;
    const result = await ModerationService.resolveReport(moderator.id, req.params.id, 'DISMISSED', note);
    sendSuccess(res, result);
  }),

  issueStrike: catchAsync(async (req: Request, res: Response) => {
    const moderator = req.user!;
    const { reason, note } = req.body;
    const result = await ModerationService.issueStrike(moderator.id, req.params.id, reason, note);
    sendSuccess(res, result, 'Đã cấp strike');
  }),
};
