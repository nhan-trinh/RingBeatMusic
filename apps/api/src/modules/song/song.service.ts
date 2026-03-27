import { prisma } from '../../shared/config/database';
import { AppError, ErrorCodes } from '../../shared/utils/app-error';
import { SupabaseUtil } from '../../shared/utils/supabase.util';

export const SongService = {
  // 1. Khởi tạo Metadata + Trả về Upload URL
  createSongMetadata: async (userId: string, data: any) => {
    const artist = await prisma.artist.findUnique({ where: { userId } });
    if (!artist) throw new AppError('Chỉ nghệ sĩ mới được đăng bài', 403, ErrorCodes.FORBIDDEN);

    const song = await prisma.song.create({
      data: {
        title: data.title,
        genreId: data.genreId || null,
        albumId: data.albumId || null,
        coverUrl: data.coverUrl || null,
        lyrics: data.lyrics || null,
        duration: 0,
        artistId: artist.id,
        status: 'PENDING',
      },
    });

    const filePath = `raw/${artist.id}/${song.id}.mp3`;
    const uploadResult = await SupabaseUtil.createUploadUrl('audio', filePath);

    return {
      songId: song.id,
      uploadUrl: uploadResult.signedUrl,
      path: uploadResult.path,
    };
  },

  // 2. Callback sau khi FE upload thô xong lên Supabase
  uploadComplete: async (userId: string, songId: string) => {
    const artist = await prisma.artist.findUnique({ where: { userId } });
    if (!artist) throw new AppError('Chỉ nghệ sĩ mới có quyền', 403, ErrorCodes.FORBIDDEN);

    const song = await prisma.song.findUnique({ where: { id: songId } });
    if (!song || song.artistId !== artist.id) {
      throw new AppError('Bài hát không tồn tại', 404, ErrorCodes.NOT_FOUND);
    }

    // TODO: Emit message Queue gửi sang worker FFmpeg
    // Tạm thời coi như upload thành công và chờ duyệt
    
    return { message: 'Đã ghi nhận tệp âm thanh, bài hát đang chờ được xử lý và kiểm duyệt' };
  },

  // 3. Lấy stream URL (Bảo vệ bằng Roles)
  getStreamUrl: async (songId: string, role: string, requiredQuality: string) => {
    const song = await prisma.song.findUnique({ where: { id: songId } });
    if (!song) throw new AppError('Bài hát không tồn tại', 404, ErrorCodes.NOT_FOUND);

    if (song.status !== 'APPROVED') {
      throw new AppError('Bài hát chưa được công khai', 403, ErrorCodes.FORBIDDEN);
    }

    // Role check logic
    let playbackQuality = '128';
    if (requiredQuality === '320' && ['PREMIUM', 'ADMIN', 'ARTIST'].includes(role)) {
      playbackQuality = '320';
    }

    // Chọn URL gốc tuỳ vào chất lượng (fallback 128 nếu chưa có 320)
    const storedPath = playbackQuality === '320' && song.audioUrl320 ? song.audioUrl320 : song.audioUrl128;
    
    if (!storedPath) {
      throw new AppError('File âm thanh chưa sẵn sàng', 404, ErrorCodes.NOT_FOUND);
    }

    // Trả về Signed URL từ bucket process audio (thời hạn 1 giờ)
    const streamUrl = await SupabaseUtil.createStreamUrl('audio', storedPath, 3600);

    return { streamUrl, quality: playbackQuality, expiresAt: new Date(Date.now() + 3600 * 1000) };
  },

  // 4. Lấy danh sách bài hát (Public/Admin filter)
  getMultiple: async (artistId?: string) => {
    const filter = artistId ? { artistId, status: 'APPROVED' } : { status: 'APPROVED' };
    return await prisma.song.findMany({
      where: filter as any,
      take: 50,
      orderBy: { playCount: 'desc' },
      select: { id: true, title: true, duration: true, playCount: true, coverUrl: true, artist: { select: { stageName: true } } }
    });
  },

  // 5. Ghi nhận PlayCount (Gọi sau ~30 giây nghe)
  recordPlay: async (songId: string) => {
    await prisma.song.update({
      where: { id: songId },
      data: { playCount: { increment: 1 } },
    });
    return { message: 'Recorded' };
  },

  // 6. Like song
  likeSong: async (userId: string, songId: string) => {
    const exists = await prisma.likedSong.findUnique({
      where: { userId_songId: { userId, songId } },
    });
    
    if (!exists) {
      await prisma.$transaction([
        prisma.likedSong.create({ data: { userId, songId } }),
        prisma.song.update({ where: { id: songId }, data: { likeCount: { increment: 1 } } })
      ]);
    }
    return { message: 'Liked' };
  },

  // 7. Unlike song
  unlikeSong: async (userId: string, songId: string) => {
    const exists = await prisma.likedSong.findUnique({
      where: { userId_songId: { userId, songId } },
    });
    
    if (exists) {
      await prisma.$transaction([
        prisma.likedSong.delete({ where: { userId_songId: { userId, songId } } }),
        prisma.song.update({ where: { id: songId }, data: { likeCount: { decrement: 1 } } })
      ]);
    }
    return { message: 'Unliked' };
  },
};
