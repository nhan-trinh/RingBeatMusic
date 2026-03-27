import { z } from 'zod';

export const createAlbumSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Tiêu đề không được để trống'),
    coverUrl: z.string().url().optional(),
    releaseDate: z.coerce.date().optional(),
  }),
});

export const updateAlbumSchema = z.object({
  body: z.object({
    title: z.string().min(1).optional(),
    coverUrl: z.string().url().optional(),
    releaseDate: z.coerce.date().optional(),
    status: z.enum(['DRAFT', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED']).optional(),
  }),
});

export const addSongToAlbumSchema = z.object({
  body: z.object({
    songId: z.string().uuid('ID bài hát không hợp lệ'),
  }),
});
