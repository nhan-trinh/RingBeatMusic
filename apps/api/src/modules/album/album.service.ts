import { prisma } from '../../shared/config/database';
import { AppError, ErrorCodes } from '../../shared/utils/app-error';
import { SupabaseUtil } from '../../shared/utils/supabase.util';

export const AlbumService = {
  createAlbum: async (userId: string, data: any) => {
    const artist = await prisma.artist.findUnique({ where: { userId } });
    if (!artist) throw new AppError('Bạn không phải là nghệ sĩ', 403, ErrorCodes.FORBIDDEN);

    return await prisma.album.create({
      data: {
        title: data.title,
        coverUrl: data.coverUrl || null,
        releaseDate: data.releaseDate ? new Date(data.releaseDate) : null,
        artistId: artist.id,
        // TODO Phase 7: đổi lại DRAFT khi Moderator Panel hoàn thành
        status: 'PUBLISHED',
      },
    });
  },

  getAlbum: async (albumId: string) => {
    const album = await prisma.album.findUnique({
      where: { id: albumId },
      include: {
        artist: { select: { id: true, stageName: true, avatarUrl: true, isVerified: true } },
        songs: {
          select: {
            id: true,
            title: true,
            duration: true,
            playCount: true,
            coverUrl: true,
            artistId: true,
            audioUrl128: true,
            audioUrl320: true,
            status: true,
          },
          where: { status: 'APPROVED' },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!album) throw new AppError('Không tìm thấy album', 404, ErrorCodes.NOT_FOUND);
    return album;
  },

  updateAlbum: async (userId: string, albumId: string, data: any) => {
    const artist = await prisma.artist.findUnique({ where: { userId } });
    if (!artist) throw new AppError('Bạn không phải là nghệ sĩ', 403, ErrorCodes.FORBIDDEN);

    const album = await prisma.album.findUnique({ where: { id: albumId } });
    if (!album || album.artistId !== artist.id) {
      throw new AppError('Album không tồn tại hoặc không thuộc quyền sở hữu', 403, ErrorCodes.FORBIDDEN);
    }

    return await prisma.album.update({
      where: { id: albumId },
      data,
    });
  },

  deleteAlbum: async (userId: string, albumId: string) => {
    const userRole = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    const artist = await prisma.artist.findUnique({ where: { userId } });

    const album = await prisma.album.findUnique({ where: { id: albumId } });
    if (!album) throw new AppError('Album không tồn tại', 404, ErrorCodes.NOT_FOUND);

    // Admin or Owner can delete
    if (userRole?.role !== 'ADMIN' && album.artistId !== artist?.id) {
      throw new AppError('Bạn không có quyền xóa album này', 403, ErrorCodes.FORBIDDEN);
    }

    await prisma.album.delete({ where: { id: albumId } });
    return { message: 'Đã xóa album thành công' };
  },

  uploadCover: async (userId: string, albumId: string, file: Express.Multer.File) => {
    const artist = await prisma.artist.findUnique({ where: { userId } });
    if (!artist) throw new AppError('Không phải nghệ sĩ', 403, ErrorCodes.FORBIDDEN);

    const album = await prisma.album.findUnique({ where: { id: albumId } });
    if (!album || album.artistId !== artist.id) {
      throw new AppError('Album không hợp lệ', 403, ErrorCodes.FORBIDDEN);
    }

    const ext = file.mimetype.split('/')[1] || 'jpg';
    const filePath = `album-covers/${albumId}.${ext}`;
    const coverUrl = await SupabaseUtil.uploadBuffer('images', filePath, file.buffer, file.mimetype);

    await prisma.album.update({ where: { id: albumId }, data: { coverUrl } });
    return { coverUrl };
  },

  addSongToAlbum: async (userId: string, albumId: string, songId: string) => {
    const artist = await prisma.artist.findUnique({ where: { userId } });
    if (!artist) throw new AppError('Bạn không phải là nghệ sĩ', 403, ErrorCodes.FORBIDDEN);

    const album = await prisma.album.findUnique({ where: { id: albumId } });
    if (!album || album.artistId !== artist.id) {
      throw new AppError('Album không hợp lệ', 403, ErrorCodes.FORBIDDEN);
    }

    // Assign albumId to song
    await prisma.song.update({
      where: { id: songId, artistId: artist.id },
      data: { albumId },
    });

    return { message: 'Đã gán bài hát vào album' };
  },

  reorderSongs: async (_albumId: string, _artistId: string, _songs: {songId: string, _position: number}[]) => {
     // TODO: Implement later if needed.
     return { message: 'Reordered' };
  },

  follow: async (userId: string, albumId: string) => {
    try {
      await prisma.followedAlbum.create({
        data: { userId, albumId }
      });
    } catch {
       // Already followed
    }
    return { followed: true };
  },

  unfollow: async (userId: string, albumId: string) => {
    try {
      await prisma.followedAlbum.delete({
        where: { userId_albumId: { userId, albumId } }
      });
    } catch {
       // Ignore if not followed
    }
    return { followed: false };
  },

  removeSongFromAlbum: async (userId: string, albumId: string, songId: string) => {
    const artist = await prisma.artist.findUnique({ where: { userId } });
    if (!artist) throw new AppError('Bạn không phải là nghệ sĩ', 403, ErrorCodes.FORBIDDEN);

    const album = await prisma.album.findUnique({ where: { id: albumId } });
    if (!album || album.artistId !== artist.id) {
      throw new AppError('Album không hợp lệ', 403, ErrorCodes.FORBIDDEN);
    }

    // Unassign albumId
    await prisma.song.update({
      where: { id: songId, artistId: artist.id, albumId },
      data: { albumId: null },
    });

    return { message: 'Đã gỡ bài hát khỏi album' };
  },
};
