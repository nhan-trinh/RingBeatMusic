import { prisma } from '../../shared/config/database';
import { AppError, ErrorCodes } from '../../shared/utils/app-error';

export const PlaylistService = {
  // 1. Tạo Playlist
  createPlaylist: async (userId: string, data: any, role: string) => {
    // Check limit cho khach FREE
    if (role === 'USER_FREE') {
      const count = await prisma.playlist.count({ where: { ownerId: userId } });
      if (count >= 10) {
        throw new AppError('Tài khoản Free chỉ được tạo tối đa 10 playlist. Vui lòng nâng cấp Premium.', 403, ErrorCodes.FORBIDDEN);
      }
    }

    return await prisma.playlist.create({
      data: {
        title: data.title,
        description: data.description,
        isPublic: data.isPublic || false,
        ownerId: userId,
      },
    });
  },

  // 2. Lấy Playlist cá nhân
  getMine: async (userId: string) => {
    return await prisma.playlist.findMany({
      where: {
        OR: [
          { ownerId: userId },
          { collaborators: { some: { userId } } }
        ]
      },
      orderBy: { updatedAt: 'desc' }
    });
  },

  // 3. Chi tiết Playlist (Lọc bài ẩn)
  getPlaylistDetails: async (playlistId: string, currentUserId?: string) => {
    const playlist = await prisma.playlist.findUnique({
      where: { id: playlistId },
      include: {
        owner: { select: { id: true, name: true, avatarUrl: true } },
        songs: {
          orderBy: { position: 'asc' },
          include: {
            song: {
              select: { id: true, title: true, duration: true, playCount: true, coverUrl: true, artist: { select: { stageName: true } } }
            }
          }
        },
        collaborators: true,
      }
    });

    if (!playlist) throw new AppError('Không tìm thấy playlist', 404, ErrorCodes.NOT_FOUND);

    // Quyền truy cập: Public hoặc Owner hoặc Collaborator
    if (!playlist.isPublic) {
      if (!currentUserId) throw new AppError('Cần đăng nhập', 401, ErrorCodes.UNAUTHORIZED);
      const isOwner = playlist.ownerId === currentUserId;
      const isCollab = playlist.collaborators.some(c => c.userId === currentUserId);
      const isSystem = playlist.isSystem; // Nếu system admin, query role admin ở route

      if (!isOwner && !isCollab && !isSystem) {
        throw new AppError('Playlist riêng tư', 403, ErrorCodes.FORBIDDEN);
      }
    }

    // Lọc bỏ bài hát bị user hiện tại ẩn
    if (currentUserId) {
      const hidden = await prisma.hiddenSong.findMany({
        where: { userId: currentUserId, OR: [{ playlistId }, { playlistId: null }] },
        select: { songId: true }
      });
      
      const hiddenIds = hidden.map(h => h.songId);
      playlist.songs = playlist.songs.filter(ps => !hiddenIds.includes(ps.songId));
    }

    return playlist;
  },

  // 4. Sửa thông tin Playlist
  updatePlaylist: async (playlistId: string, userId: string, data: any) => {
    const playlist = await prisma.playlist.findUnique({ where: { id: playlistId } });
    if (!playlist || playlist.ownerId !== userId) {
      throw new AppError('Không có quyền chỉnh sửa', 403, ErrorCodes.FORBIDDEN);
    }
    return await prisma.playlist.update({ where: { id: playlistId }, data });
  },

  // 5. Xóa Playlist
  deletePlaylist: async (playlistId: string, userId: string) => {
    const playlist = await prisma.playlist.findUnique({ where: { id: playlistId } });
    if (!playlist || playlist.ownerId !== userId) {
      throw new AppError('Không có quyền xóa', 403, ErrorCodes.FORBIDDEN);
    }

    // Prisma cascade delete cho song / collaborators tùy setup. Nếu không có cascade, tự xóa.
    await prisma.$transaction([
      prisma.playlistSong.deleteMany({ where: { playlistId } }),
      prisma.playlistCollaborator.deleteMany({ where: { playlistId } }),
      prisma.playlist.delete({ where: { id: playlistId } }),
    ]);

    return { message: 'Đã xóa playlist' };
  },

  // 6. Thêm bài hát (Owner hoặc Collaborator)
  addSong: async (playlistId: string, userId: string, songId: string, position?: number) => {
    const playlist = await prisma.playlist.findUnique({
      where: { id: playlistId },
      include: { collaborators: true }
    });

    if (!playlist) throw new AppError('Not found', 404, ErrorCodes.NOT_FOUND);
    
    const isOwner = playlist.ownerId === userId;
    const isCollab = playlist.collaborators.some(c => c.userId === userId);
    
    if (!isOwner && !isCollab) throw new AppError('Không có quyền thêm bài hát', 403, ErrorCodes.FORBIDDEN);

    // Kiem tra bai hat ton tai khong va approved
    const song = await prisma.song.findUnique({ where: { id: songId } });
    if (!song || song.status !== 'APPROVED') {
       throw new AppError('Bài hát không khả dụng', 404, ErrorCodes.NOT_FOUND);
    }

    const count = await prisma.playlistSong.count({ where: { playlistId } });
    const insertPos = position !== undefined ? position : count;

    try {
      await prisma.playlistSong.create({
        data: {
          playlistId,
          songId,
          addedBy: userId,
          position: insertPos,
        }
      });
    } catch {
       throw new AppError('Bài hát đã có trong playlist', 400, ErrorCodes.VALIDATION_ERROR);
    }

    return { message: 'Đã thêm bài hát vào playlist' };
  },

  // 7. Xóa bài hát khỏi playlist
  removeSong: async (playlistId: string, userId: string, songId: string) => {
    // Tương tự kiểm tra quyền owner/collab
    const playlist = await prisma.playlist.findUnique({
      where: { id: playlistId },
      include: { collaborators: true }
    });
    
    if (!playlist) throw new AppError('Not found', 404, ErrorCodes.NOT_FOUND);
    const isOwner = playlist.ownerId === userId;
    const isCollab = playlist.collaborators.some(c => c.userId === userId);
    if (!isOwner && !isCollab) throw new AppError('Phân quyền bị từ chối', 403, ErrorCodes.FORBIDDEN);

    await prisma.playlistSong.deleteMany({
      where: { playlistId, songId }
    });
    
    return { message: 'Đã gỡ bài hát' };
  },

  // 8. Reorder Songs
  reorderSongs: async (playlistId: string, _userId: string, songs: {songId: string, position: number}[]) => {
     //... quyền như trên
     // TODO: Update many transaction
     const updates = songs.map(s => prisma.playlistSong.updateMany({
        where: { playlistId, songId: s.songId },
        data: { position: s.position }
     }));

     await prisma.$transaction(updates);
     return { message: 'Đã sắp xếp lại bài hát' };
  },

  // 9. Ẩn bài hát
  hideSong: async (userId: string, songId: string, playlistIdParam?: string) => {
    await prisma.hiddenSong.create({
      data: {
        userId,
        songId,
        playlistId: playlistIdParam || null,
      }
    });
    return { message: 'Bài hát sẽ không hiển thị với bạn nữa' };
  }
};
