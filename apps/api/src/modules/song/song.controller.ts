import { Request, Response } from 'express';
import { SongService } from './song.service';
import { sendSuccess } from '../../shared/utils/response';
import { catchAsync } from '../../shared/utils/catch-async';

export const songController = {
  createMetadata: catchAsync(async (req: Request, res: Response) => {
    const user = req.user!;
    const result = await SongService.createSongMetadata(user.id, req.body);
    sendSuccess(res, result, 'Đã tạo metadata bài hát, vui lòng upload audio', 201);
  }),

  uploadComplete: catchAsync(async (req: Request, res: Response) => {
    const user = req.user!;
    const result = await SongService.uploadComplete(user.id, req.params.id);
    sendSuccess(res, result, 'Upload hoàn tất');
  }),

  getStreamUrl: catchAsync(async (req: Request, res: Response) => {
    // If not logged in, we reject them at middleware.
    const user = req.user!;
    const reqQuality = req.query.quality as string || '128';
    const result = await SongService.getStreamUrl(req.params.id, user.role, reqQuality);
    sendSuccess(res, result, 'Lấy stream URL thành công');
  }),

  getAll: catchAsync(async (_req: Request, res: Response) => {
    const result = await SongService.getMultiple();
    sendSuccess(res, result, 'Danh sách bài hát mới nổi');
  }),

  getArtistSongs: catchAsync(async (req: Request, res: Response) => {
    const result = await SongService.getMultiple(req.params.artistId);
    sendSuccess(res, result, 'Bài hát của nghệ sĩ');
  }),

  recordPlay: catchAsync(async (req: Request, res: Response) => {
    const result = await SongService.recordPlay(req.params.id);
    sendSuccess(res, result, 'Đã ghi nhận tương tác');
  }),

  likeSong: catchAsync(async (req: Request, res: Response) => {
    const user = req.user!;
    const result = await SongService.likeSong(user.id, req.params.id);
    sendSuccess(res, result, 'Đã thích');
  }),

  unlikeSong: catchAsync(async (req: Request, res: Response) => {
    const user = req.user!;
    const result = await SongService.unlikeSong(user.id, req.params.id);
    sendSuccess(res, result, 'Bỏ thích');
  }),
  
  getMockQueue: catchAsync(async (_req: Request, res: Response) => {
    const mockSongs = [
      {
        id: 'mock-1',
        title: 'Bản Nhạc Test 1',
        artistName: 'SoundHelix',
        coverUrl: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&q=80&w=200&h=200',
        audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
        duration: 372,
      },
      {
        id: 'mock-2',
        title: 'Bản Nhạc Test 2',
        artistName: 'SoundHelix',
        coverUrl: 'https://images.unsplash.com/photo-1493225457124-a1a2a5f5f9af?auto=format&fit=crop&q=80&w=200&h=200',
        audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
        duration: 425,
      },
      {
        id: 'mock-3',
        title: 'Bản Nhạc Test 3',
        artistName: 'SoundHelix',
        coverUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=200&h=200',
        audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
        duration: 344,
      },
      {
        id: 'mock-4',
        title: 'Bản Nhạc Test 4',
        artistName: 'SoundHelix',
        coverUrl: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&q=80&w=200&h=200',
        audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
        duration: 302,
      },
      {
        id: 'mock-5',
        title: 'Bản Nhạc Test 5',
        artistName: 'SoundHelix',
        coverUrl: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&q=80&w=200&h=200',
        audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
        duration: 353,
      }
    ];
    sendSuccess(res, mockSongs, 'Lấy mock queue thành công');
  }),
};
