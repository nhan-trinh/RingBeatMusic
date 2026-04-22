import { prisma } from '../../shared/config/database';
import { AppError, ErrorCodes } from '../../shared/utils/app-error';
import { v2 as cloudinary } from 'cloudinary';
import bcrypt from 'bcryptjs';
import { RecentlyPlayed } from '../player/player.model';
import { NotificationService } from '../notification/notification.service';

export const UserService = {
  getProfile: async (userId: string) => {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        dateOfBirth: true,
        gender: true,
        avatarUrl: true,
        role: true,
        isEmailVerified: true,
        twoFactorEnabled: true,
        createdAt: true,
      },
    });

    if (!user) throw new AppError('Người dùng không tồn tại', 404, ErrorCodes.NOT_FOUND);
    return user;
  },

  updateProfile: async (userId: string, data: any) => {
    const { name, gender } = data;

    // 1. Cập nhật User chính
    const user = await prisma.user.update({
      where: { id: userId },
      data: { name, gender },
    });

    // 2. Nếu là Artist, đồng bộ StageName (nếu cần) hoặc các thông tin chung
    if (user.role === 'ARTIST') {
      await prisma.artist.updateMany({
        where: { userId },
        data: { stageName: name }
      });
    }

    return {
      id: user.id,
      name: user.name,
      gender: user.gender,
      avatarUrl: user.avatarUrl,
    };
  },

  changePassword: async (userId: string, data: any) => {
    const { currentPassword, newPassword } = data;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.passwordHash) {
      throw new AppError('Người dùng không hợp lệ', 400, ErrorCodes.VALIDATION_ERROR);
    }

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) throw new AppError('Mật khẩu hiện tại không đúng', 400, ErrorCodes.INVALID_CREDENTIALS);

    const newHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash },
    });

    return { message: 'Đổi mật khẩu thành công' };
  },

  uploadAvatar: async (userId: string, file: Express.Multer.File) => {
    if (!file) throw new AppError('Vui lòng cung cấp file ảnh', 400, ErrorCodes.VALIDATION_ERROR);

    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: 'spotify-clone/avatars', public_id: `avatar_${userId}` },
        async (error, result) => {
          if (error) return reject(new AppError('Upload ảnh thất bại', 500, ErrorCodes.INTERNAL_ERROR));
          if (!result) return reject(new AppError('Không nhận được kết quả Cloudinary', 500, ErrorCodes.INTERNAL_ERROR));

          // 1. Cập nhật User avatar
          const user = await prisma.user.update({
            where: { id: userId },
            data: { avatarUrl: result.secure_url },
          });

          // 2. Đồng bộ Artist avatar (nếu có role ARTIST)
          if (user.role === 'ARTIST') {
            await prisma.artist.updateMany({
              where: { userId },
              data: { avatarUrl: result.secure_url }
            });
          }

          resolve({ id: user.id, avatarUrl: user.avatarUrl });
        }
      );
      stream.end(file.buffer);
    });
  },

  getRecentlyPlayed: async (userId: string) => {
    const history = await RecentlyPlayed.findOne({ userId }).lean();
    if (!history || !history.items || history.items.length === 0) return [];

    // Lấy 20 bài gần nhất
    const recentItems = [...history.items].sort((a, b) => b.playedAt.getTime() - a.playedAt.getTime()).slice(0, 20);
    const songIds = recentItems.map(item => item.songId);

    const songs = await prisma.song.findMany({
      where: { id: { in: songIds } },
      select: {
        id: true,
        title: true,
        coverUrl: true,
        duration: true,
        artistId: true,
        canvasUrl: true,
        audioUrl128: true,
        audioUrl320: true,
        artist: { select: { stageName: true } }
      }
    });

    const songMap = new Map(songs.map(s => [s.id, s]));

    return recentItems.map(item => {
      const song = songMap.get(item.songId);
      if (!song) return null;
      return {
        ...song,
        audioUrl: song.audioUrl320 || song.audioUrl128 || '',
        canvasUrl: (song as any).canvasUrl,
        playedAt: item.playedAt,
        artistName: song.artist.stageName,
      };
    }).filter(Boolean);
  },

  getPublicProfile: async (id: string, currentUserId?: string) => {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        avatarUrl: true,
        role: true,
        createdAt: true,
      }
    });

    if (!user) throw new AppError('Người dùng không tồn tại', 404, ErrorCodes.NOT_FOUND);

    // 1. Thống kê Followers (Nếu là Artist)
    let followersCount = 0;
    let isVerified = false;
    let artistId = null;
    let albums: any[] = [];
    let isFollowing = false;

    // Check trạng thái follow nếu có currentUserId
    if (currentUserId && currentUserId !== id) {
      const follow = await (prisma as any).userFollow.findUnique({
        where: {
          followerId_followingId: { followerId: currentUserId, followingId: id }
        }
      });
      isFollowing = !!follow;
    }

    if (user.role === 'ARTIST') {
      const artist = await prisma.artist.findUnique({
        where: { userId: id },
        select: { id: true, isVerified: true }
      });
      if (artist) {
        artistId = artist.id;
        isVerified = artist.isVerified;
        followersCount = await prisma.followedArtist.count({
          where: { artistId: artist.id }
        });

        // Lấy danh sách album của nghệ sĩ
        albums = await prisma.album.findMany({
          where: { artistId: artist.id, status: 'PUBLISHED' },
          select: { id: true, title: true, coverUrl: true, releaseDate: true },
          orderBy: { releaseDate: 'desc' }
        });
      }
    }

    // 2. Lấy danh sách Playlist công khai
    const playlists = await prisma.playlist.findMany({
      where: { ownerId: id, isPublic: true },
      select: { id: true, title: true, coverUrl: true, description: true },
      orderBy: { updatedAt: 'desc' }
    });

    return {
      ...user,
      isVerified,
      artistId,
      isFollowing,
      stats: {
        followers: followersCount,
        playlists: playlists.length,
      },
      playlists,
      albums
    };
  },

  getLibrary: async (userId: string) => {
    const likedSongs = await prisma.likedSong.findMany({
      where: { userId },
      include: {
        song: {
          select: {
            id: true,
            title: true,
            coverUrl: true,
            duration: true,
            artistId: true,
            audioUrl320: true,
            audioUrl128: true,
            canvasUrl: true,
            artist: { select: { id: true, stageName: true } }
          }
        }
      },
      orderBy: { likedAt: 'desc' },
      take: 50
    });

    const followedArtists = await prisma.followedArtist.findMany({
      where: { userId },
      include: {
        artist: { select: { id: true, stageName: true, avatarUrl: true, isVerified: true } }
      },
      orderBy: { followedAt: 'desc' },
      take: 50
    });

    const followedAlbums = await prisma.followedAlbum.findMany({
      where: { userId },
      include: {
        album: { select: { id: true, title: true, coverUrl: true, artist: { select: { stageName: true } } } }
      },
      orderBy: { followedAt: 'desc' },
      take: 30
    });

    const followedPlaylists = await (prisma as any).playlistFollower.findMany({
      where: { userId },
      include: {
        playlist: { select: { id: true, title: true, coverUrl: true } }
      },
      orderBy: { followedAt: 'desc' },
      take: 30
    });

    return {
      likedSongs: likedSongs.map(ls => ({
        id: ls.song.id,
        title: ls.song.title,
        coverUrl: ls.song.coverUrl,
        duration: ls.song.duration,
        artistId: ls.song.artistId,
        artistName: ls.song.artist.stageName,
        audioUrl: ls.song.audioUrl320 || ls.song.audioUrl128 || '',
        canvasUrl: (ls.song as any).canvasUrl,
        likedAt: ls.likedAt,
      })),
      followedArtists: followedArtists.map((fa: any) => fa.artist),
      followedAlbums: followedAlbums.map((fa: any) => fa.album),
      followedPlaylists: followedPlaylists.map((fp: any) => fp.playlist),
      // Thống kê nhanh
      likedSongIds: likedSongs.map((ls: any) => ls.songId),
      followedArtistIds: followedArtists.map((fa: any) => fa.artistId),
      followedAlbumIds: followedAlbums.map((fa: any) => fa.album.id),
      followedPlaylistIds: followedPlaylists.map((fp: any) => fp.playlistId),
    };
  },

  // Social Methods (Phase 16)
  followUser: async (followerId: string, followingId: string) => {
    if (followerId === followingId) throw new AppError('Bạn không thể theo dõi chính mình', 400, ErrorCodes.VALIDATION_ERROR);

    const targetUser = await prisma.user.findUnique({ where: { id: followingId } });
    if (!targetUser) throw new AppError('Người dùng không tồn tại', 404, ErrorCodes.NOT_FOUND);

    // Kiểm tra xem đã follow chưa để tránh spam notify
    const existing = await (prisma as any).userFollow.findUnique({
      where: {
        followerId_followingId: { followerId, followingId }
      }
    });

    if (!existing) {
      await (prisma as any).userFollow.create({
        data: { followerId, followingId }
      });

      // Gửi thông báo cho người được theo dõi
      const follower = await prisma.user.findUnique({ where: { id: followerId }, select: { name: true } });
      if (follower) {
        await NotificationService.createNotification(
          followingId,
          'SOCIAL_FOLLOW',
          'Người theo dõi mới',
          `${follower.name} đã bắt đầu theo dõi bạn`,
          { followerId }
        );
      }
    }

    return { message: 'Đã theo dõi người dùng' };
  },

  unfollowUser: async (followerId: string, followingId: string) => {
    await (prisma as any).userFollow.deleteMany({
      where: { followerId, followingId }
    });

    return { message: 'Đã bỏ theo dõi người dùng' };
  },

  getFollowingActivity: async (userId: string) => {
    const following = await (prisma as any).userFollow.findMany({
      where: { followerId: userId },
      select: {
        followingId: true,
        following: {
          select: { id: true, name: true, avatarUrl: true, role: true }
        }
      }
    });

    // Lọc bỏ những người có role ARTIST (Yêu cầu Phase 16)
    const followingUsers = following.filter((f: { following: { role: string } }) => f.following.role !== 'ARTIST');
    const friendIds = followingUsers.map((f: { followingId: string }) => f.followingId);

    // Lấy trạng thái từ Redis cho từng friend
    const { redis } = await import('../../shared/config/redis');

    const activities = await Promise.all(friendIds.map(async (friendId: string) => {
      const stateStr = await redis.get(`player_state:${friendId}`);
      if (!stateStr) return null;

      const state = JSON.parse(stateStr);
      // Lấy thêm thông tin bài hát nếu cần
      const song = await prisma.song.findUnique({
        where: { id: state.currentSongId },
        select: { title: true, artist: { select: { stageName: true } } }
      });

      const friend = followingUsers.find((f: { followingId: string }) => f.followingId === friendId)?.following;

      return {
        user: friend,
        currentSong: song ? {
          id: state.currentSongId,
          title: song.title,
          artistName: song.artist.stageName
        } : null,
        isPlaying: state.isPlaying,
        timestamp: state.timestamp
      };
    }));

    return activities.filter(Boolean).sort((a, b) => (b as any).timestamp - (a as any).timestamp);
  }
};
