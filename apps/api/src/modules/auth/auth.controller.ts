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
    if (result.refreshToken) {
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 ngày
      });
      delete (result as any).refreshToken;
    }
    sendSuccess(res, result, 'Đăng nhập thành công');
  }),

  verifyEmail: catchAsync(async (req: Request, res: Response) => {
    const { email, otp } = req.body;
    const result = await AuthService.verifyEmail(email, otp);
    if (result.refreshToken) {
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });
      delete (result as any).refreshToken;
    }
    sendSuccess(res, result, 'Xác thực email thành công');
  }),

  logout: catchAsync(async (req: Request, res: Response) => {
    const user = req.user as { id: string; jti: string; exp: number };
    const result = await AuthService.logout(user.id, user.jti, user.exp);
    res.clearCookie('refreshToken');
    sendSuccess(res, result, 'Đăng xuất thành công');
  }),

  refresh: catchAsync(async (req: Request, res: Response) => {
    const refreshToken = req.cookies.refreshToken;
    const result = await AuthService.refresh(refreshToken);
    if (result.refreshToken) {
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });
      delete (result as any).refreshToken;
    }
    sendSuccess(res, result, 'Làm mới token thành công');
  }),

  resendOtp: catchAsync(async (_req: Request, res: Response) => {
    sendSuccess(res, null, 'TODO');
  }),
  forgotPassword: catchAsync(async (req: Request, res: Response) => {
    const result = await AuthService.forgotPassword(req.body.email);
    sendSuccess(res, result, 'Đã gửi yêu cầu quên mật khẩu');
  }),
  resetPassword: catchAsync(async (req: Request, res: Response) => {
    const result = await AuthService.resetPassword(req.body);
    sendSuccess(res, result, 'Đã đặt lại mật khẩu');
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
  checkEmail: catchAsync(async (req: Request, res: Response) => {
    const result = await AuthService.checkEmail(req.body.email);
    sendSuccess(res, result, 'Kiểm tra email thành công');
  }),
  googleAuth: catchAsync(async (_req: Request, res: Response) => {
    const { env } = require('../../shared/config/env');
    const { OAuth2Client } = require('google-auth-library');
    const client = new OAuth2Client(env.GOOGLE_CLIENT_ID, env.GOOGLE_CLIENT_SECRET, env.GOOGLE_CALLBACK_URL);
    const url = client.generateAuthUrl({ access_type: 'offline', scope: ['email', 'profile'] });
    res.redirect(url);
  }),
  googleCallback: catchAsync(async (req: Request, res: Response) => {
    const { code } = req.query;
    if (!code) return res.redirect(`${process.env.FRONTEND_URL}/login?error=Google_Canceled`);
    
    const { env } = require('../../shared/config/env');
    const { OAuth2Client } = require('google-auth-library');
    const { prisma } = require('../../shared/config/database');
    const { TokenUtil } = require('../../shared/utils/token.util');
    const { redis } = require('../../shared/config/redis');

    const client = new OAuth2Client(env.GOOGLE_CLIENT_ID, env.GOOGLE_CLIENT_SECRET, env.GOOGLE_CALLBACK_URL);
    const { tokens } = await client.getToken(code as string);
    client.setCredentials(tokens);

    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token!,
      audience: env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload?.email) return res.redirect(`${env.FRONTEND_URL}/login?error=Invalid_Google_Payload`);

    let user = await prisma.user.findUnique({ where: { email: payload.email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: payload.email,
          name: payload.name || payload.email.split('@')[0],
          avatarUrl: payload.picture,
          isEmailVerified: true,
          dateOfBirth: new Date('2000-01-01'),
          gender: 'prefer-not-to-say',
        },
      });
    }

    if (user.isBanned) {
      return res.redirect(`${env.FRONTEND_URL}/login?error=Account_Banned`);
    }

    const appTokens = TokenUtil.generateTokens(user.id, user.role);
    await redis.set(`refresh_token:${user.id}`, appTokens.refreshToken, 'EX', 7 * 24 * 60 * 60);

    // Set cookie cho Refresh Token
    res.cookie('refreshToken', appTokens.refreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const redirectUrl = new URL(`${env.FRONTEND_URL}/auth/callback`);
    redirectUrl.searchParams.set('accessToken', appTokens.accessToken);
    redirectUrl.searchParams.set('user', JSON.stringify({
      id: user.id, email: user.email, name: user.name, role: user.role, avatarUrl: user.avatarUrl
    }));

    res.redirect(redirectUrl.toString());
  }),
};
