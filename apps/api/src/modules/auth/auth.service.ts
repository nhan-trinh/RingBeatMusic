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

const LOGIN_ATTEMPTS_PREFIX = 'login_attempts:';
const OTP_PREFIX = 'otp:';
const BLACKLIST_PREFIX = 'blacklist:';
const REFRESH_PREFIX = 'refresh_token:';
const PENDING_USER_PREFIX = 'pending_user:';

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
        // Dọn dẹp tài khoản rác chưa kích hoạt từ phiên bản cũ (nếu có)
        await prisma.user.delete({ where: { email } });
      } else {
        throw new AppError('Email đã được đăng ký', 400, ErrorCodes.ALREADY_EXISTS);
      }
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const pendingUser = {
      email,
      passwordHash,
      name,
      dateOfBirth: new Date(dateOfBirth).toISOString(),
      gender,
    };

    // Lưu vào Redis (10 phút) thay vì phi thẳng vào DB PostgreSQL gây rác
    await redis.set(`${PENDING_USER_PREFIX}${email}`, JSON.stringify(pendingUser), 'EX', 10 * 60);

    const otp = OtpUtil.generateNumeric();
    await redis.set(`${OTP_PREFIX}${email}`, otp, 'EX', 10 * 60);

    // Gửi email thật qua Nodemailer ngầm trong background (Fire-and-forget)
    MailUtil.sendOTP(email, otp, 'Đăng Ký').catch(err => console.error('[Mail Error]', err));

    return { message: 'Vui lòng kiểm tra email để xác thực tài khoản' };
  },

  // 2. Verify Email
  verifyEmail: async (email: string, otp: string) => {
    const cacheOtp = await redis.get(`${OTP_PREFIX}${email}`);
    if (!cacheOtp || cacheOtp !== otp) {
      throw new AppError('Mã OTP không hợp lệ hoặc đã hết hạn', 400, ErrorCodes.VALIDATION_ERROR);
    }

    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      // Đọc User Đang Chờ từ Redis
      const pendingUserStr = await redis.get(`${PENDING_USER_PREFIX}${email}`);
      if (!pendingUserStr) {
        throw new AppError('Dữ liệu đăng ký đã hết hạn. Vui lòng đăng ký lại.', 400, ErrorCodes.VALIDATION_ERROR);
      }
      
      const pendingUser = JSON.parse(pendingUserStr);
      
      // Tạo User vào DB chính thức
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

      // Cleanup
      await redis.del(`${PENDING_USER_PREFIX}${email}`);
    } else {
      // Dành cho trường hợp hiếm nếu user đã bị tạo rác từ trước khi Refactor
      user = await prisma.user.update({
        where: { email },
        data: { isEmailVerified: true },
      });
    }

    await redis.del(`${OTP_PREFIX}${email}`);
    const tokens = TokenUtil.generateTokens(user.id, user.role);
    await redis.set(`${REFRESH_PREFIX}${user.id}`, tokens.refreshToken, 'EX', 30 * 24 * 60 * 60);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id, email: user.email, name: user.name,
        role: user.role, avatarUrl: user.avatarUrl,
      },
    };
  },

  // 3. Login
  login: async (data: any) => {
    const { email, password } = data;
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      throw new AppError('Email hoặc mật khẩu không đúng', 401, ErrorCodes.INVALID_CREDENTIALS);
    }

    if (user.isBanned) {
      throw new AppError(`Tài khoản đã bị khóa! Lý do: ${user.banReason || 'Vi phạm tiêu chuẩn cộng đồng'}`, 403, ErrorCodes.FORBIDDEN);
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new AppError('Tài khoản đã bị khóa tạm thời', 403, ErrorCodes.ACCOUNT_LOCKED);
    }

    if (!user.isEmailVerified) {
      throw new AppError('Vui lòng xác thực email', 403, ErrorCodes.EMAIL_NOT_VERIFIED);
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash || '');
    if (!isMatch) {
      const attempts = await redis.incr(`${LOGIN_ATTEMPTS_PREFIX}${email}`);
      if (attempts === 1) await redis.expire(`${LOGIN_ATTEMPTS_PREFIX}${email}`, 15 * 60);

      if (attempts >= 5) {
        await prisma.user.update({
          where: { email },
          data: { lockedUntil: new Date(Date.now() + 15 * 60 * 1000) },
        });
        throw new AppError('Khóa tài khoản 15 phút do sai quá nhiều', 403, ErrorCodes.ACCOUNT_LOCKED);
      }
      throw new AppError('Email hoặc mật khẩu không đúng', 401, ErrorCodes.INVALID_CREDENTIALS);
    }

    await redis.del(`${LOGIN_ATTEMPTS_PREFIX}${email}`);
    await prisma.user.update({ where: { email }, data: { lockedUntil: null, loginAttempts: 0 } });

    if (user.twoFactorEnabled) {
      const tempToken = jwt.sign({ sub: user.id, isTemp2FA: true }, env.JWT_ACCESS_SECRET, { expiresIn: '5m' });
      return { requiresTwoFactor: true, tempToken };
    }

    const tokens = TokenUtil.generateTokens(user.id, user.role);
    await redis.set(`${REFRESH_PREFIX}${user.id}`, tokens.refreshToken, 'EX', 30 * 24 * 60 * 60);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: { id: user.id, email: user.email, name: user.name, role: user.role, avatarUrl: user.avatarUrl },
    };
  },

  // 4. Logout
  logout: async (userId: string, jti: string, exp: number) => {
    const expiresIn = exp - Math.floor(Date.now() / 1000);
    if (expiresIn > 0) {
      await redis.set(`${BLACKLIST_PREFIX}${jti}`, '1', 'EX', expiresIn);
    }
    await redis.del(`${REFRESH_PREFIX}${userId}`);
    return { message: 'Đăng xuất thành công' };
  },

  // 5. Refresh Setup
  refresh: async (refreshToken: string) => {
    if (!refreshToken) {
      throw new AppError('Không tìm thấy Refresh Token', 401, ErrorCodes.TOKEN_INVALID);
    }
    const payload = TokenUtil.verifyRefreshToken(refreshToken);

    if (payload.jti) {
      const isBlacklisted = await redis.get(`${BLACKLIST_PREFIX}${payload.jti}`);
      if (isBlacklisted) throw new AppError('Token thu hồi', 401, ErrorCodes.TOKEN_INVALID);
    }

    const savedToken = await redis.get(`${REFRESH_PREFIX}${payload.sub}`);
    if (!savedToken || savedToken !== refreshToken) {
      throw new AppError('Đã đăng xuất', 401, ErrorCodes.TOKEN_INVALID);
    }

    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || user.isBanned) throw new AppError('Blocked', 403, ErrorCodes.UNAUTHORIZED);

    const tokens = TokenUtil.generateTokens(user.id, user.role);
    await redis.set(`${REFRESH_PREFIX}${user.id}`, tokens.refreshToken, 'EX', 7 * 24 * 60 * 60);

    return { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken };
  },

  // 6. 2FA Setup
  setup2FA: async (userId: string, _placeholder?: string) => {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new AppError('Người dùng không tồn tại', 404, ErrorCodes.NOT_FOUND);

    const secret = speakeasy.generateSecret({ name: `SpotifyClone (${user.email})` });

    if (!secret.otpauth_url) {
      throw new AppError('Không thể tạo mã 2FA', 500, ErrorCodes.INTERNAL_ERROR);
    }

    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorSecret: secret.base32 },
    });

    const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url);

    return { secret: secret.base32, qrCodeUrl };
  },

  // 7. 2FA Verify
  verify2FA: async (userId: string, token: string) => {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.twoFactorSecret) {
      throw new AppError('Chưa thiết lập 2FA', 400, ErrorCodes.VALIDATION_ERROR);
    }

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token,
      window: 1,
    });

    if (!verified) throw new AppError('Mã TOTP không chính xác', 400, ErrorCodes.VALIDATION_ERROR);

    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: true },
    });

    return { message: 'Đã kích hoạt 2FA thành công' };
  },

  // 8. Forgot Password
  forgotPassword: async (email: string) => {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new AppError('Email không tồn tại trong hệ thống', 404, ErrorCodes.NOT_FOUND);

    const otp = OtpUtil.generateNumeric();
    await redis.set(`${OTP_PREFIX}pwd_${email}`, otp, 'EX', 10 * 60);

    // Gửi mail ngầm
    MailUtil.sendOTP(email, otp, 'Quên Mật Khẩu').catch(err => console.error('[Mail Error]', err));

    return { message: 'Yêu cầu thành công. Vui lòng kiểm tra mã OTP.' };
  },

  // 9. Reset Password
  resetPassword: async (data: any) => {
    const { email, otp, newPassword } = data;
    const cacheOtp = await redis.get(`${OTP_PREFIX}pwd_${email}`);
    
    if (!cacheOtp || cacheOtp !== otp) {
      throw new AppError('Mã OTP không hợp lệ hoặc đã hết hạn', 400, ErrorCodes.VALIDATION_ERROR);
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { email }, data: { passwordHash } });
    await redis.del(`${OTP_PREFIX}pwd_${email}`);

    return { message: 'Đặt lại mật khẩu thành công. Bạn có thể đăng nhập ngay.' };
  },
};


