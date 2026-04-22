import { Server, Socket } from 'socket.io';
import { redis } from '../../config/redis';

// Quản lý state luồng Player realtime qua Redis
export const registerPlayerHandlers = (io: Server, socket: Socket, user: any) => {
  
  socket.on('player:play', async (payload: { songId: string, position: number, title?: string, artistName?: string, coverUrl?: string }) => {
    const state = {
      currentSongId: payload.songId,
      position: payload.position,
      isPlaying: true,
      deviceId: socket.id,
      timestamp: Date.now()
    };
    
    await redis.set(`player_state:${user.id}`, JSON.stringify(state));
    await redis.set(`active_device:${user.id}`, socket.id);

    // Broadcast tới các thiết bị khác của CÙNG 1 USER
    socket.to(`user:${user.id}`).emit('player:song_changed', {
      songId: payload.songId,
      position: payload.position
    });

    // SOCIAL: Broadcast tới bạn bè (Followers) đang theo dõi (Phase 16)
    io.to(`activity:${user.id}`).emit('friend:activity_update', {
      userId: user.id,
      userName: user.name,
      userAvatar: user.avatarUrl,
      currentSong: payload.title ? {
        id: payload.songId,
        title: payload.title,
        artistName: payload.artistName,
        coverUrl: payload.coverUrl
      } : null,
      isPlaying: true,
      timestamp: Date.now()
    });
  });

  socket.on('player:pause', async (payload: { position: number }) => {
    const stateStr = await redis.get(`player_state:${user.id}`);
    if (stateStr) {
      const state = JSON.parse(stateStr);
      state.isPlaying = false;
      state.position = payload.position;
      await redis.set(`player_state:${user.id}`, JSON.stringify(state));
    }
    
    socket.to(`user:${user.id}`).emit('player:paused', { position: payload.position });

    // SOCIAL: Broadcast tới bạn bè (Phase 16)
    io.to(`activity:${user.id}`).emit('friend:activity_update', {
      userId: user.id,
      isPlaying: false,
      timestamp: Date.now()
    });
  });

  socket.on('player:progress', async (payload: { songId: string, position: number }) => {
    // Lắng nghe 5s/lần cập nhật tọa độ vào redis để lỡ F5 khôi phục
    const stateStr = await redis.get(`player_state:${user.id}`);
    if (stateStr) {
      const state = JSON.parse(stateStr);
      state.position = payload.position;
      // Tránh update timestamp liên tục
      await redis.set(`player_state:${user.id}`, JSON.stringify(state));
    }
  });

  socket.on('player:device_switch', async (payload: { deviceId: string }) => {
     await redis.set(`active_device:${user.id}`, payload.deviceId);
     io.to(`user:${user.id}`).emit('player:state_sync', {
       activeDevice: payload.deviceId,
       message: 'Đã chuyển luồng nhạc sang thiết bị mới'
     });
  });

};
