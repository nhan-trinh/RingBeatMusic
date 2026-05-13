import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { sendSuccess } from '../../shared/utils/response';
import { catchAsync } from '../../shared/utils/catch-async';
import { env } from '../../shared/config/env';
import { hashToken, getClientIp } from '../../shared/utils/session.util';
import { ErrorCodes } from '../../shared/utils/app-error';

// ──────────────────────────────────────────────
// Cookie Helpers
// ──────────────────────────────────────────────

const isHttps = env.BACKEND_URL.startsWith('https://') || env.NODE_ENV === 'production';

const getCookieOptions = (maxAgeDays = 30) => ({
  httpOnly: true,
  secure: isHttps,
  sameSite: (isHttps ? 'none' : 'lax') as 'none' | 'lax',
  maxAge: maxAgeDays * 24 * 60 * 60 * 1000,
  path: '/',
});

const CLEAR_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: isHttps,
  sameSite: (isHttps ? 'none' : 'lax') as 'none' | 'lax',
  path: '/',
};

/** Trích xuất metadata thiết bị từ request */
function extractMeta(req: Request) {
  return {
    userAgent: req.headers['user-agent'],
    ipAddress: getClientIp(req),
  };
}

// ──────────────────────────────────────────────
// Controller
// ──────────────────────────────────────────────

