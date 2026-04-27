import { prisma } from '../../shared/config/database';
import { AppError, ErrorCodes } from '../../shared/utils/app-error';
import { meilisearch } from '../../shared/config/meilisearch';
import { redis } from '../../shared/config/redis';
import { NotificationService } from '../notification/notification.service';

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
      include: { artist: { select: { id: true, userId: true, stageName: true } } },
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

    // --- THÔNG BÁO ---
    // 1. Thông báo cho Artist
    await NotificationService.createNotification(
      song.artist.userId,
      'CONTENT_APPROVED',
      'Bài hát đã được duyệt! 🎉',
      `Chúc mừng! Bài hát "${song.title}" của bạn đã được kiểm duyệt thành công và hiện đã có mặt trên hệ thống.`,
      { songId: song.id }
    );

    // 2. Thông báo cho Followers (Push mỏi tay)
    const followers = await prisma.followedArtist.findMany({
      where: { artistId: song.artist.id },
      select: { userId: true }
    });

    for (const f of followers) {
      await NotificationService.createNotification(
        f.userId,
        'NEW_RELEASE',
        'Nghệ sĩ bạn theo dõi ra nhạc mới! 🎵',
        `${song.artist.stageName} vừa phát hành bài hát mới: "${song.title}". Nghe ngay thôi!`,
        { songId: song.id, artistId: song.artist.id }
      );
    }

    return { message: `Đã duyệt bài hát "${song.title}"` };
  },

  // 3. Từ chối bài hát
  rejectSong: async (moderatorId: string, songId: string, reason: string) => {
    const song = await prisma.song.findUnique({ 
      where: { id: songId },
      include: { artist: { select: { userId: true } } }
    });
    if (!song) throw new AppError('Bài hát không tồn tại', 404, ErrorCodes.NOT_FOUND);
    if (song.status !== 'PENDING') throw new AppError('Bài hát không ở trạng thái PENDING', 400, ErrorCodes.VALIDATION_ERROR);

    await prisma.$transaction([
      prisma.song.update({ where: { id: songId }, data: { status: 'REJECTED' } }),
      prisma.auditLog.create({
        data: { actorId: moderatorId, action: 'SONG_REJECTED', targetId: songId, targetType: 'song', metadata: { reason } },
      }),
    ]);

    // Thông báo cho Artist lý do từ chối
    await NotificationService.createNotification(
      song.artist.userId,
      'CONTENT_REJECTED',
      'Bài hát bị từ chối ⛔',
      `Bài hát "${song.title}" của bạn không được duyệt. Lý do: ${reason}`,
      { songId: song.id }
    );

    return { message: `Đã từ chối bài hát "${song.title}"` };
  },

  // ... (getReports, resolveReport giữ nguyên)
  getReports: async (status?: string) => {
    return await prisma.report.findMany({
      where: status ? { status: status as any } : {},
      include: {
        reporter: { select: { id: true, name: true, email: true } },
        song: { select: { id: true, title: true } },
        playlist: { select: { id: true, title: true } },
        targetUser: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  },

  resolveReport: async (moderatorId: string, reportId: string, action: 'RESOLVED' | 'DISMISSED', note?: string) => {
    const report = await prisma.report.findUnique({ where: { id: reportId } });
    if (!report) throw new AppError('Report không tồn tại', 404, ErrorCodes.NOT_FOUND);

    await prisma.report.update({
      where: { id: reportId },
      data: { status: action, resolvedBy: moderatorId, resolvedAt: new Date(), note },
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

    // Gửi thông báo cảnh cáo
    await NotificationService.createNotification(
      targetUserId,
      'STRIKE_ISSUED',
      'Cảnh cáo vi phạm! ⚠️',
      `Bạn vừa nhận 1 gậy cảnh cáo vì lý do: ${reason}. Hiện tại bạn đang có ${totalStrikes}/3 gậy.`,
      { strikeId: strike.id, totalStrikes }
    );

    if (totalStrikes >= 3) {
      // Auto-ban
      await prisma.user.update({ where: { id: targetUserId }, data: { isBanned: true, banReason: 'Bị khóa do vi phạm 3 lần' } });
      
      // DISMISS all reports created by this user (Anti-abuse)
      await prisma.report.updateMany({
        where: { reportedBy: targetUserId, status: 'PENDING' },
        data: { status: 'DISMISSED', note: 'Tự động từ chối do người báo cáo đã bị khóa tài khoản' }
      });

      await redis.del(`refresh_token:${targetUserId}`);
      
      // Thông báo khóa TK
      await NotificationService.createNotification(
        targetUserId,
        'ACCOUNT_BANNED',
        'Tài khoản đã bị khóa vĩnh viễn 🔒',
        'Do vi phạm quy định nhiều lần (3 gậy), tài khoản của bạn đã bị khóa vĩnh viễn. Mọi thắc mắc vui lòng liên hệ hỗ trợ.'
      );
    }

    return { strike, totalStrikes, banned: totalStrikes >= 3 };
  },
};
