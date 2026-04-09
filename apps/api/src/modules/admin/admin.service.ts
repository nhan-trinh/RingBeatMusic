import { prisma } from '../../shared/config/database';
import { AppError, ErrorCodes } from '../../shared/utils/app-error';
import { redis } from '../../shared/config/redis';
import bcrypt from 'bcryptjs';
import { NotificationService } from '../notification/notification.service';

export const AdminService = {
  // ── User Management ──
  getUsers: async (page = 1, limit = 20, search?: string) => {
    const where = search
      ? { OR: [{ name: { contains: search, mode: 'insensitive' as const } }, { email: { contains: search, mode: 'insensitive' as const } }] }
      : {};
    const [users, total] = await Promise.all([
      prisma.user.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: 'desc' }, select: { id: true, name: true, email: true, role: true, isBanned: true, isEmailVerified: true, createdAt: true, artistProfile: { select: { id: true, isVerified: true } }, _count: { select: { strikes: true } } } }),
      prisma.user.count({ where }),
    ]);
    return { users, total, page, totalPages: Math.ceil(total / limit) };
  },

  getUserById: async (userId: string) => {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true, strikes: true, artistProfile: { select: { stageName: true, isVerified: true } } },
    });
    if (!user) throw new AppError('Người dùng không tồn tại', 404, ErrorCodes.NOT_FOUND);
    return user;
  },

  changeUserRole: async (adminId: string, targetId: string, role: string) => {
    const updated = await prisma.user.update({ where: { id: targetId }, data: { role: role as any } });
    await prisma.auditLog.create({ data: { actorId: adminId, action: 'ROLE_CHANGED', targetId, targetType: 'user', metadata: { newRole: role } } });

    // Thông báo cho người dùng
    await NotificationService.createNotification(
      targetId,
      'ROLE_UPDATED',
      'Vai trò tài khoản đã thay đổi 👤',
      `Tài khoản của bạn đã được Admin cập nhật vai trò mới: ${role}.`,
      { newRole: role }
    );

    return updated;
  },

  banUser: async (adminId: string, targetId: string, reason: string) => {
    await prisma.user.update({ where: { id: targetId }, data: { isBanned: true, banReason: reason } });
    await redis.del(`refresh_token:${targetId}`);
    await prisma.auditLog.create({ data: { actorId: adminId, action: 'USER_BANNED', targetId, targetType: 'user', metadata: { reason } } });

    // Thông báo cho người dùng
    await NotificationService.createNotification(
      targetId,
      'ACCOUNT_BANNED',
      'Tài khoản đã bị tạm khóa 🔒',
      `Tài khoản của bạn đã bị khóa bởi Admin. Lý do: ${reason}`,
      { reason }
    );

    return { message: 'Đã khóa tài khoản' };
  },

  unbanUser: async (adminId: string, targetId: string) => {
    await prisma.user.update({ where: { id: targetId }, data: { isBanned: false, banReason: null } });
    await prisma.auditLog.create({ data: { actorId: adminId, action: 'USER_UNBANNED', targetId, targetType: 'user' } });

    // Thông báo cho người dùng
    await NotificationService.createNotification(
      targetId,
      'ACCOUNT_UNBANNED',
      'Tài khoản đã được mở khóa 🔓',
      'Chào mừng bạn trở lại! Tài khoản của bạn đã được Admin mở khóa.'
    );

    return { message: 'Đã mở khóa tài khoản' };
  },

  resetPassword: async (targetId: string) => {
    const tempPassword = Math.random().toString(36).slice(-8);
    const hash = await bcrypt.hash(tempPassword, 10);
    await prisma.user.update({ where: { id: targetId }, data: { passwordHash: hash } });
    
    // Thông báo cho người dùng (có thể gửi mail sau này)
    await NotificationService.createNotification(
      targetId,
      'SECURITY_ALERT',
      'Mật khẩu đã được đặt lại 🔑',
      'Admin đã đặt lại mật khẩu cho bạn. Vui lòng kiểm tra email hoặc liên hệ Admin để nhận mật khẩu tạm thời.'
    );

    return { message: 'Đã đặt lại mật khẩu', tempPassword };
  },

  // ... (Content Management)
  getAllSongs: async (page = 1, limit = 20) => {
    const [songs, total] = await Promise.all([
      prisma.song.findMany({
        skip: (page - 1) * limit, take: limit,
        include: { artist: { select: { stageName: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.song.count(),
    ]);
    return { songs, total, page };
  },

  deleteSong: async (adminId: string, songId: string) => {
    const song = await prisma.song.findUnique({ where: { id: songId } });
    if (!song) throw new AppError('Bài hát không tồn tại', 404, ErrorCodes.NOT_FOUND);
    await prisma.song.delete({ where: { id: songId } });
    await prisma.auditLog.create({ data: { actorId: adminId, action: 'SONG_REJECTED', targetId: songId, targetType: 'song', metadata: { deletedTitle: song.title } } });
    return { message: 'Đã xóa bài hát' };
  },

  verifyArtist: async (adminId: string, artistId: string) => {
    const artist = await prisma.artist.update({ 
      where: { id: artistId }, 
      data: { isVerified: true },
      include: { user: { select: { id: true } } }
    });
    await prisma.auditLog.create({ data: { actorId: adminId, action: 'ROLE_CHANGED', targetId: artistId, targetType: 'artist' } });

    // Thông báo cho artist
    await NotificationService.createNotification(
      artist.user.id,
      'ARTIST_VERIFIED',
      'Bạn đã nhận được dấu tích xanh! ✅',
      'Chúc mừng! Hồ sơ nghệ sĩ của bạn đã được xác minh chính thức. Badge tích xanh đã được hiển thị trên trang cá nhân.',
      { artistId }
    );

    return { message: 'Đã cấp Verified Badge' };
  },

  featurePlaylist: async (playlistId: string, isFeatured: boolean) => {
    return await prisma.playlist.update({ where: { id: playlistId }, data: { isFeatured } });
  },

  pinPlaylist: async (playlistId: string, isPinned: boolean) => {
    return await prisma.playlist.update({ where: { id: playlistId }, data: { isPinned } });
  },

  // ── Subscriptions / Payments ──
  getAllSubscriptions: async () => {
    return await prisma.subscription.findMany({ include: { user: { select: { name: true, email: true } } }, orderBy: { createdAt: 'desc' }, take: 100 });
  },

  getAllPayments: async () => {
    return await prisma.payment.findMany({ include: { user: { select: { name: true, email: true } } }, orderBy: { createdAt: 'desc' }, take: 100 });
  },

  refundPayment: async (adminId: string, paymentId: string) => {
    const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment || payment.status !== 'SUCCESS') throw new AppError('Giao dịch không hợp lệ để hoàn tiền', 400, ErrorCodes.VALIDATION_ERROR);
    await prisma.$transaction([
      prisma.payment.update({ where: { id: paymentId }, data: { status: 'REFUNDED' } }),
      prisma.subscription.update({ where: { userId: payment.userId }, data: { status: 'REFUNDED', autoRenew: false } }),
      prisma.user.update({ where: { id: payment.userId }, data: { role: 'USER_FREE' } }),
    ]);
    await prisma.auditLog.create({ data: { actorId: adminId, action: 'CONFIG_UPDATED', targetId: paymentId, targetType: 'payment', metadata: { action: 'refund' } } });
    return { message: 'Đã hoàn tiền và hạ cấp tài khoản' };
  },

  // ── Audit Logs ──
  getAuditLogs: async (page = 1) => {
    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({ 
        skip: (page - 1) * 50, 
        take: 50, 
        orderBy: { createdAt: 'desc' },
        include: { actor: { select: { name: true } } } 
      }),
      prisma.auditLog.count(),
    ]);
    return { logs, total, page };
  },

  // ── Analytics ──
  getOverview: async () => {
    const [totalUsers, premiumUsers, totalSongs, totalPlays] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'USER_PREMIUM' } }),
      prisma.song.count({ where: { status: 'APPROVED' } }),
      prisma.song.aggregate({ _sum: { playCount: true } }),
    ]);
    const totalRevenue = await prisma.payment.aggregate({ where: { status: 'SUCCESS' }, _sum: { amount: true } });
    return {
      totalUsers, premiumUsers, freeUsers: totalUsers - premiumUsers,
      conversionRate: totalUsers > 0 ? ((premiumUsers / totalUsers) * 100).toFixed(1) + '%' : '0%',
      totalSongs, totalPlays: totalPlays._sum.playCount || 0,
      totalRevenue: totalRevenue._sum.amount || 0,
    };
  },

  getTopSongs: async () => {
    return await prisma.song.findMany({
      where: { status: 'APPROVED' },
      orderBy: { playCount: 'desc' },
      take: 20,
      select: { id: true, title: true, playCount: true, artist: { select: { stageName: true } } },
    });
  },

  getTopArtists: async () => {
    return await prisma.artist.findMany({
      take: 20,
      orderBy: { songs: { _count: 'desc' } },
      select: { id: true, stageName: true, isVerified: true, _count: { select: { songs: true, followedBy: true } } },
    });
  },
  
  // ── System Configuration ──
  getSettings: async () => {
    const settings = await prisma.systemConfig.findMany();
    return settings.reduce((acc: any, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {});
  },

  updateSettings: async (adminId: string, settings: Record<string, any>) => {
    const operations = Object.entries(settings).map(([key, value]) => 
      prisma.systemConfig.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      })
    );
    
    await prisma.$transaction(operations);
    await prisma.auditLog.create({
      data: {
        actorId: adminId,
        action: 'CONFIG_UPDATED',
        targetType: 'system',
        metadata: { updatedKeys: Object.keys(settings) }
      }
    });
    
    // Clear specific caches related to settings if any
    await redis.del('system_settings');
    
    return { message: 'Đã cập nhật cấu hình hệ thống' };
  },

  clearCache: async (adminId: string) => {
    // Xóa sạch toàn bộ redis
    await redis.flushall();
    
    await prisma.auditLog.create({
      data: {
        actorId: adminId,
        action: 'CONFIG_UPDATED', // Giả sử dùng code này cho cache flush
        targetType: 'system',
        metadata: { action: 'cache_flush' }
      }
    });
    
    return { message: 'Đã xóa sạch bộ nhớ đệm (Cache)' };
  },
};
