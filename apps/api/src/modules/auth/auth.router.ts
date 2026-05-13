import { Router } from 'express';
import { authController } from './auth.controller';
import { validateRequest } from '../../shared/middleware/validate.middleware';
import { authMiddleware } from '../../shared/middleware/auth.middleware';
import {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  refreshSchema,
  resolveDeviceLimitSchema,
  confirmDeleteAccountSchema,
} from './auth.schema';

export const authRouter = Router();

// ── Public routes ──────────────────────────────
authRouter.post('/register', validateRequest(registerSchema), authController.register);
authRouter.post('/login', validateRequest(loginSchema), authController.login);
authRouter.post('/check-email', authController.checkEmail);
authRouter.post('/verify-email', validateRequest(verifyEmailSchema), authController.verifyEmail);
authRouter.post('/refresh', validateRequest(refreshSchema), authController.refresh);
authRouter.post('/forgot-password', authController.forgotPassword);
authRouter.post('/reset-password', authController.resetPassword);

// Device Limit Resolution — public (user chưa có Access Token)
authRouter.post('/resolve-device-limit', validateRequest(resolveDeviceLimitSchema), authController.resolveDeviceLimit);

// OAuth
authRouter.get('/google', authController.googleAuth);
authRouter.get('/google/callback', authController.googleCallback);

// ── Protected routes (cần Access Token) ────────
authRouter.use(authMiddleware);

authRouter.post('/logout', authController.logout);
authRouter.post('/2fa/setup', authController.setup2FA);
authRouter.post('/2fa/verify', authController.verify2FA);

// Session Management
authRouter.get('/sessions', authController.getActiveSessions);
authRouter.delete('/sessions/:id', authController.revokeSession);

// Account Deletion
authRouter.post('/account/delete-request', authController.requestAccountDeletion);
authRouter.delete('/account/delete-confirm', validateRequest(confirmDeleteAccountSchema), authController.confirmAccountDeletion);
