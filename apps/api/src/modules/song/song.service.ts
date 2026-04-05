import { prisma } from '../../shared/config/database';
import { AppError, ErrorCodes } from '../../shared/utils/app-error';
import { SupabaseUtil } from '../../shared/utils/supabase.util';

export const SongService = {
  // 1. Tạo bài hát với URL trực tiếp (Demo mode - không cần Supabase upload)
  createSongWithUrl: async (userId: string, data: any) => {
    const artist = await prisma.artist.findUnique({ where: { userId } });
    if (!artist) throw new AppError('Chỉ nghệ sĩ mới được đăng bài', 403, ErrorCodes.FORBIDDEN);

    const song = await prisma.song.create({
      data: {
        title: data.title,
        genreId: data.genreId || null,
        albumId: data.albumId || null,
        coverUrl: data.coverUrl || null,
        lyrics: data.lyrics || null,
        language: data.language || null,
        duration: data.duration || 0,
        artistId: artist.id,
        audioUrl320: data.audioUrl || null,
        audioUrl128: data.audioUrl || null,
        // TODO Phase 7: đổi lại PENDING khi Moderator Panel hoàn thành
        status: 'APPROVED',
      },
    });

    return { songId: song.id, title: song.title, status: song.status };
  },

  // 2. Tạo Metadata + Trả về Upload URL (Production mode - Supabase)
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

  // 2.5: Upload trực tiếp file mp3 qua backend (thay vì FE upload s3 trực tiếp để cho dễ debug Phase 6)
  uploadSongFiles: async (userId: string, data: any, files: { [fieldname: string]: Express.Multer.File[] }) => {
    const artist = await prisma.artist.findUnique({ where: { userId } });
    if (!artist) throw new AppError('Chỉ nghệ sĩ mới được đăng bài', 403, ErrorCodes.FORBIDDEN);

    let coverUrl = null;
    if (files.cover?.[0]) {
      const ext = files.cover[0].mimetype.split('/')[1] || 'jpg';
      const cPath = `covers/${artist.id}/${Date.now()}.${ext}`;
      coverUrl = await SupabaseUtil.uploadBuffer('images', cPath, files.cover[0].buffer, files.cover[0].mimetype);
    } // fallback
    if (!coverUrl && data.coverUrl) { coverUrl = data.coverUrl; }

    // Tạo song record thô trước để lấy ID
    const song = await prisma.song.create({
      data: {
        title: data.title,
        genreId: data.genreId || null,
        albumId: data.albumId || null,
        coverUrl: coverUrl,
        lyrics: data.lyrics || null,
        language: data.language || null,
        duration: data.duration ? parseInt(data.duration) : 0,
        artistId: artist.id,
        // Tạo chưa có audio
        status: 'APPROVED', // Phase 6 = auto approve
      },
    });

    const audioExt = files.audio[0].mimetype.split('/')[1] || 'mp3';
    const aPath = `raw/${artist.id}/${song.id}.${audioExt}`;
    // upload audio
    const publicAudioUrl = await SupabaseUtil.uploadBuffer('audio', aPath, files.audio[0].buffer, files.audio[0].mimetype);

    // Update song with public URL
    await prisma.song.update({
      where: { id: song.id },
      data: {
        audioUrl320: publicAudioUrl,
        audioUrl128: publicAudioUrl,
      }
    });

    return { songId: song.id, title: song.title, status: 'APPROVED' };
  },

  // 2.6: Cập nhật bài hát
  updateSong: async (userId: string, songId: string, data: any, coverFile?: Express.Multer.File) => {
    const artist = await prisma.artist.findUnique({ where: { userId } });
    if (!artist) throw new AppError('Bạn không có quyền', 403, ErrorCodes.FORBIDDEN);

    const song = await prisma.song.findUnique({ where: { id: songId } });
    if (!song || song.artistId !== artist.id) throw new AppError('Bài hát không hợp lệ', 403, ErrorCodes.FORBIDDEN);

    let coverUrl = song.coverUrl;
    if (coverFile) {
      const ext = coverFile.mimetype.split('/')[1] || 'jpg';
      const cPath = `covers/${artist.id}/${Date.now()}.${ext}`;
      coverUrl = await SupabaseUtil.uploadBuffer('images', cPath, coverFile.buffer, coverFile.mimetype);
    }

    const updated = await prisma.song.update({
      where: { id: songId },
      data: {
        title: data.title || song.title,
        coverUrl,
        lyrics: data.lyrics !== undefined ? data.lyrics : song.lyrics,
        albumId: data.albumId !== undefined ? (data.albumId || null) : song.albumId,
      }
    });
    return updated;
  },

  // 2.7: Xóa bài hát
  deleteSong: async (userId: string, songId: string) => {
    const artist = await prisma.artist.findUnique({ where: { userId } });
    if (!artist) throw new AppError('Bạn không có quyền', 403, ErrorCodes.FORBIDDEN);

    const song = await prisma.song.findUnique({ where: { id: songId } });
    if (!song || song.artistId !== artist.id) throw new AppError('Bài hát không hợp lệ', 403, ErrorCodes.FORBIDDEN);

    // Xóa liked/playlists reference
    await prisma.likedSong.deleteMany({ where: { songId } });
    await prisma.playlistSong.deleteMany({ where: { songId } });
    await (prisma as any).playHistory?.deleteMany({ where: { songId } }).catch(() => {});

    await prisma.song.delete({ where: { id: songId } });
    return { message: 'Đã xóa bài hát' };
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
