import { Server, Socket } from 'socket.io';
import { prisma } from '../../config/database';

/**
 * Quản lý các kết nối xã hội (Followers/Following) qua Socket
 */
export const registerSocialHandlers = async (_io: Server, socket: Socket, user: any) => {
  
  // 1. Khi kết nối, tự động join vào các room "activity" của những người bạn đang follow
  // Điều này giúp socket này nhận được broadcast từ bạn bè
  try {
    const following = await (prisma as any).userFollow.findMany({
      where: { followerId: user.id },
      select: { followingId: true }
    });

    following.forEach((f: any) => {
      socket.join(`activity:${f.followingId}`);
    });

    console.log(`📡 User ${user.name} joined ${following.length} friend activity rooms`);
  } catch (err) {
    console.error('❌ Lỗi khi join friend activity rooms:', err);
  }

  // 2. Lắng nghe event khi user vừa ấn Follow một người mới (để join room ngay lập tức không cần reconnect)
  socket.on('social:follow_success', (payload: { followingId: string }) => {
    socket.join(`activity:${payload.followingId}`);
    console.log(`📡 User ${user.name} started following activity of ${payload.followingId}`);
  });

};
