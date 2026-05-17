import { prisma } from '../../shared/config/database';
import { meilisearch } from '../../shared/config/meilisearch';
import { redis } from '../../shared/config/redis';

export const SearchService = {
  // 1. Đồng bộ hóa lại dữ liệu với Meilisearch (thường chạy thủ công hoặc trên cron)
  syncIndexes: async () => {
    // a. Đồng bộ Songs
    const songs = await prisma.song.findMany({
      where: { status: 'APPROVED' },
      include: { artist: { select: { stageName: true } }, album: { select: { title: true } } }
    });

    const songDocs = songs.map(s => ({
      id: s.id,
      title: s.title,
      artistName: s.artist.stageName,
      albumTitle: s.album?.title || '',
      genre: s.genreId || '',
      language: s.language || '',
      releaseDate: s.releaseDate?.getTime() || 0,
      playCount: s.playCount,
      status: s.status,
      // Pass data render Frontend
      audioUrl: s.audioUrl320 || s.audioUrl128 || '',
      coverUrl: s.coverUrl || '',
      canvasUrl: s.canvasUrl || '',
      artistId: s.artistId
    }));
    await meilisearch.index('songs').addDocuments(songDocs, { primaryKey: 'id' });

    // b. Đồng bộ Artists
    const artists = await prisma.artist.findMany();
    const artistDocs = artists.map(a => ({
      id: a.id,
      stageName: a.stageName,
      bio: a.bio || '',
      isVerified: a.isVerified,
      avatarUrl: a.avatarUrl || '', // Thêm ảnh để hiển thị ở Search
    }));
    await meilisearch.index('artists').addDocuments(artistDocs, { primaryKey: 'id' });
    await meilisearch.index('artists').updateFilterableAttributes(['isVerified']);

    // c. Đồng bộ Users (Dành cho việc tìm bạn bè)
    const users = await prisma.user.findMany({
      select: { id: true, name: true, avatarUrl: true, role: true }
    });
    const userDocs = users.map(u => ({
      id: u.id,
      name: u.name,
      avatarUrl: u.avatarUrl || '',
      role: u.role
    }));
    await meilisearch.index('users').addDocuments(userDocs, { primaryKey: 'id' });

    await meilisearch.index('albums').updateSortableAttributes(['releaseDate']);

    // d. Đồng bộ Albums
    const albums = await prisma.album.findMany({
      where: { status: 'PUBLISHED' },
      include: { artist: { select: { stageName: true } } }
    });
    const albumDocs = albums.map(a => ({
      id: a.id,
      title: a.title,
      artistName: a.artist.stageName,
      coverUrl: a.coverUrl || '',
      releaseDate: a.releaseDate?.getTime() || 0,
    }));
    await meilisearch.index('albums').addDocuments(albumDocs, { primaryKey: 'id' });

    return { message: 'Đã đồng bộ xong dữ liệu Meilisearch' };
  },

  // 2. Mock Tìm kiếm hợp nhất -> Đã chuyển sang MEILISEARCH REAL
  globalSearch: async (query: string, _type?: string, userId?: string) => {
    if (!query) return { songs: [], artists: [], albums: [] };

    const q = query.toLowerCase();

    if (q === 'new-releases') {
      const songs = await prisma.song.findMany({
        where: { status: 'APPROVED' },
        take: 50,
        orderBy: { createdAt: 'desc' },
        include: { artist: { select: { stageName: true } } }
      });
      const mapped = songs.map(s => ({
        ...s,
        artistName: s.artist.stageName,
        audioUrl: s.audioUrl320 || s.audioUrl128,
        hasLyrics: !!s.lyrics
      }));
      return { songs: mapped, artists: [], albums: [] };
    }

    if (q === 'top-songs') {
      const songs = await prisma.song.findMany({
        where: { status: 'APPROVED' },
        take: 50,
        orderBy: { playCount: 'desc' },
        include: { artist: { select: { stageName: true } } }
      });
      const mapped = songs.map(s => ({
        ...s,
        artistName: s.artist.stageName,
        audioUrl: s.audioUrl320 || s.audioUrl128,
        hasLyrics: !!s.lyrics
      }));
      return { songs: mapped, artists: [], albums: [] };
    }

    if (q === 'new-albums') {
      const albums = await prisma.album.findMany({
        where: { status: 'PUBLISHED' },
        take: 50,
        orderBy: { createdAt: 'desc' },
        include: { artist: { select: { stageName: true } } }
      });
      const mapped = albums.map(a => ({
        ...a,
        artistName: a.artist.stageName
      }));
      return { songs: [], artists: [], albums: mapped };
    }

    if (q === 'trending') {
      const topSongs = await SearchService.getTopCharts();
      const mappedSongs = topSongs.map((s: any) => ({
        ...s,
        artistName: s.artist?.stageName || '',
        audioUrl: s.audioUrl320 || s.audioUrl128,
        hasLyrics: !!s.lyrics
      }));
      return { songs: mappedSongs, artists: [], albums: [] };
    }

    if (q === 'made-for-you' && userId) {
      const suggestedSongs = await SearchService.discoverWeekly(userId);
      const mappedSongs = suggestedSongs.map((s: any) => ({
        ...s,
        artistName: s.artist?.stageName || '',
        audioUrl: s.audioUrl320 || s.audioUrl128,
        hasLyrics: !!s.lyrics
      }));
      return { songs: mappedSongs, artists: [], albums: [] };
    }

    const [songsRes, artistsRes, albumsRes, usersRes] = await Promise.all([
      meilisearch.index('songs').search(q, { limit: 20 }),
      meilisearch.index('artists').search(q, { limit: 10 }),
      meilisearch.index('albums').search(q, { limit: 10 }),
      meilisearch.index('users').search(q, { limit: 10 }),
    ]);

    // Làm giàu dữ liệu Songs từ Database để đảm bảo URL luôn mới nhất và đầy đủ
    const songIds = songsRes.hits.map(h => h.id);
    const fullSongs = await prisma.song.findMany({
      where: { id: { in: songIds }, status: 'APPROVED' },
      include: { artist: { select: { id: true, stageName: true } } }
    });

    // Map lại theo đúng thứ tự của Meilisearch (ưu tiên độ liên quan)
    const sortedSongs = songIds.map(id => {
      const s = fullSongs.find(fs => fs.id === id);
      if (!s) return null;
      return {
        id: s.id,
        title: s.title,
        artistName: s.artist.stageName,
        artistId: s.artist.id,
        coverUrl: s.coverUrl,
        audioUrl: s.audioUrl320 || s.audioUrl128,
        canvasUrl: s.canvasUrl,
        duration: s.duration,
        lyrics: s.lyrics,
        hasLyrics: !!s.lyrics
      };
    }).filter(Boolean);

    // Làm giàu dữ liệu Albums
    const albumIds = albumsRes.hits.map(h => h.id);
    const fullAlbums = await prisma.album.findMany({
      where: { id: { in: albumIds }, status: 'PUBLISHED' },
      include: { artist: { select: { id: true, stageName: true } } }
    });

    const sortedAlbums = albumIds.map(id => {
      const a = fullAlbums.find(fa => fa.id === id);
      if (!a) return null;
      return {
        id: a.id,
        title: a.title,
        artistName: a.artist.stageName,
        artistId: a.artist.id,
        coverUrl: a.coverUrl,
      };
    }).filter(Boolean);

    // Làm giàu dữ liệu Artists (để đảm bảo avatarUrl luôn mới)
    const artistIds = artistsRes.hits.map(h => h.id);
    const fullArtists = await prisma.artist.findMany({
      where: { id: { in: artistIds } },
      select: { id: true, stageName: true, avatarUrl: true, isVerified: true }
    });

    const sortedArtists = artistIds.map(id => {
      const a = fullArtists.find(fa => fa.id === id);
      if (!a) return null;
      return a;
    }).filter(Boolean);

    // Lọc Users: Loại bỏ những người có role ARTIST vì họ đã xuất hiện ở mục Artists rồi
    const filteredUsers = usersRes.hits.filter(u => u.role !== 'ARTIST');

    // Xác định Top Result (Ưu tiên Artist khớp nhất, sau đó đến bài hát)
    let topResult: any = null;
    if (sortedArtists.length > 0 && sortedArtists[0]) {
      topResult = { ...sortedArtists[0], type: 'artist' };
    } else if (sortedSongs.length > 0) {
      topResult = { ...sortedSongs[0], type: 'song' };
    }

    // Tìm kiếm Playlists liên quan đến Artist được tìm thấy
    let relatedPlaylists: any[] = [];
    if (sortedArtists.length > 0 && sortedArtists[0]) {
      const artistId = (sortedArtists[0] as any).id;
      relatedPlaylists = await prisma.playlist.findMany({
        where: {
          isPublic: true,
          songs: { some: { song: { artistId } } }
        },
        select: { id: true, title: true, coverUrl: true, description: true, ownerId: true },
        take: 10
      });
    }

    return {
      topResult,
      songs: sortedSongs,
      artists: sortedArtists,
      albums: sortedAlbums,
      users: filteredUsers,
      playlists: relatedPlaylists
    };
  },

  // 3. Top Charts (Trending theo playCount cached 1h)
  getTopCharts: async () => {
    const cached = await redis.get('music:top_charts');
    if (cached) return JSON.parse(cached);

    const topSongs = await prisma.song.findMany({
      where: { status: 'APPROVED' },
      orderBy: { playCount: 'desc' },
      take: 50,
      include: { artist: { select: { stageName: true } } }
    });

    await redis.set('music:top_charts', JSON.stringify(topSongs), 'EX', 3600); // 1 hr
    return topSongs;
  },

  discoverWeekly: async (_userId: string) => {
    // Thuật toán đề xuất đơn giản: Random top 30 bài hát 
    // TODO: Connect listening_history mongodb ở Phase 4

    // Fallback: lay 30 bai mix random
    const count = await prisma.song.count({ where: { status: 'APPROVED' } });
    const skip = Math.max(0, Math.floor(Math.random() * count) - 30);

    return await prisma.song.findMany({
      where: { status: 'APPROVED' },
      take: 30,
      skip,
      include: { artist: { select: { stageName: true } } }
    });
  },
  // 4. Đồng bộ lẻ 1 bài hát
  syncOneSong: async (songId: string) => {
    const song = await prisma.song.findUnique({
      where: { id: songId },
      include: { artist: { select: { stageName: true } }, album: { select: { title: true } } }
    });

    if (!song || song.status !== 'APPROVED') {
      await meilisearch.index('songs').deleteDocument(songId);
      return;
    }

    const doc = {
      id: song.id,
      title: song.title,
      artistName: song.artist.stageName,
      albumTitle: song.album?.title || '',
      genre: song.genreId || '',
      language: song.language || '',
      releaseDate: song.releaseDate?.getTime() || 0,
      playCount: song.playCount,
      status: song.status,
      audioUrl: song.audioUrl320 || song.audioUrl128 || '',
      coverUrl: song.coverUrl || '',
      canvasUrl: song.canvasUrl || '',
      artistId: song.artistId
    };

    await meilisearch.index('songs').addDocuments([doc]);
  },

  // 5. Đồng bộ lẻ 1 Album
  syncOneAlbum: async (albumId: string) => {
    const album = await prisma.album.findUnique({
      where: { id: albumId },
      include: { artist: { select: { stageName: true } } }
    });

    if (!album || album.status !== 'PUBLISHED') {
      await meilisearch.index('albums').deleteDocument(albumId);
      return;
    }

    const doc = {
      id: album.id,
      title: album.title,
      artistName: album.artist.stageName,
      coverUrl: album.coverUrl || '',
      releaseDate: album.releaseDate?.getTime() || 0,
    };

    await meilisearch.index('albums').addDocuments([doc]);
  },
};
