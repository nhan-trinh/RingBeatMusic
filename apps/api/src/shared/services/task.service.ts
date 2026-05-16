import { prisma } from '../config/database';

export const TaskService = {
  /**
   * Dọn dẹp các session đã hết hạn hoặc đã bị thu hồi (revoked).
   * Chạy định kỳ để tránh bảng UserSession phình to vô hạn.
   */
  cleanupSessions: async () => {
    try {
      console.log('[Task] Đang bắt đầu dọn dẹp session cũ...');
      
      const now = new Date();
      
      // Xóa các session:
      // 1. Đã hết hạn (expiresAt < now)
      // 2. Đã bị thu hồi (isRevoked = true)
      const deleted = await prisma.userSession.deleteMany({
        where: {
          OR: [
            { expiresAt: { lt: now } },
            { isRevoked: true }
          ]
        }
      });
      
      if (deleted.count > 0) {
        console.log(`[Task] Đã xóa ${deleted.count} session rác thành công.`);
      } else {
        console.log('[Task] Không có session rác nào cần dọn dẹp.');
      }
    } catch (error) {
      console.error('[Task Error] Lỗi khi dọn dẹp session:', error);
    }
  }
};
