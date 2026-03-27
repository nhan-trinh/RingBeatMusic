import { prisma } from '../../shared/config/database';
import { AppError, ErrorCodes } from '../../shared/utils/app-error';
import { v2 as cloudinary } from 'cloudinary';
import bcrypt from 'bcryptjs';

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
    const user = await prisma.user.update({
      where: { id: userId },
      data: { name, gender },
      select: { id: true, name: true, gender: true, avatarUrl: true },
    });
    return user;
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

          const user = await prisma.user.update({
            where: { id: userId },
            data: { avatarUrl: result.secure_url },
            select: { id: true, avatarUrl: true },
          });

          resolve(user);
        }
      );
      stream.end(file.buffer);
    });
  },

  getLibrary: async (userId: string) => {
    const likedSongs = await prisma.likedSong.findMany({
      where: { userId },
      include: {
        song: { select: { id: true, title: true, coverUrl: true, artist: { select: { stageName: true } } } }
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

    return {
      likedSongs: likedSongs.map(ls => ls.song),
      followedArtists: followedArtists.map(fa => fa.artist),
      followedAlbums: followedAlbums.map(fa => fa.album),
    };
  },
};
