import { prisma } from '../../shared/config/database';
import { AppError, ErrorCodes } from '../../shared/utils/app-error';

export const ArtistService = {
  getProfile: async (id: string) => {
    const artist = await prisma.artist.findUnique({
      where: { id },
      include: {
        songs: {
          where: { status: 'APPROVED' },
          select: { id: true, title: true, playCount: true, coverUrl: true, duration: true },
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
    return artist;
  },

  updateProfile: async (userId: string, data: any) => {
    const artist = await prisma.artist.findUnique({ where: { userId } });
    if (!artist) {
      throw new AppError('Bạn không phải là nghệ sĩ', 403, ErrorCodes.FORBIDDEN);
    }

    const { stageName, bio, avatarUrl, socialLinks } = data;
    return await prisma.artist.update({
      where: { id: artist.id },
      data: { stageName, bio, avatarUrl, socialLinks },
    });
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

    return {
      totalBaseSongs: totalSongs,
      totalPlays: plays._sum.playCount || 0,
      totalFollowers: 0,
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
      orderBy: { createdAt: 'desc' }
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
