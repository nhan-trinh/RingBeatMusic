import { z } from 'zod';
import dayjs from 'dayjs';

// Tính toán ngày 13 năm trước so với ngày hiện tại (validate tuổi)
const maxBirthDate = dayjs().subtract(13, 'year').toDate();

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Email không hợp lệ'),
    password: z
      .string()
      .min(10, 'Mật khẩu phải dài tối thiểu 10 ký tự')
      .regex(/[a-zA-Z]/, 'Mật khẩu phải chứa ít nhất 1 chữ cái')
      .regex(/[\d\W]/, 'Mật khẩu phải chứa ít nhất 1 số hoặc ký tự đặc biệt'),
    name: z.string().min(2, 'Tên phải dài ít nhất 2 ký tự').max(100),
    dateOfBirth: z.coerce.date().max(maxBirthDate, 'Bạn phải từ 13 tuổi trở lên để đăng ký'),
    gender: z.enum(['man', 'woman', 'non-binary', 'prefer_not_to_say']).optional(),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Email không cho phép'),
    password: z.string().min(1, 'Mật khẩu là bắt buộc'),
  }),
});

export const verifyEmailSchema = z.object({
  body: z.object({
    email: z.string().email('Email không hợp lệ'),
    otp: z.string().length(6, 'OTP phải đủ 6 chữ số'),
  }),
});

export const resendOtpSchema = z.object({
  body: z.object({
    email: z.string().email('Email không hợp lệ'),
  }),
});

// refreshSchema giờ không cần refreshToken trong body vì được đọc từ HttpOnly Cookie
export const refreshSchema = z.object({
  body: z.object({}).optional(),
});

// Google OAuth Login payload (if handled by BE via explicit body)
export const googleLoginSchema = z.object({
  body: z.object({
    idToken: z.string().min(1, 'idToken là bắt buộc'),
    name: z.string().optional(),
    avatarUrl: z.string().url().optional(),
  }),
});

export const verify2FASchema = z.object({
  body: z.object({
    email: z.string().email('Email không hợp lệ'),
    token: z.string().length(6, 'Mã TOTP phải gồm 6 chữ số'),
  }),
});

export const confirmDeleteAccountSchema = z.object({
  body: z.object({
    code: z.string().length(6, 'Mã OTP phải đủ 6 chữ số'),
  }),
});

export const resolveDeviceLimitSchema = z.object({
  body: z.object({
    actionToken: z.string().min(1, 'Action token là bắt buộc'),
    // '__all__' = revoke toàn bộ session, hoặc UUID cụ thể
    sessionId: z.union([
      z.string().uuid('sessionId không hợp lệ'),
      z.literal('__all__'),
    ]),
  }),
});

