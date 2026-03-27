import { Router } from 'express';
import { authController } from './auth.controller';
import { validateRequest } from '../../shared/middleware/validate.middleware';
import { authMiddleware } from '../../shared/middleware/auth.middleware';
import { 
  registerSchema, 
  loginSchema, 
  verifyEmailSchema, 
  refreshSchema 
} from './auth.schema';

export const authRouter = Router();

// Public routes (không cần đăng nhập)
authRouter.post('/register', validateRequest(registerSchema), authController.register);
authRouter.post('/login', validateRequest(loginSchema), authController.login);
authRouter.post('/verify-email', validateRequest(verifyEmailSchema), authController.verifyEmail);
authRouter.post('/refresh', validateRequest(refreshSchema), authController.refresh);

// Oauth
authRouter.get('/google', authController.googleAuth);
authRouter.get('/google/callback', authController.googleCallback);

// Protected routes (cần Access Token)
authRouter.use(authMiddleware);

authRouter.post('/logout', authController.logout);
authRouter.post('/2fa/setup', authController.setup2FA);
authRouter.post('/2fa/verify', authController.verify2FA);
