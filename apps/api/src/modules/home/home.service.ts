import { prisma } from '../../shared/config/database';
import { redis } from '../../shared/config/redis';

export const HomeService = {
  getFeed: async () => {
    // 1. Made For You: Playlist public ngẫu nhiên
    const madeForYou = await prisma.playlist.findMany({
      where: { isPublic: true },
      take: 4,
      include: {
        songs: {
          take: 5,
          include: { song: { include: { artist: true } } }
        }
      }
    });

    // 2. Trending: Playlist hệ thống
    const trending = await prisma.playlist.findMany({
      where: { isSystem: true, isPublic: true },
      take: 3,
      include: {
        songs: {
          take: 5,
          include: { song: { include: { artist: true } } }
        }
      }
    });

    // 3. Recently Played (giả lập)
    const recentPlaylists = await prisma.playlist.findMany({
      where: { isPublic: true },
      take: 6,
      orderBy: { createdAt: 'desc' },
      include: {
        songs: {
          take: 5,
          include: { song: { include: { artist: true } } }
        }
      }
    });

    // 4. ✅ NEW RELEASES – Bài hát mới được APPROVED, lấy thẳng từ Song table
    const newReleaseSongs = await prisma.song.findMany({
      where: { status: 'APPROVED' },
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        artist: { select: { id: true, stageName: true, avatarUrl: true } },
        album: { select: { id: true, title: true } },
      }
    });

    // 5. ✅ TOP SONGS – Bài hát có lượt nghe cao nhất
    const topSongs = await prisma.song.findMany({
      where: { status: 'APPROVED' },
      take: 8,
      orderBy: { playCount: 'desc' },
      include: {
        artist: { select: { id: true, stageName: true, avatarUrl: true } },
      }
    });

    // 6. ✅ NEW ALBUMS – Album mới nhất
    const newAlbums = await prisma.album.findMany({
      where: { status: 'PUBLISHED' },
      take: 8,
      orderBy: { createdAt: 'desc' },
      include: {
        artist: { select: { id: true, stageName: true, avatarUrl: true } },
        _count: { select: { songs: true } },
      },
    });

    const mapSong = (s: any) => ({
      id: s.id,
      title: s.title,
      artistName: s.artist.stageName,
      artistId: s.artistId ?? s.artist?.id,
      coverUrl: s.coverUrl,
      audioUrl: s.audioUrl320 || s.audioUrl128,
      canvasUrl: s.canvasUrl,
      duration: s.duration,
    });

    const mapAlbum = (a: any) => ({
      id: a.id,
      title: a.title,
      coverUrl: a.coverUrl,
      artistName: a.artist.stageName,
      artistId: a.artist.id,
      songCount: a._count?.songs || 0,
      releaseDate: a.releaseDate,
    });

    const formatPlaylistCards = (playlists: any[]) => playlists.map(p => ({
      id: p.id,
      title: p.title,
      description: p.description,
      coverUrl: p.coverUrl,
      ownerId: p.ownerId,
      songs: p.songs.map((ps: any) => mapSong(ps.song))
    }));

    return {
      recentlyPlayed: formatPlaylistCards(recentPlaylists),
      madeForYou: formatPlaylistCards(madeForYou),
      trending: formatPlaylistCards(trending),
      newReleases: newReleaseSongs.map(mapSong),
      topSongs: topSongs.map(mapSong),
      newAlbums: newAlbums.map(mapAlbum),
    };
  },

  getSettings: async () => {
    const cacheKey = 'system_settings';
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const settings = await prisma.systemConfig.findMany();
    const data = settings.reduce((acc: any, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {});

    await redis.set(cacheKey, JSON.stringify(data), 'EX', 3600);
    return data;
  }
};
