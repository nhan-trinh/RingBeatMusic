import { z } from 'zod';

export const createSongSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Tiêu đề là bắt buộc'),
    genreId: z.string().uuid().optional().nullable(),
    albumId: z.string().uuid().optional().nullable(),
    coverUrl: z.string().url().optional().nullable(),
    lyrics: z.string().optional().nullable(),
  }),
});

export const updateSongSchema = z.object({
  body: z.object({
    title: z.string().min(1).optional(),
    coverUrl: z.string().url().optional().nullable(),
    lyrics: z.string().optional().nullable(),
  }),
});

export const streamSongSchema = z.object({
  query: z.object({
    quality: z.enum(['128', '320']).default('128'),
  }),
});
