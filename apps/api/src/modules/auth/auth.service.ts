import bcrypt from 'bcryptjs';
import speakeasy from 'speakeasy';
import qrcode from 'qrcode';
import jwt from 'jsonwebtoken';
import { prisma } from '../../shared/config/database';
import { redis } from '../../shared/config/redis';
import { env } from '../../shared/config/env';
import { AppError, ErrorCodes } from '../../shared/utils/app-error';
import { TokenUtil } from '../../shared/utils/token.util';
import { OtpUtil } from '../../shared/utils/otp.util';
import { MailUtil } from '../../shared/utils/mail.util';
import {
  generateOpaqueToken,
  hashToken,
  getSessionExpiresAt,
  parseUserAgent,
  MAX_SESSIONS_PER_USER,
} from '../../shared/utils/session.util';

// ──────────────────────────────────────────────
// Redis key prefixes — tập trung một chỗ để dễ maintain
// ──────────────────────────────────────────────
const KEY = {
  loginAttempts: (email: string) => `login_attempts:${email}`,
  otp: (email: string) => `otp:${email}`,
  otpPwd: (email: string) => `otp:pwd_${email}`,
  otpDelAcc: (email: string) => `del_acc_otp:${email}`,
  blacklist: (jti: string) => `blacklist:${jti}`,
  pendingUser: (email: string) => `pending_user:${email}`,
  // Action token cho Device Limit flow — dùng 1 lần, TTL ngắn
  actionToken: (token: string) => `action_token:${token}`,
} as const;

// ──────────────────────────────────────────────
// Session Helpers — internal, không export
// ──────────────────────────────────────────────

interface CreateSessionParams {
  userId: string;
  refreshToken: string; // opaque token gốc, sẽ được hash trước khi lưu
  userAgent?: string;
  ipAddress?: string;
}

/**
 * Tạo một UserSession mới trong DB.
 * Luôn lưu tokenHash (SHA-256), không bao giờ lưu token gốc.
 */
async function createSession(params: CreateSessionParams): Promise<void> {
  const { userId, refreshToken, userAgent, ipAddress } = params;
  const deviceInfo = parseUserAgent(userAgent);

  await prisma.userSession.create({
    data: {
      userId,
      tokenHash: hashToken(refreshToken),
      deviceName: deviceInfo.deviceName,
      deviceType: deviceInfo.deviceType,
      os: deviceInfo.os,
      browser: deviceInfo.browser,
      ipAddress,
      expiresAt: getSessionExpiresAt(),
    },
  });
}

/**
 * Đếm số session đang còn active của một user.
 * Active = chưa revoke VÀ chưa hết hạn.
 */
async function countActiveSessions(userId: string): Promise<number> {
  return prisma.userSession.count({
    where: {
      userId,
      isRevoked: false,
      expiresAt: { gt: new Date() },
    },
  });
}

/**
 * Lấy danh sách session active của một user (dùng để hiển thị hoặc gửi kèm lỗi DEVICE_LIMIT).
 */
async function getActiveSessionList(userId: string) {
  return prisma.userSession.findMany({
    where: {
      userId,
      isRevoked: false,
      expiresAt: { gt: new Date() },
    },
    orderBy: { lastActiveAt: 'desc' },
    select: {
      id: true,
      deviceName: true,
      deviceType: true,
      os: true,
      browser: true,
      ipAddress: true,
      lastActiveAt: true,
      createdAt: true,
    },
  });
}

// ──────────────────────────────────────────────
// Auth Service
// ──────────────────────────────────────────────

