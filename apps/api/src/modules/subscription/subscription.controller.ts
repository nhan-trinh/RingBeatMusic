import { Request, Response } from 'express';
import { SubscriptionService } from './subscription.service';
import { sendSuccess } from '../../shared/utils/response';
import { catchAsync } from '../../shared/utils/catch-async';

export const subscriptionController = {
  getPlans: catchAsync(async (_req: Request, res: Response) => {
    const result = SubscriptionService.getPlans();
    sendSuccess(res, result, 'Danh sách gói đăng ký');
  }),

  getMySubscription: catchAsync(async (req: Request, res: Response) => {
    const user = req.user!;
    const result = await SubscriptionService.getMySubscription(user.id);
    sendSuccess(res, result, 'Thông tin gói đăng ký của bạn');
  }),

  createCheckout: catchAsync(async (req: Request, res: Response) => {
    const user = req.user!;
    const { plan } = req.body;
    const result = await SubscriptionService.createCheckout(user.id, plan, req);
    sendSuccess(res, result, 'URL thanh toán đã được tạo');
  }),

  handleWebhook: catchAsync(async (req: Request, res: Response) => {
    // VNPAY gọi webhook qua POST, params trong body
    const result = await SubscriptionService.handleWebhook(req.body);
    res.json(result); // VNPAY cần response đúng format
  }),

  handleCallback: catchAsync(async (req: Request, res: Response) => {
    // VNPAY redirect → FE xử lý; BE chỉ xác thực chữ ký
    const result = SubscriptionService.handleCallback(req.query as Record<string, string>);
    sendSuccess(res, result, 'Kết quả thanh toán');
  }),

  cancelAutoRenew: catchAsync(async (req: Request, res: Response) => {
    const user = req.user!;
    const result = await SubscriptionService.cancelAutoRenew(user.id);
    sendSuccess(res, result);
  }),

  getInvoices: catchAsync(async (req: Request, res: Response) => {
    const user = req.user!;
    const result = await SubscriptionService.getInvoices(user.id);
    sendSuccess(res, result, 'Lịch sử hóa đơn');
  }),

  getInvoiceById: catchAsync(async (req: Request, res: Response) => {
    const user = req.user!;
    const result = await SubscriptionService.getInvoiceById(user.id, req.params.id);
    sendSuccess(res, result, 'Chi tiết hóa đơn');
  }),
};
