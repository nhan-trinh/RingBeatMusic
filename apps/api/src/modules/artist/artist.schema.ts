import { z } from 'zod';

export const updateArtistSchema = z.object({
  body: z.object({
    stageName: z.string().min(2, 'Nghệ danh phải dài ít nhất 2 ký tự').max(100).optional(),
    bio: z.string().max(1000, 'Giới thiệu không quá 1000 ký tự').optional().nullable(),
    avatarUrl: z.string().optional().nullable(), // Avatar được update qua /me/avatar riêng
    socialLinks: z.any().optional(),
  }),
});
