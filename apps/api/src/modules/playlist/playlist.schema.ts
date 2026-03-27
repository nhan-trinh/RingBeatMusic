import { z } from 'zod';

export const createPlaylistSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Tiêu đề không được để trống').max(100),
    description: z.string().max(500).optional(),
    isPublic: z.boolean().optional(),
  }),
});

export const updatePlaylistSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(100).optional(),
    description: z.string().max(500).optional(),
    coverUrl: z.string().url().optional(),
    isPublic: z.boolean().optional(),
  }),
});

export const addSongSchema = z.object({
  body: z.object({
    songId: z.string().uuid('ID bài hát không hợp lệ'),
    position: z.number().int().min(0).optional(),
  }),
});

export const reorderSongsSchema = z.object({
  body: z.object({
    songs: z.array(z.object({
      songId: z.string().uuid(),
      position: z.number().int().min(0),
    })),
  }),
});

export const addCollaboratorSchema = z.object({
  body: z.object({
    userId: z.string().uuid('ID người dùng không hợp lệ'),
  }),
});
