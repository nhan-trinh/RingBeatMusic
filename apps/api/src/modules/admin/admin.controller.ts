import { Request, Response } from 'express';
import { AdminService } from './admin.service';
import { sendSuccess } from '../../shared/utils/response';
import { catchAsync } from '../../shared/utils/catch-async';

export const adminController = {
  // Users
  getUsers: catchAsync(async (req: Request, res: Response) => {
    const { page, search } = req.query;
    const result = await AdminService.getUsers(Number(page) || 1, 20, search as string);
    sendSuccess(res, result);
  }),
  getUserById: catchAsync(async (req: Request, res: Response) => {
    sendSuccess(res, await AdminService.getUserById(req.params.id));
  }),
  changeRole: catchAsync(async (req: Request, res: Response) => {
    const result = await AdminService.changeUserRole(req.user!.id, req.params.id, req.body.role);
    sendSuccess(res, result, 'Đã cập nhật role');
  }),
  banUser: catchAsync(async (req: Request, res: Response) => {
    const result = await AdminService.banUser(req.user!.id, req.params.id, req.body.reason);
    sendSuccess(res, result);
  }),
  unbanUser: catchAsync(async (req: Request, res: Response) => {
    const result = await AdminService.unbanUser(req.user!.id, req.params.id);
    sendSuccess(res, result);
  }),
  resetPassword: catchAsync(async (req: Request, res: Response) => {
    const result = await AdminService.resetPassword(req.params.id);
    sendSuccess(res, result);
  }),

  // Content
  getAllSongs: catchAsync(async (req: Request, res: Response) => {
    const result = await AdminService.getAllSongs(Number(req.query.page) || 1);
    sendSuccess(res, result);
  }),
  deleteSong: catchAsync(async (req: Request, res: Response) => {
    const result = await AdminService.deleteSong(req.user!.id, req.params.id);
    sendSuccess(res, result);
  }),
  verifyArtist: catchAsync(async (req: Request, res: Response) => {
    const result = await AdminService.verifyArtist(req.user!.id, req.params.id);
    sendSuccess(res, result);
  }),
  featurePlaylist: catchAsync(async (req: Request, res: Response) => {
    const result = await AdminService.featurePlaylist(req.params.id, req.body.isFeatured ?? true);
    sendSuccess(res, result);
  }),
  pinPlaylist: catchAsync(async (req: Request, res: Response) => {
    const result = await AdminService.pinPlaylist(req.params.id, req.body.isPinned ?? true);
    sendSuccess(res, result);
  }),

  // Subscriptions / Payments
  getAllSubscriptions: catchAsync(async (_req: Request, res: Response) => {
    sendSuccess(res, await AdminService.getAllSubscriptions());
  }),
  getAllPayments: catchAsync(async (_req: Request, res: Response) => {
    sendSuccess(res, await AdminService.getAllPayments());
  }),
  refundPayment: catchAsync(async (req: Request, res: Response) => {
    const result = await AdminService.refundPayment(req.user!.id, req.params.id);
    sendSuccess(res, result);
  }),

  // Audit
  getAuditLogs: catchAsync(async (req: Request, res: Response) => {
    const result = await AdminService.getAuditLogs(Number(req.query.page) || 1);
    sendSuccess(res, result);
  }),

  // Analytics
  getOverview: catchAsync(async (_req: Request, res: Response) => {
    sendSuccess(res, await AdminService.getOverview(), 'Tổng quan hệ thống');
  }),
  getTopSongs: catchAsync(async (_req: Request, res: Response) => {
    sendSuccess(res, await AdminService.getTopSongs());
  }),
  getTopArtists: catchAsync(async (_req: Request, res: Response) => {
    sendSuccess(res, await AdminService.getTopArtists());
  }),
};
