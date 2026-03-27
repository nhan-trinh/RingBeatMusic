import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { sendSuccess } from '../../shared/utils/response';
import { catchAsync } from '../../shared/utils/catch-async';

export const authController = {
  register: catchAsync(async (req: Request, res: Response) => {
    const result = await AuthService.register(req.body);
    sendSuccess(res, result, 'Đăng ký thành công', 201);
  }),

  login: catchAsync(async (req: Request, res: Response) => {
    const result = await AuthService.login(req.body);
    sendSuccess(res, result, 'Đăng nhập thành công');
  }),

  verifyEmail: catchAsync(async (req: Request, res: Response) => {
    const { email, otp } = req.body;
    const result = await AuthService.verifyEmail(email, otp);
    sendSuccess(res, result, 'Xác thực email thành công');
  }),

  logout: catchAsync(async (req: Request, res: Response) => {
    const user = req.user as { id: string; jti: string; exp: number };
    const result = await AuthService.logout(user.id, user.jti, user.exp);
    sendSuccess(res, result, 'Đăng xuất thành công');
  }),

  refresh: catchAsync(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;
    const result = await AuthService.refresh(refreshToken);
    sendSuccess(res, result, 'Làm mới token thành công');
  }),

  resendOtp: catchAsync(async (_req: Request, res: Response) => {
    sendSuccess(res, null, 'TODO');
  }),
  forgotPassword: catchAsync(async (_req: Request, res: Response) => {
    sendSuccess(res, null, 'TODO');
  }),
  resetPassword: catchAsync(async (_req: Request, res: Response) => {
    sendSuccess(res, null, 'TODO');
  }),
  setup2FA: catchAsync(async (req: Request, res: Response) => {
    const user = req.user!;
    // Note: To display email in authenticator app, typically email is fetched or passed. 
    // We pass role/id as placeholder if email isn't in req.user, or fetch from DB in service.
    // I will refactor setup2FA to just take userId and fetch email inside.
    const result = await AuthService.setup2FA(user.id, 'UserEmail'); 
    sendSuccess(res, result, 'Thiết lập 2FA thành công');
  }),
  verify2FA: catchAsync(async (req: Request, res: Response) => {
    const user = req.user!;
    const { token } = req.body;
    const result = await AuthService.verify2FA(user.id, token);
    sendSuccess(res, result, 'Xác thực 2FA thành công');
  }),
  googleAuth: catchAsync(async (_req: Request, res: Response) => {
    res.json({ message: 'TODO' });
  }),
  googleCallback: catchAsync(async (_req: Request, res: Response) => {
    sendSuccess(res, null, 'TODO');
  }),
};
