import { prisma } from '../../shared/config/database';
import { redis } from '../../shared/config/redis';
import { AppError, ErrorCodes } from '../../shared/utils/app-error';
import { ListeningHistory, RecentlyPlayed, InteractionHistory } from './player.model';

const mapSong = (s: any) => ({
  id: s.id,
  title: s.title,
  artistName: s.artist?.stageName || 'N/A',
  artistId: s.artistId,
  coverUrl: s.coverUrl,
  audioUrl: s.audioUrl320 || s.audioUrl128 || '',
  canvasUrl: s.canvasUrl,
  duration: s.duration,
  hasLyrics: !!s.lyrics,
});

export const PlayerService = {
  // 1. Queue Management bằng Redis
  getQueue: async (userId: string) => {
    const queueData = await redis.get(`queue:${userId}`);
    if (!queueData) return [];

    // Tối ưu: Lấy thông tin bài hát từ PostgreSQL dựa trên list IDs của Queue
    const songIds: string[] = JSON.parse(queueData);
    if (songIds.length === 0) return [];

    const songs = await prisma.song.findMany({
      where: { id: { in: songIds } },
      select: { id: true, title: true, coverUrl: true, duration: true, artist: { select: { stageName: true } } }
    });

    // Sắp xếp lại map theo đúng order của array
    const idToSong = new Map(songs.map(s => [s.id, s]));
    return songIds.map(id => idToSong.get(id)).filter(Boolean);
  },

  updateQueue: async (userId: string, songIds: string[]) => {
    await redis.set(`queue:${userId}`, JSON.stringify(songIds), 'EX', 86400); // 24 hours TTL
    return { message: 'Cập nhật Queue thành công' };
  },

  // 2. Ghi nhận lượt nghe và lịch sử (MongoDB)
  recordPlay: async (userId: string, songId: string, durationPlayed: number, completed: boolean = false) => {
    try {
      // a. Tăng playCount trên Postgre
      await prisma.song.update({
        where: { id: songId },
        data: { playCount: { increment: 1 } }
      });

      // b. Insert ListeningHistory vào Mongo
      await ListeningHistory.create({
        userId,
        songId,
        durationPlayed,
        completed,
        deviceType: 'web',
      });

      // c. Cập nhật RecentlyPlayed (giữ tối đa 50 phần tử FIFO không trùng lặp)
      // Bước 1: Kéo bài hát ra khỏi mảng nếu đã tồn tại trước đó để tránh duplicate
      await RecentlyPlayed.updateOne(
        { userId },
        { $pull: { items: { songId } } }
      );

      // Bước 2: Push lại vào cuối mảng (sẽ thành mới nhất)
      await RecentlyPlayed.findOneAndUpdate(
        { userId },
        {
          $push: {
            items: {
              $each: [{ songId, playedAt: new Date() }],
              $slice: -50,
              $sort: { playedAt: 1 }
            }
          },
          updatedAt: new Date()
        },
        { upsert: true, new: true }
      );

      // d. Ghi nhận tương tác chung (Recently Visited)
      await PlayerService.trackInteraction(userId, 'SONG', songId);

      return { success: true };
    } catch (e) {
      console.error('Lỗi recordPlay:', e);
      throw new AppError('Không thể ghi nhận lịch sử', 500, ErrorCodes.INTERNAL_ERROR);
    }
  },

  // 3. Ghi nhận tương tác (Click Artist/Album/Playlist/Song)
  trackInteraction: async (userId: string, type: 'ARTIST' | 'ALBUM' | 'PLAYLIST' | 'SONG', targetId: string) => {
    try {
      // Bỏ trùng và đưa lên đầu
      await InteractionHistory.updateOne(
        { userId },
        { $pull: { items: { targetId, type } } }
      );

      await InteractionHistory.findOneAndUpdate(
        { userId },
        {
          $push: {
            items: {
              $each: [{ type, targetId, visitedAt: new Date() }],
              $slice: -20, // Lưu tối đa 20 lượt tương tác gần nhất
              $sort: { visitedAt: 1 }
            }
          },
          updatedAt: new Date()
        },
        { upsert: true, new: true }
      );

      return { success: true };
    } catch (e) {
      console.error('Lỗi trackInteraction:', e);
      return { success: false };
    }
  },

  // 3. Lịch sử nghe nhạc (MongoDB)
  getHistory: async (userId: string) => {
    const history = await ListeningHistory.find({ userId })
      .sort({ playedAt: -1 })
      .limit(100)
      .lean();

    // Map với data Postgre nếu cần
    // (Lý do: Mongo chỉ lưu songId logic, muốn lấy title phải fetch Prisma)
    const songIds = Array.from(new Set(history.map(h => h.songId)));

    if (songIds.length === 0) return [];

    const songs = await prisma.song.findMany({
      where: { id: { in: songIds } },
      select: {
        id: true,
        title: true,
        coverUrl: true,
        duration: true,
        audioUrl128: true,
        audioUrl320: true,
        canvasUrl: true,
        artistId: true,
        artist: { select: { stageName: true } }
      }
    });

    const songMap = new Map(songs.map(s => [s.id, s]));

    return history.map(h => {
      const song = songMap.get(h.songId);
      return {
        id: h._id?.toString(),
        userId: h.userId,
        songId: h.songId,
        playedAt: h.playedAt,
        durationPlayed: h.durationPlayed,
        completed: h.completed,
        deviceType: h.deviceType,
        // Flatten song data for easier usage
        ...(song ? {
          title: song.title,
          coverUrl: song.coverUrl,
          duration: song.duration,
          artistId: song.artistId,
          artistName: song.artist.stageName,
          audioUrl: song.audioUrl320 || song.audioUrl128 || '',
          canvasUrl: song.canvasUrl,
        } : {})
      };
    });
  },

  // 4. Lấy lịch sử tương tác tổng hợp (Recently Visited)
  getRecentlyVisited: async (userId: string) => {
    const doc = await InteractionHistory.findOne({ userId }).lean();
    if (!doc || !doc.items || doc.items.length === 0) return [];

    // Mới nhất lên đầu
    const items = [...doc.items].reverse();

    // Thu thập IDs theo loại
    const songIds: string[] = [];
    const albumIds: string[] = [];
    const artistIds: string[] = [];
    const playlistIds: string[] = [];

    items.forEach(item => {
      if (item.type === 'SONG') songIds.push(item.targetId);
      if (item.type === 'ALBUM') albumIds.push(item.targetId);
      if (item.type === 'ARTIST') artistIds.push(item.targetId);
      if (item.type === 'PLAYLIST') playlistIds.push(item.targetId);
    });

    // Fetch song data
    const songs = songIds.length > 0 ? await prisma.song.findMany({
      where: { id: { in: songIds } },
      select: { 
        id: true, title: true, coverUrl: true, duration: true, audioUrl128: true, audioUrl320: true, canvasUrl: true, lyrics: true, artistId: true,
        artist: { select: { stageName: true } } 
      }
    }) : [];

    // Fetch album data
    const albums = albumIds.length > 0 ? await prisma.album.findMany({
      where: { id: { in: albumIds } },
      select: { 
        id: true, 
        title: true, 
        coverUrl: true, 
        artist: { select: { stageName: true } },
        songs: { take: 10, include: { artist: true } }
      }
    }) : [];

    // Fetch artist data
    const artists = artistIds.length > 0 ? await prisma.artist.findMany({
      where: { id: { in: artistIds } },
      select: { id: true, stageName: true, avatarUrl: true }
    }) : [];

    // Fetch playlist data
    const playlists = playlistIds.length > 0 ? await prisma.playlist.findMany({
      where: { id: { in: playlistIds } },
      select: { 
        id: true, 
        title: true, 
        coverUrl: true, 
        owner: { select: { name: true } },
        songs: { take: 10, include: { song: { include: { artist: true } } } } 
      }
    }) : [];

    // Map lại theo đúng thứ tự thời gian
    const dataMap = new Map();
    songs.forEach(s => dataMap.set(`SONG:${s.id}`, { ...mapSong(s), type: 'SONG', subTitle: s.artist.stageName }));
    albums.forEach(a => dataMap.set(`ALBUM:${a.id}`, { 
      ...a, 
      type: 'ALBUM', 
      subTitle: a.artist.stageName,
      songs: a.songs.map((s: any) => mapSong(s))
    }));
    artists.forEach(art => dataMap.set(`ARTIST:${art.id}`, { id: art.id, title: art.stageName, coverUrl: art.avatarUrl, type: 'ARTIST', subTitle: 'Nghệ sĩ' }));
    playlists.forEach(p => dataMap.set(`PLAYLIST:${p.id}`, { 
      ...p, 
      type: 'PLAYLIST', 
      subTitle: p.owner?.name || 'Spotify',
      songs: p.songs.map((ps: any) => mapSong(ps.song))
    }));

    return items.map(item => dataMap.get(`${item.type}:${item.targetId}`)).filter(Boolean);
  },

  // 5. Recently Played API (Listen Again)
  getRecentlyPlayed: async (userId: string) => {
    const doc = await RecentlyPlayed.findOne({ userId }).lean();
    if (!doc || !doc.items || doc.items.length === 0) return [];

    // Chiếu hậu dữ liệu với Postgres
    const songIds = doc.items.map(i => i.songId).reverse(); // Mới nhất lên đầu
    const uniqueIds = Array.from(new Set(songIds)); // Bỏ trùng

    const songs = await prisma.song.findMany({
      where: { id: { in: uniqueIds } },
      select: {
        id: true,
        title: true,
        coverUrl: true,
        duration: true,
        audioUrl128: true,
        audioUrl320: true,
        canvasUrl: true,
        lyrics: true,
        artistId: true,
        artist: { select: { stageName: true } }
      }
    });

    const songMap = new Map(songs.map(s => [s.id, s]));

    return uniqueIds.map(id => {
      const song = songMap.get(id);
      if (!song) return null;
      return mapSong(song);
    }).filter(Boolean);
  },

  // 5. Kiểm tra quyền Skip của Free User
  checkSkipLimit: async (userId: string, role: string) => {
    if (role !== 'USER_FREE') return { canSkip: true };

    const cacheKey = `skip_count:${userId}`;
    const currentStr = await redis.get(cacheKey);
    let current = currentStr ? parseInt(currentStr) : 0;

    if (current >= 6) {
      throw new AppError('Bạn đã dùng hết 6 lượt bỏ qua bài trong giờ này. Vui lòng nâng cấp Premium.', 403, ErrorCodes.FORBIDDEN);
    }

    const multi = redis.multi();
    multi.incr(cacheKey);
    if (!current) multi.expire(cacheKey, 3600); // 1 giờ
    await multi.exec();

    return { canSkip: true, remaining: 5 - current };
  }
};
