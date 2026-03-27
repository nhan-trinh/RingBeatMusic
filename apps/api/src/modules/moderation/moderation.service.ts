import { prisma } from '../../shared/config/database';
import { AppError, ErrorCodes } from '../../shared/utils/app-error';
import { meilisearch } from '../../shared/config/meilisearch';
import { redis } from '../../shared/config/redis';

export const ModerationService = {
  // 1. Lấy danh sách bài hát PENDING
  getPendingSongs: async () => {
    return await prisma.song.findMany({
      where: { status: 'PENDING' },
      include: {
        artist: { select: { id: true, stageName: true, avatarUrl: true } },
        album: { select: { title: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  },

  // 2. Duyệt bài hát
  approveSong: async (moderatorId: string, songId: string) => {
    const song = await prisma.song.findUnique({
      where: { id: songId },
      include: { artist: { select: { userId: true, stageName: true } } },
    });
    if (!song) throw new AppError('Bài hát không tồn tại', 404, ErrorCodes.NOT_FOUND);
    if (song.status !== 'PENDING') throw new AppError('Bài hát không ở trạng thái PENDING', 400, ErrorCodes.VALIDATION_ERROR);

    await prisma.$transaction([
      prisma.song.update({ where: { id: songId }, data: { status: 'APPROVED' } }),
      prisma.auditLog.create({
        data: { actorId: moderatorId, action: 'SONG_APPROVED', targetId: songId, targetType: 'song' },
      }),
    ]);

    // Index vào Meilisearch
    try {
      const idx = meilisearch.index('songs');
      await idx.addDocuments([{
        id: song.id, title: song.title, artistName: song.artist?.stageName,
        coverUrl: song.coverUrl, duration: song.duration, playCount: song.playCount,
      }]);
    } catch (e) { console.error('Meilisearch index error:', e); }

    return { message: `Đã duyệt bài hát "${song.title}"` };
  },

  // 3. Từ chối bài hát
  rejectSong: async (moderatorId: string, songId: string, reason: string) => {
    const song = await prisma.song.findUnique({ where: { id: songId } });
    if (!song) throw new AppError('Bài hát không tồn tại', 404, ErrorCodes.NOT_FOUND);
    if (song.status !== 'PENDING') throw new AppError('Bài hát không ở trạng thái PENDING', 400, ErrorCodes.VALIDATION_ERROR);

    await prisma.$transaction([
      prisma.song.update({ where: { id: songId }, data: { status: 'REJECTED' } }),
      prisma.auditLog.create({
        data: { actorId: moderatorId, action: 'SONG_REJECTED', targetId: songId, targetType: 'song', metadata: { reason } },
      }),
    ]);

    return { message: `Đã từ chối bài hát "${song.title}"` };
  },

  // 4. Danh sách Reports
  getReports: async (status?: string) => {
    return await prisma.report.findMany({
      where: status ? { status: status as any } : {},
      include: {
        reporter: { select: { id: true, name: true, email: true } },
        song: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  },

  // 5. Xử lý report
  resolveReport: async (moderatorId: string, reportId: string, action: 'RESOLVED' | 'DISMISSED') => {
    const report = await prisma.report.findUnique({ where: { id: reportId } });
    if (!report) throw new AppError('Report không tồn tại', 404, ErrorCodes.NOT_FOUND);

    await prisma.report.update({
      where: { id: reportId },
      data: { status: action, resolvedBy: moderatorId, resolvedAt: new Date() },
    });

    return { message: `Report đã được ${action === 'RESOLVED' ? 'xử lý' : 'bỏ qua'}` };
  },

  // 6. Cấp Strike cho user (+ tự động ban ở strike 3)
  issueStrike: async (moderatorId: string, targetUserId: string, reason: string, note?: string) => {
    const [strike] = await prisma.$transaction([
      prisma.strike.create({
        data: { userId: targetUserId, issuedBy: moderatorId, reason: reason as any, note },
      }),
      prisma.auditLog.create({
        data: { actorId: moderatorId, action: 'USER_BANNED', targetId: targetUserId, targetType: 'user', metadata: { reason, note } },
      }),
    ]);

    const totalStrikes = await prisma.strike.count({ where: { userId: targetUserId } });

    if (totalStrikes >= 3) {
      // Auto-ban
      await prisma.user.update({ where: { id: targetUserId }, data: { isBanned: true, banReason: 'Bị khóa do vi phạm 3 lần' } });
      // Blacklist tất cả refresh tokens
      await redis.del(`refresh_tokens:${targetUserId}`);
    }

    return { strike, totalStrikes, banned: totalStrikes >= 3 };
  },
};
