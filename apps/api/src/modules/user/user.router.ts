import { Router } from 'express';
import { userController } from './user.controller';
import { authMiddleware } from '../../shared/middleware/auth.middleware';
import { validateRequest } from '../../shared/middleware/validate.middleware';
import { uploadImage } from '../../shared/middleware/upload.middleware';
import { updateProfileSchema, changePasswordSchema } from './user.schema';

export const userRouter = Router();

// Toàn bộ User routes yêu cầu đăng nhập
userRouter.use(authMiddleware);

userRouter.get('/profile', userController.getProfile);
userRouter.patch('/profile', validateRequest(updateProfileSchema), userController.updateProfile);
userRouter.patch('/password', validateRequest(changePasswordSchema), userController.changePassword);

// Phải cấu hình Upload middleware
userRouter.post('/avatar', uploadImage.single('avatar'), userController.uploadAvatar);

// Danh mục Social (Nhạc đã thích, đang flow ai, hoạt động bạn bè)
userRouter.get('/library', userController.getLibrary);
userRouter.get('/history', userController.getRecentlyPlayed);
userRouter.get('/following/activity', userController.getFollowingActivity);

// Follow / Unfollow
userRouter.post('/:id/follow', userController.followUser);
userRouter.delete('/:id/unfollow', userController.unfollowUser);

// Hồ sơ công khai
userRouter.get('/:id', userController.getPublicProfile);
