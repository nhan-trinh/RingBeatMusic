import { prisma } from '../../shared/config/database';
import { AppError, ErrorCodes } from '../../shared/utils/app-error';
import { SupabaseUtil } from '../../shared/utils/supabase.util';

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
        isPublic: data.isPublic !== undefined ? data.isPublic : true,
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
          { collaborators: { some: { userId } } },
          { followers: { some: { userId } } }
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
              select: { id: true, title: true, duration: true, playCount: true, coverUrl: true, canvasUrl: true, audioUrl320: true, audioUrl128: true, artistId: true, artist: { select: { id: true, stageName: true } } }
            },
            addedByUser: { select: { id: true, name: true, avatarUrl: true } }
          }
        },
        collaborators: {
          include: { user: { select: { id: true, name: true, avatarUrl: true } } }
        },
      }
    });

    if (!playlist) throw new AppError('Không tìm thấy playlist', 404, ErrorCodes.NOT_FOUND);

    // Quyền truy cập: Public hoặc Owner hoặc Collaborator
    if (!playlist.isPublic) {
      if (!currentUserId) throw new AppError('Cần đăng nhập', 401, ErrorCodes.UNAUTHORIZED);
      const isOwner = playlist.ownerId === currentUserId;
      const isCollab = playlist.collaborators.some((c: any) => c.userId === currentUserId);
      const isSystem = playlist.isSystem;

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
      (playlist as any).songs = ((playlist as any).songs as any[]).filter((ps: any) => !hiddenIds.includes(ps.songId));
    }

    // Pass data for UI audio mapping
    const formattedSongs = ((playlist as any).songs as any[]).map((ps: any) => {
      const audioUrl = ps.song.audioUrl320 || ps.song.audioUrl128;
      return {
        ...ps,
        audioUrl
      };
    });

    return { ...playlist, songs: formattedSongs };
  },

  // 4. Sửa thông tin Playlist
  updatePlaylist: async (playlistId: string, userId: string, data: any) => {
    const playlist = await prisma.playlist.findUnique({ where: { id: playlistId } });
    if (!playlist || playlist.ownerId !== userId) {
      throw new AppError('Không có quyền chỉnh sửa', 403, ErrorCodes.FORBIDDEN);
    }
    const { title, description, coverUrl, isPublic, isCollaborative } = data;
    return await prisma.playlist.update({
      where: { id: playlistId },
      data: { title, description, coverUrl, isPublic, isCollaborative }
    });
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

  // 5.5 Upload Cover
  uploadCover: async (playlistId: string, userId: string, file: Express.Multer.File) => {
    const playlist = await prisma.playlist.findUnique({ where: { id: playlistId } });
    if (!playlist || playlist.ownerId !== userId) {
      throw new AppError('Không có quyền chỉnh sửa', 403, ErrorCodes.FORBIDDEN);
    }

    const ext = file.mimetype.split('/')[1] || 'jpg';
    const filePath = `playlist-covers/${playlistId}.${ext}`;
    const coverUrl = await SupabaseUtil.uploadBuffer('images', filePath, file.buffer, file.mimetype);

    await prisma.playlist.update({
      where: { id: playlistId },
      data: { coverUrl }
    });

    return { coverUrl };
  },

  // 6. Thêm bài hát (Owner hoặc Collaborator)
  addSong: async (playlistId: string, userId: string, songId: string, position?: number) => {
    const playlist = await prisma.playlist.findUnique({
      where: { id: playlistId },
      include: { collaborators: true }
    });

    if (!playlist) throw new AppError('Not found', 404, ErrorCodes.NOT_FOUND);

    const isOwner = playlist.ownerId === userId;
    const isCollab = playlist.collaborators.some((c: any) => c.userId === userId && c.status === 'ACTIVE');

    if (!isOwner && (!playlist.isCollaborative || !isCollab)) {
      throw new AppError('Không có quyền thêm bài hát vào playlist này', 403, ErrorCodes.FORBIDDEN);
    }

    // Kiểm tra bài hát tồn tại không và approved
    const song = await prisma.song.findUnique({ where: { id: songId } });
    if (!song || song.status !== 'APPROVED') {
      throw new AppError('Bài hát không khả dụng', 404, ErrorCodes.NOT_FOUND);
    }

    const count = await prisma.playlistSong.count({ where: { playlistId } });
    const insertPos = position !== undefined ? position : count;

    try {
      await prisma.$transaction(async (tx) => {
        await tx.playlistSong.create({
          data: {
            playlistId,
            songId,
            addedBy: userId,
            position: insertPos,
          }
        });

        // Tự động cập nhật ảnh bìa playlist nếu đang để trống
        if (!playlist.coverUrl && song.coverUrl) {
          await tx.playlist.update({
            where: { id: playlistId },
            data: { coverUrl: song.coverUrl }
          });
        }
      });
    } catch (e) {
      console.error('Lỗi addSong:', e);
      throw new AppError('Bài hát đã có trong playlist hoặc lỗi hệ thống', 400, ErrorCodes.VALIDATION_ERROR);
    }

    return { message: 'Đã thêm bài hát vào playlist' };
  },

  // 7. Xóa bài hát khỏi playlist
  removeSong: async (playlistId: string, userId: string, songId: string, role: string) => {
    const playlist = await prisma.playlist.findUnique({
      where: { id: playlistId },
      include: { collaborators: true, songs: { where: { songId } } }
    });

    if (!playlist) throw new AppError('Not found', 404, ErrorCodes.NOT_FOUND);

    const isOwner = playlist.ownerId === userId;
    const isAdmin = role === 'ADMIN' || role === 'MODERATOR';
    const playlistSong = playlist.songs[0];

    if (!playlistSong) throw new AppError('Bài hát không có trong playlist', 404, ErrorCodes.NOT_FOUND);

    // Collaborator chỉ được xóa bài của chính mình
    const isAdder = playlistSong.addedBy === userId;
    const isCollab = playlist.collaborators.some((c: any) => c.userId === userId && c.status === 'ACTIVE');

    if (!isOwner && !isAdmin && (!isCollab || !isAdder)) {
      throw new AppError('Bạn không có quyền xóa bài hát này', 403, ErrorCodes.FORBIDDEN);
    }

    await prisma.playlistSong.delete({
      where: { id: playlistSong.id }
    });

    // 9. Recalculate positions (TC-13)
    await PlaylistService.recalculatePositions(playlistId);

    return { message: 'Đã gỡ bài hát' };
  },

  // 8. Reorder Songs
  reorderSongs: async (playlistId: string, _userId: string, songs: { songId: string, position: number }[]) => {
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
  },

  // 10. Toggle Collaborative (TC-01, TC-02)
  toggleCollaborative: async (playlistId: string, userId: string) => {
    const playlist = await prisma.playlist.findUnique({ where: { id: playlistId } });
    if (!playlist) throw new AppError('Not found', 404, ErrorCodes.NOT_FOUND);
    if (playlist.ownerId !== userId) throw new AppError('Chỉ chủ sở hữu mới có thể bật chế độ cộng tác', 403, ErrorCodes.FORBIDDEN);
    if (playlist.isSystem || !playlist.ownerId) throw new AppError('Không thể bật chế độ cộng tác cho playlist hệ thống', 400, ErrorCodes.VALIDATION_ERROR);

    return await prisma.playlist.update({
      where: { id: playlistId },
      data: { isCollaborative: !playlist.isCollaborative }
    });
  },

  // 11. Invite Collaborator (TC-03, TC-04)
  inviteCollaborator: async (playlistId: string, ownerId: string, targetUserId: string) => {
    const playlist = await prisma.playlist.findUnique({ where: { id: playlistId } });
    if (!playlist || playlist.ownerId !== ownerId) throw new AppError('Forbidden', 403, ErrorCodes.FORBIDDEN);
    if (!playlist.isCollaborative) throw new AppError('Playlist này chưa bật chế độ cộng tác', 400, ErrorCodes.VALIDATION_ERROR);
    if (ownerId === targetUserId) throw new AppError('Bạn không thể mời chính mình', 400, ErrorCodes.VALIDATION_ERROR);

    return await (prisma as any).playlistCollaborator.upsert({
      where: { playlistId_userId: { playlistId, userId: targetUserId } },
      create: { playlistId, userId: targetUserId, status: 'ACTIVE' },
      update: { status: 'ACTIVE', kickedAt: null }
    });
  },

  // 12. Kick Collaborator (TC-10)
  kickCollaborator: async (playlistId: string, ownerId: string, targetUserId: string) => {
    const playlist = await prisma.playlist.findUnique({ where: { id: playlistId } });
    if (!playlist || playlist.ownerId !== ownerId) throw new AppError('Forbidden', 403, ErrorCodes.FORBIDDEN);

    return await (prisma as any).playlistCollaborator.update({
      where: { playlistId_userId: { playlistId, userId: targetUserId } },
      data: { status: 'KICKED', kickedAt: new Date() }
    });
  },

  // Helper: Recalculate positions
  recalculatePositions: async (playlistId: string) => {
    const songs = await prisma.playlistSong.findMany({
      where: { playlistId },
      orderBy: { position: 'asc' }
    });

    const updates = songs.map((s, index) => prisma.playlistSong.update({
      where: { id: s.id },
      data: { position: index + 1 }
    }));

    await prisma.$transaction(updates);
  }
};