export const AuthService = {

  checkEmail: async (email: string) => {
    const user = await prisma.user.findUnique({ where: { email } });
    return { exists: !!user, isGoogleLogin: user && !user.passwordHash };
  },

  // 1. Register
  register: async (data: any) => {
    const { email, password, name, dateOfBirth, gender } = data;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      if (!existingUser.isEmailVerified) {
        await prisma.user.delete({ where: { email } });
      } else {
        throw new AppError('Email đã được đăng ký', 400, ErrorCodes.ALREADY_EXISTS);
      }
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const pendingUser = {
      email, passwordHash, name,
      dateOfBirth: new Date(dateOfBirth).toISOString(),
      gender,
    };

    await redis.set(KEY.pendingUser(email), JSON.stringify(pendingUser), 'EX', 10 * 60);

    const otp = OtpUtil.generateNumeric();
    await redis.set(KEY.otp(email), otp, 'EX', 10 * 60);
    MailUtil.sendOTP(email, otp, 'Đăng Ký').catch(err => console.error('[Mail Error]', err));

    return { message: 'Vui lòng kiểm tra email để xác thực tài khoản' };
  },

  // 2. Verify Email — cấp session sau khi xác thực
  verifyEmail: async (email: string, otp: string, meta?: { userAgent?: string; ipAddress?: string }) => {
    const cacheOtp = await redis.get(KEY.otp(email));
    if (!cacheOtp || cacheOtp !== otp) {
      throw new AppError('Mã OTP không hợp lệ hoặc đã hết hạn', 400, ErrorCodes.VALIDATION_ERROR);
    }

    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      const pendingUserStr = await redis.get(KEY.pendingUser(email));
      if (!pendingUserStr) {
        throw new AppError('Dữ liệu đăng ký đã hết hạn. Vui lòng đăng ký lại.', 400, ErrorCodes.VALIDATION_ERROR);
      }
      const pendingUser = JSON.parse(pendingUserStr);
      user = await prisma.user.create({
        data: {
          email: pendingUser.email,
          passwordHash: pendingUser.passwordHash,
          name: pendingUser.name,
          dateOfBirth: new Date(pendingUser.dateOfBirth),
          gender: pendingUser.gender,
          isEmailVerified: true,
        },
      });
      await redis.del(KEY.pendingUser(email));
    } else {
      user = await prisma.user.update({
        where: { email },
        data: { isEmailVerified: true },
      });
    }

    await redis.del(KEY.otp(email));

    // Cấp token và tạo session đầu tiên
    const accessToken = TokenUtil.generateTokens(user.id, user.role, user.name).accessToken;
    const refreshToken = generateOpaqueToken();

    await createSession({ userId: user.id, refreshToken, ...meta });

    return {
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email, name: user.name, role: user.role, avatarUrl: user.avatarUrl },
    };
  },

  // 3. Login — kiểm tra giới hạn thiết bị
  login: async (data: any, meta?: { userAgent?: string; ipAddress?: string }) => {
    const { email, password } = data;
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) throw new AppError('Email hoặc mật khẩu không đúng', 401, ErrorCodes.INVALID_CREDENTIALS);
    if (user.isBanned) throw new AppError(`Tài khoản đã bị khóa! Lý do: ${user.banReason || 'Vi phạm tiêu chuẩn cộng đồng'}`, 403, ErrorCodes.FORBIDDEN);
    if (user.lockedUntil && user.lockedUntil > new Date()) throw new AppError('Tài khoản đã bị khóa tạm thời', 403, ErrorCodes.ACCOUNT_LOCKED);
    if (!user.isEmailVerified) throw new AppError('Vui lòng xác thực email', 403, ErrorCodes.EMAIL_NOT_VERIFIED);

    const isMatch = await bcrypt.compare(password, user.passwordHash || '');
    if (!isMatch) {
      const attempts = await redis.incr(KEY.loginAttempts(email));
      if (attempts === 1) await redis.expire(KEY.loginAttempts(email), 15 * 60);
      if (attempts >= 5) {
        await prisma.user.update({
          where: { email },
          data: { lockedUntil: new Date(Date.now() + 15 * 60 * 1000) },
        });
        throw new AppError('Khóa tài khoản 15 phút do sai quá nhiều', 403, ErrorCodes.ACCOUNT_LOCKED);
      }
      throw new AppError('Email hoặc mật khẩu không đúng', 401, ErrorCodes.INVALID_CREDENTIALS);
    }

    await redis.del(KEY.loginAttempts(email));
    await prisma.user.update({ where: { email }, data: { lockedUntil: null, loginAttempts: 0 } });

    // 2FA check
    if (user.twoFactorEnabled) {
      const tempToken = jwt.sign({ sub: user.id, isTemp2FA: true }, env.JWT_ACCESS_SECRET, { expiresIn: '5m' });
      return { requiresTwoFactor: true, tempToken };
    }

    // ── Device Limit Check ──────────────────────
    const activeCount = await countActiveSessions(user.id);
    if (activeCount >= MAX_SESSIONS_PER_USER) {
      // Tạo Action Token có scope cố định, TTL ngắn, dùng 1 lần
      const rawActionToken = generateOpaqueToken();
      const actionTokenHash = hashToken(rawActionToken);

      await redis.set(
        KEY.actionToken(actionTokenHash),
        JSON.stringify({ userId: user.id, scope: 'resolve_device_limit' }),
        'EX', 5 * 60 // 5 phút
      );

      const sessions = await getActiveSessionList(user.id);

      // Trả về 409 với action token và danh sách thiết bị
      const err = new AppError(
        'Đã đạt giới hạn 5 thiết bị. Vui lòng đăng xuất một thiết bị để tiếp tục.',
        409,
        ErrorCodes.DEVICE_LIMIT_EXCEEDED
      );
      (err as any).data = { actionToken: rawActionToken, sessions, meta };
      throw err;
    }

    // ── Tạo session bình thường ──────────────────
    const accessToken = TokenUtil.generateTokens(user.id, user.role, user.name).accessToken;
    const refreshToken = generateOpaqueToken();

    await createSession({ userId: user.id, refreshToken, ...meta });

    return {
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email, name: user.name, role: user.role, avatarUrl: user.avatarUrl },
    };
  },

  // 4. Logout — revoke session hiện tại bằng tokenHash
  logout: async (refreshToken: string) => {
    if (!refreshToken) return { message: 'Đăng xuất thành công' };

    const tokenHash = hashToken(refreshToken);
    // Revoke trong DB — fail silently nếu session không tìm thấy
    await prisma.userSession.updateMany({
      where: { tokenHash },
      data: { isRevoked: true },
    });

    return { message: 'Đăng xuất thành công' };
  },

  // 5. Refresh Token
  refresh: async (refreshToken: string) => {
    if (!refreshToken) {
      throw new AppError('Không tìm thấy Refresh Token', 401, ErrorCodes.TOKEN_INVALID);
    }

    const tokenHash = hashToken(refreshToken);
    const session = await prisma.userSession.findUnique({ where: { tokenHash } });

    if (!session) throw new AppError('Phiên đăng nhập không hợp lệ', 401, ErrorCodes.TOKEN_INVALID);
    if (session.isRevoked) throw new AppError('Phiên đăng nhập đã bị thu hồi', 401, ErrorCodes.SESSION_REVOKED);
    if (session.expiresAt < new Date()) throw new AppError('Phiên đăng nhập đã hết hạn', 401, ErrorCodes.TOKEN_EXPIRED);

    const user = await prisma.user.findUnique({ where: { id: session.userId } });
    if (!user || user.isBanned) throw new AppError('Blocked', 403, ErrorCodes.UNAUTHORIZED);

    // Cấp Access Token mới và cập nhật lastActiveAt
    const accessToken = TokenUtil.generateTokens(user.id, user.role, user.name).accessToken;
    await prisma.userSession.update({
      where: { tokenHash },
      data: { lastActiveAt: new Date() },
    });

    return { accessToken, user: { id: user.id, email: user.email, name: user.name, role: user.role, avatarUrl: user.avatarUrl } };
  },

  // 6. Resolve Device Limit — atomic: kick session cũ + tạo session mới trong 1 transaction
  resolveDeviceLimit: async (actionToken: string, sessionIdToRevoke: string, meta?: { userAgent?: string; ipAddress?: string }) => {
    const actionTokenHash = hashToken(actionToken);
    const redisKey = KEY.actionToken(actionTokenHash);

    // Validate Action Token
    const rawPayload = await redis.get(redisKey);
    if (!rawPayload) {
      throw new AppError('Action token không hợp lệ hoặc đã hết hạn', 401, ErrorCodes.ACTION_TOKEN_INVALID);
    }

    const payload = JSON.parse(rawPayload) as { userId: string; scope: string };

    // 1) Validate scope cố định
    if (payload.scope !== 'resolve_device_limit') {
      throw new AppError('Action token không đúng scope', 403, ErrorCodes.ACTION_TOKEN_INVALID);
    }

    // 2) Validate session thuộc về đúng userId (chống IDOR)
    const sessionToRevoke = await prisma.userSession.findFirst({
      where: { id: sessionIdToRevoke, userId: payload.userId },
    });
    if (!sessionToRevoke) {
      throw new AppError('Session không tồn tại hoặc không có quyền thu hồi', 404, ErrorCodes.SESSION_NOT_FOUND);
    }

    // 3) Invalidate Action Token ngay lập tức (dùng 1 lần)
    await redis.del(redisKey);

    // 4) Atomic: revoke session cũ + tạo session mới trong 1 Prisma transaction
    const newRefreshToken = generateOpaqueToken();
    const deviceInfo = parseUserAgent(meta?.userAgent);

    const [, , user] = await prisma.$transaction([
      // Revoke session được chọn
      prisma.userSession.update({
        where: { id: sessionIdToRevoke },
        data: { isRevoked: true },
      }),
      // Tạo session mới
      prisma.userSession.create({
        data: {
          userId: payload.userId,
          tokenHash: hashToken(newRefreshToken),
          deviceName: deviceInfo.deviceName,
          deviceType: deviceInfo.deviceType,
          os: deviceInfo.os,
          browser: deviceInfo.browser,
          ipAddress: meta?.ipAddress,
          expiresAt: getSessionExpiresAt(),
        },
      }),
      // Lấy thông tin user để cấp token
      prisma.user.findUniqueOrThrow({ where: { id: payload.userId } }),
    ]);

    const accessToken = TokenUtil.generateTokens(user.id, user.role, user.name).accessToken;

    return {
      accessToken,
      refreshToken: newRefreshToken,
      user: { id: user.id, email: user.email, name: user.name, role: user.role, avatarUrl: user.avatarUrl },
    };
  },

  // 7. Lấy danh sách session active của user (cho trang Cài đặt)
  getSessions: async (userId: string, currentRefreshToken?: string) => {
    const sessions = await getActiveSessionList(userId);

    // Đánh dấu thiết bị hiện tại
    const currentTokenHash = currentRefreshToken ? hashToken(currentRefreshToken) : null;

    return sessions.map(s => ({
      ...s,
      isCurrent: currentTokenHash
        ? prisma.userSession.findUnique({ where: { tokenHash: currentTokenHash } }).then(sess => sess?.id === s.id)
        : false,
    }));
  },

  // 7b. Lấy danh sách session (sync version, dùng trong controller)
  getSessionsSync: async (userId: string, currentTokenHash: string | null) => {
    const sessions = await getActiveSessionList(userId);

    let currentSessionId: string | null = null;
    if (currentTokenHash) {
      const currentSession = await prisma.userSession.findUnique({
        where: { tokenHash: currentTokenHash },
        select: { id: true },
      });
      currentSessionId = currentSession?.id ?? null;
    }

    return sessions.map(s => ({
      ...s,
      isCurrent: s.id === currentSessionId,
    }));
  },

  // 8. Revoke một session cụ thể (user tự đăng xuất từ xa từ trang Cài đặt)
  revokeSession: async (userId: string, sessionId: string) => {
    // Validate ownership — chống IDOR
    const session = await prisma.userSession.findFirst({
      where: { id: sessionId, userId, isRevoked: false },
    });

    if (!session) {
      throw new AppError('Session không tồn tại hoặc bạn không có quyền thu hồi', 404, ErrorCodes.SESSION_NOT_FOUND);
    }

    await prisma.userSession.update({
      where: { id: sessionId },
      data: { isRevoked: true },
    });

    return { message: 'Thiết bị đã được đăng xuất thành công.' };
  },

  // 9. Dọn dẹp session hết hạn / đã revoke (gọi theo lịch hoặc theo tần suất)
  cleanupExpiredSessions: async () => {
    const result = await prisma.userSession.deleteMany({
      where: {
        OR: [
          { isRevoked: true },
          { expiresAt: { lt: new Date() } },
        ],
      },
    });
    return { deletedCount: result.count };
  },

  // 10. 2FA Setup
  setup2FA: async (userId: string, _placeholder?: string) => {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new AppError('Người dùng không tồn tại', 404, ErrorCodes.NOT_FOUND);

    const secret = speakeasy.generateSecret({ name: `SpotifyClone (${user.email})` });
    if (!secret.otpauth_url) throw new AppError('Không thể tạo mã 2FA', 500, ErrorCodes.INTERNAL_ERROR);

    await prisma.user.update({ where: { id: userId }, data: { twoFactorSecret: secret.base32 } });
    const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url);

    return { secret: secret.base32, qrCodeUrl };
  },

  // 11. 2FA Verify
  verify2FA: async (userId: string, token: string) => {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.twoFactorSecret) throw new AppError('Chưa thiết lập 2FA', 400, ErrorCodes.VALIDATION_ERROR);

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token,
      window: 1,
    });

    if (!verified) throw new AppError('Mã TOTP không chính xác', 400, ErrorCodes.VALIDATION_ERROR);
    await prisma.user.update({ where: { id: userId }, data: { twoFactorEnabled: true } });

    return { message: 'Đã kích hoạt 2FA thành công' };
  },

  // 12. Forgot Password
  forgotPassword: async (email: string) => {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new AppError('Email không tồn tại trong hệ thống', 404, ErrorCodes.NOT_FOUND);

    const otp = OtpUtil.generateNumeric();
    await redis.set(KEY.otpPwd(email), otp, 'EX', 10 * 60);
    MailUtil.sendOTP(email, otp, 'Quên Mật Khẩu').catch(err => console.error('[Mail Error]', err));

    return { message: 'Yêu cầu thành công. Vui lòng kiểm tra mã OTP.' };
  },

  // 13. Reset Password
  resetPassword: async (data: any) => {
    const { email, otp, newPassword } = data;
    const cacheOtp = await redis.get(KEY.otpPwd(email));

    if (!cacheOtp || cacheOtp !== otp) {
      throw new AppError('Mã OTP không hợp lệ hoặc đã hết hạn', 400, ErrorCodes.VALIDATION_ERROR);
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { email }, data: { passwordHash } });
    await redis.del(KEY.otpPwd(email));

    return { message: 'Đặt lại mật khẩu thành công. Bạn có thể đăng nhập ngay.' };
  },

  // 14. Request Account Deletion
  requestAccountDeletion: async (userId: string, email: string) => {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new AppError('Không tìm thấy tài khoản', 404, ErrorCodes.NOT_FOUND);

    const otp = OtpUtil.generateNumeric();
    await redis.set(KEY.otpDelAcc(email), otp, 'EX', 10 * 60);
    MailUtil.sendOTP(email, otp, 'Xóa Tài Khoản').catch(err => console.error('[Mail Error]', err));

    return { message: 'Đã gửi mã xác nhận xóa tài khoản tới email của bạn.' };
  },

  // 15. Confirm Account Deletion
  confirmAccountDeletion: async (userId: string, email: string, otp: string) => {
    const cacheOtp = await redis.get(KEY.otpDelAcc(email));
    if (!cacheOtp || cacheOtp !== otp) {
      throw new AppError('Mã OTP không hợp lệ hoặc đã hết hạn', 400, ErrorCodes.VALIDATION_ERROR);
    }

    // Atomic: soft delete user + archive playlists + revoke tất cả sessions
    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { deletedAt: new Date() },
      }),
      prisma.playlist.updateMany({
        where: { ownerId: userId, isPublic: true },
        data: { isPublic: false },
      }),
      prisma.userSession.updateMany({
        where: { userId },
        data: { isRevoked: true },
      }),
    ]);

    await redis.del(KEY.otpDelAcc(email));

    return { message: 'Tài khoản của bạn đã được xóa thành công.' };
  },
};
