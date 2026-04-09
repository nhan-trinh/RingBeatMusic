import { Notification } from './notification.model';
import { AppError, ErrorCodes } from '../../shared/utils/app-error';
import { getIO } from '../../shared/socket/socket.server';

export const NotificationService = {
  // Tạo notification và push realtime
  createNotification: async (userId: string, type: string, title: string, body: string, data?: Record<string, unknown>) => {
    const notification = await Notification.create({ userId, type, title, body, data });

    // Push realtime qua Socket.io
    try {
      const io = getIO();
      // Emit tới room của user (đã join trong socket.server.ts)
      io.to(`user:${userId}`).emit('new_notification', notification);
    } catch (error) {
      console.error('❌ Lỗi đẩy thông báo qua Socket.io:', error);
      // Không ném lỗi ra ngoài vì notify thất bại không nên là lỗi chặn luồng nghiệp vụ
    }

    // Giữ tối đa 100 notification mỗi user (FIFO)
    const count = await Notification.countDocuments({ userId });
    if (count > 100) {
      const oldest = await Notification.find({ userId }).sort({ createdAt: 1 }).limit(count - 100);
      const ids = oldest.map(n => n._id);
      await Notification.deleteMany({ _id: { $in: ids } });
    }

    return notification;
  },

  getNotifications: async (userId: string, page = 1, limit = 20) => {
    const [notifications, total] = await Promise.all([
      Notification.find({ userId })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Notification.countDocuments({ userId }),
    ]);
    return { notifications, total, page, unreadCount: await Notification.countDocuments({ userId, isRead: false }) };
  },

  markAsRead: async (userId: string, notificationId: string) => {
    const n = await Notification.findOneAndUpdate(
      { _id: notificationId, userId },
      { isRead: true },
      { new: true }
    );
    if (!n) throw new AppError('Notification không tồn tại', 404, ErrorCodes.NOT_FOUND);
    return n;
  },

  markAllAsRead: async (userId: string) => {
    await Notification.updateMany({ userId, isRead: false }, { isRead: true });
    return { message: 'Đã đánh dấu tất cả là đã đọc' };
  },

  getUnreadCount: async (userId: string) => {
    const count = await Notification.countDocuments({ userId, isRead: false });
    return { count };
  },

  deleteNotification: async (userId: string, notificationId: string) => {
    const n = await Notification.findOneAndDelete({ _id: notificationId, userId });
    if (!n) throw new AppError('Notification không tồn tại', 404, ErrorCodes.NOT_FOUND);
    return { message: 'Đã xóa thông báo' };
  },
};
