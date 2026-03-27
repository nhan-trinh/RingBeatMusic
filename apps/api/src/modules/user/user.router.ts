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

// Danh mục Social (Nhạc đã thích, đang flow ai)
userRouter.get('/library', userController.getLibrary);