export const authController = {

  register: catchAsync(async (req: Request, res: Response) => {
    const result = await AuthService.register(req.body);
    sendSuccess(res, result, 'Đăng ký thành công', 201);
  }),

  login: catchAsync(async (req: Request, res: Response) => {
    try {
      const result = await AuthService.login(req.body, extractMeta(req));

      if (result.refreshToken) {
        res.cookie('refreshToken', result.refreshToken, getCookieOptions(30));
        delete (result as any).refreshToken;
      }

      sendSuccess(res, result, 'Đăng nhập thành công');
    } catch (err: any) {
      // Xử lý đặc biệt: DEVICE_LIMIT_EXCEEDED — trả về 409 + danh sách thiết bị
      if (err.code === ErrorCodes.DEVICE_LIMIT_EXCEEDED) {
        res.status(409).json({
          success: false,
          code: ErrorCodes.DEVICE_LIMIT_EXCEEDED,
          message: err.message,
          data: err.data, // { actionToken, sessions }
        });
        return;
      }
      throw err; // Ném lại các lỗi khác để global error handler xử lý
    }
  }),

  verifyEmail: catchAsync(async (req: Request, res: Response) => {
    const { email, otp } = req.body;
    const result = await AuthService.verifyEmail(email, otp, extractMeta(req));

    if (result.refreshToken) {
      res.cookie('refreshToken', result.refreshToken, getCookieOptions(30));
      delete (result as any).refreshToken;
    }

    sendSuccess(res, result, 'Xác thực email thành công');
  }),

  logout: catchAsync(async (req: Request, res: Response) => {
    const refreshToken = req.cookies.refreshToken;
    const result = await AuthService.logout(refreshToken ?? '');
    res.clearCookie('refreshToken', CLEAR_COOKIE_OPTIONS);
    sendSuccess(res, result, 'Đăng xuất thành công');
  }),

  refresh: catchAsync(async (req: Request, res: Response) => {
    const refreshToken = req.cookies.refreshToken;
    const result = await AuthService.refresh(refreshToken);

    // Không phát hành Refresh Token mới (stateless refresh — chỉ cấp AT mới)
    sendSuccess(res, result, 'Làm mới token thành công');
  }),

  // ── Session Management ─────────────────────

  /** GET /auth/sessions — Lấy danh sách thiết bị đang đăng nhập */
  getActiveSessions: catchAsync(async (req: Request, res: Response) => {
    const userId = (req.user as any).id;
    const currentRefreshToken = req.cookies.refreshToken as string | undefined;
    const currentTokenHash = currentRefreshToken ? hashToken(currentRefreshToken) : null;

    const sessions = await AuthService.getSessionsSync(userId, currentTokenHash);
    sendSuccess(res, sessions, 'Lấy danh sách phiên đăng nhập thành công');
  }),

  /** DELETE /auth/sessions/:id — Đăng xuất thiết bị từ xa */
  revokeSession: catchAsync(async (req: Request, res: Response) => {
    const userId = (req.user as any).id;
    const { id: sessionId } = req.params;

    const result = await AuthService.revokeSession(userId, sessionId);
    sendSuccess(res, result, result.message);
  }),

  /**
   * POST /auth/resolve-device-limit
   * Kick 1 thiết bị cũ để đăng nhập thiết bị mới khi đã đạt giới hạn 5.
   * Yêu cầu: { actionToken, sessionId }
   */
  resolveDeviceLimit: catchAsync(async (req: Request, res: Response) => {
    const { actionToken, sessionId } = req.body;
    const result = await AuthService.resolveDeviceLimit(actionToken, sessionId, extractMeta(req));

    res.cookie('refreshToken', result.refreshToken, getCookieOptions(30));
    delete (result as any).refreshToken;

    sendSuccess(res, result, 'Đăng nhập thành công');
  }),

  // ── Existing handlers ──────────────────────

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
    const result = await AuthService.setup2FA(user.id);
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
    const { generateOpaqueToken, hashToken: ht, getSessionExpiresAt, parseUserAgent: pua } = require('../../shared/utils/session.util');

    const client = new OAuth2Client(env.GOOGLE_CLIENT_ID, env.GOOGLE_CLIENT_SECRET, env.GOOGLE_CALLBACK_URL);
    const { tokens } = await client.getToken(code as string);
    client.setCredentials(tokens);

    const ticket = await client.verifyIdToken({ idToken: tokens.id_token!, audience: env.GOOGLE_CLIENT_ID });
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

    if (user.isBanned) return res.redirect(`${env.FRONTEND_URL}/login?error=Account_Banned`);

    const appTokens = TokenUtil.generateTokens(user.id, user.role, user.name);
    const refreshToken = generateOpaqueToken();
    const deviceInfo = pua(req.headers['user-agent']);

    await prisma.userSession.create({
      data: {
        userId: user.id,
        tokenHash: ht(refreshToken),
        deviceName: deviceInfo.deviceName,
        deviceType: deviceInfo.deviceType,
        os: deviceInfo.os,
        browser: deviceInfo.browser,
        ipAddress: getClientIp(req),
        expiresAt: getSessionExpiresAt(),
      },
    });

    res.cookie('refreshToken', refreshToken, getCookieOptions(30));

    const redirectUrl = new URL(`${env.FRONTEND_URL}/auth/callback`);
    redirectUrl.searchParams.set('accessToken', appTokens.accessToken);
    redirectUrl.searchParams.set('user', JSON.stringify({
      id: user.id, email: user.email, name: user.name, role: user.role, avatarUrl: user.avatarUrl,
    }));

    res.redirect(redirectUrl.toString());
  }),

  requestAccountDeletion: catchAsync(async (req: Request, res: Response) => {
    const user = req.user as any;
    const result = await AuthService.requestAccountDeletion(user.id, user.email);
    sendSuccess(res, result, 'Yêu cầu gửi mã xóa tài khoản thành công');
  }),

  confirmAccountDeletion: catchAsync(async (req: Request, res: Response) => {
    const user = req.user as any;
    const { code } = req.body;
    const result = await AuthService.confirmAccountDeletion(user.id, user.email, code);

    res.clearCookie('refreshToken', CLEAR_COOKIE_OPTIONS);

    await (require('../../shared/config/database')).prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: 'ACCOUNT_DELETED',
        targetId: user.id,
        targetType: 'user',
        metadata: { reason: 'User self-requested account deletion' },
      },
    });

    sendSuccess(res, result, 'Tài khoản đã được xóa');
  }),
};
