import { prisma } from '../../shared/config/database';
import { AppError, ErrorCodes } from '../../shared/utils/app-error';
import { SupabaseUtil } from '../../shared/utils/supabase.util';

export const ArtistService = {
  getProfile: async (id: string) => {
    const artist = await prisma.artist.findUnique({
      where: { id },
      include: {
        songs: {
          where: { status: 'APPROVED' },
          select: { 
            id: true, title: true, playCount: true, coverUrl: true, 
            audioUrl320: true, audioUrl128: true, canvasUrl: true, 
            duration: true, artistId: true, 
            artist: { select: { id: true, stageName: true } } 
          },
          take: 10,
          orderBy: { playCount: 'desc' }
        },
        albums: {
          where: { status: 'PUBLISHED' },
          select: { id: true, title: true, coverUrl: true, releaseDate: true }
        },
      },
    });

    if (!artist) {
      throw new AppError('Nghệ sĩ không tồn tại', 404, ErrorCodes.NOT_FOUND);
    }
    
    // Map song array object for frontend UI
    const formattedSongs = artist.songs.map((song) => ({
      songId: song.id,
      audioUrl: song.audioUrl320 || song.audioUrl128 || '',
      song: {
        id: song.id,
        title: song.title,
        duration: song.duration,
        playCount: song.playCount,
        coverUrl: song.coverUrl,
        audioUrl320: song.audioUrl320,
        audioUrl128: song.audioUrl128,
        canvasUrl: song.canvasUrl,
        artistId: song.artistId,
        artist: song.artist
      }
    }));

    return { ...artist, followersCount: 125000, songs: formattedSongs };
  },

  setupProfile: async (userId: string, data: any) => {
    const existing = await prisma.artist.findUnique({ where: { userId } });
    if (existing) {
      // Đã tồn tại → trả về lược kèm flag
      return { ...existing, alreadyExists: true };
    }
    const artist = await prisma.artist.create({
      data: {
        userId,
        stageName: data.stageName || 'Nghệ sĩ mới',
        bio: data.bio || null,
        avatarUrl: data.avatarUrl || null,
        isVerified: false,
      },
    });
    return { ...artist, alreadyExists: false };
  },

  getMyProfile: async (userId: string) => {
    const artist = await prisma.artist.findUnique({
      where: { userId },
      select: {
        id: true, stageName: true, bio: true, avatarUrl: true,
        isVerified: true, socialLinks: true, userId: true,
        _count: { select: { songs: true, followedBy: true } },
      },
    });
    if (!artist) throw new AppError('Chưa có Artist Profile', 404, ErrorCodes.NOT_FOUND);
    return artist;
  },

  uploadAvatar: async (userId: string, file: Express.Multer.File) => {
    const artist = await prisma.artist.findUnique({ where: { userId } });
    if (!artist) throw new AppError('Không tìm thấy artist', 404, ErrorCodes.NOT_FOUND);

    const ext = file.mimetype.split('/')[1] || 'jpg';
    const filePath = `avatars/${artist.id}.${ext}`;
    const avatarUrl = await SupabaseUtil.uploadBuffer('images', filePath, file.buffer, file.mimetype);

    // 1. Cập nhật Artist profile
    await prisma.artist.update({
      where: { id: artist.id },
      data: { avatarUrl },
    });

    // 2. Đồng bộ ngược sang User profile
    await prisma.user.update({
      where: { id: userId },
      data: { avatarUrl },
    });

    return { avatarUrl };
  },

  updateProfile: async (userId: string, data: any) => {
    const artist = await prisma.artist.findUnique({ where: { userId } });
    if (!artist) {
      throw new AppError('Bạn không phải là nghệ sĩ', 403, ErrorCodes.FORBIDDEN);
    }

    const { stageName, bio, avatarUrl, socialLinks } = data;
    
    // 1. Cập nhật Artist profile
    const updatedArtist = await prisma.artist.update({
      where: { id: artist.id },
      data: { stageName, bio, avatarUrl, socialLinks },
    });

    // 2. Đồng bộ ngược sang User profile (chủ yếu là StageName -> Name)
    if (stageName) {
      await prisma.user.update({
        where: { id: userId },
        data: { name: stageName }
      });
    }

    return updatedArtist;
  },

  getAnalytics: async (userId: string) => {
    const artist = await prisma.artist.findUnique({ where: { userId } });
    if (!artist) {
      throw new AppError('Không tìm thấy thông tin artist', 404, ErrorCodes.NOT_FOUND);
    }

    const totalSongs = await prisma.song.count({ where: { artistId: artist.id } });
    const plays = await prisma.song.aggregate({
      where: { artistId: artist.id },
      _sum: { playCount: true },
    });
    const followers = await prisma.followedArtist.count({
      where: { artistId: artist.id },
    });

    return {
      totalBaseSongs: totalSongs,
      totalPlays: plays._sum.playCount || 0,
      totalFollowers: followers,
      playsByDay: [{ date: new Date().toISOString().split('T')[0], plays: plays._sum.playCount || 0 }],
      topSongs: [], 
    };
  },

  requestVerification: async (userId: string) => {
    const artist = await prisma.artist.findUnique({ where: { userId } });
    if (!artist) throw new AppError('Truy cập bị từ chối', 403, ErrorCodes.FORBIDDEN);
    
    if (artist.isVerified) {
      throw new AppError('Hồ sơ đã được Verified', 400, ErrorCodes.VALIDATION_ERROR);
    }

    return { message: 'Đã gửi yêu cầu cấp thẻ Verified cho Admin.' };
  },

  follow: async (userId: string, artistId: string) => {
    try {
      await prisma.followedArtist.create({ data: { userId, artistId } });
    } catch {
      // Bỏ qua lỗi duplicate
    }
    return { followed: true };
  },

  unfollow: async (userId: string, artistId: string) => {
    try {
      await prisma.followedArtist.delete({ where: { userId_artistId: { userId, artistId } } });
    } catch { }
    return { followed: false };
  },

  getMySongs: async (userId: string) => {
    const artist = await prisma.artist.findUnique({ where: { userId } });
    if (!artist) throw new AppError('Bạn không phải là nghệ sĩ', 403, ErrorCodes.FORBIDDEN);

    return await prisma.song.findMany({
      where: { artistId: artist.id },
      orderBy: { createdAt: 'desc' },
      include: { album: { select: { title: true } } }
    });
  },

  getMyAlbums: async (userId: string) => {
    const artist = await prisma.artist.findUnique({ where: { userId } });
    if (!artist) throw new AppError('Bạn không phải là nghệ sĩ', 403, ErrorCodes.FORBIDDEN);

    return await prisma.album.findMany({
      where: { artistId: artist.id },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { songs: true } },
        songs: {
          take: 1,
          select: { coverUrl: true },
          where: { coverUrl: { not: null } },
        },
      },
    });
  },
  
  getMultiple: async () => {
    return await prisma.artist.findMany({
      take: 20,
      orderBy: { createdAt: 'desc' },
      select: { id: true, stageName: true, avatarUrl: true, isVerified: true }
    });
  }
};
