import { z } from 'zod';

export const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Tên phải dài ít nhất 2 ký tự').max(100).optional(),
    bio: z.string().max(300, 'Tiểu sử không quá 300 ký tự').optional(), // Only for Artist/Host later
    gender: z.enum(['man', 'woman', 'non-binary', 'prefer_not_to_say']).optional(),
  }),
});

export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1, 'Mật khẩu hiện tại là bắt buộc'),
    newPassword: z
      .string()
      .min(10, 'Mật khẩu phải dài tối thiểu 10 ký tự')
      .regex(/[a-zA-Z]/, 'Mật khẩu phải chứa ít nhất 1 chữ cái')
      .regex(/[\d\W]/, 'Mật khẩu phải chứa ít nhất 1 số hoặc ký tự đặc biệt'),
  }),
});
