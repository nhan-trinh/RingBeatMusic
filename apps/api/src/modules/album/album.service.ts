import { prisma } from '../../shared/config/database';
import { AppError, ErrorCodes } from '../../shared/utils/app-error';

export const AlbumService = {
  createAlbum: async (userId: string, data: any) => {
    const artist = await prisma.artist.findUnique({ where: { userId } });
    if (!artist) throw new AppError('Bạn không phải là nghệ sĩ', 403, ErrorCodes.FORBIDDEN);

    return await prisma.album.create({
      data: {
        title: data.title,
        coverUrl: data.coverUrl,
        releaseDate: data.releaseDate ? new Date(data.releaseDate) : null,
        artistId: artist.id,
        status: 'DRAFT',
      },
    });
  },

  getAlbum: async (albumId: string) => {
    const album = await prisma.album.findUnique({
      where: { id: albumId },
      include: {
        artist: { select: { id: true, stageName: true, avatarUrl: true } },
        songs: {
          select: { id: true, title: true, duration: true, playCount: true, status: true },
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
