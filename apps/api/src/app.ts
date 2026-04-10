import 'dotenv/config';
import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './shared/config/env';
import { errorMiddleware } from './shared/middleware/error.middleware';
import { optionalAuthMiddleware } from './shared/middleware/auth.middleware';
import { maintenanceMiddleware } from './shared/middleware/maintenance.middleware';

// Module routers
import { authRouter } from './modules/auth/auth.router';
import { userRouter } from './modules/user/user.router';
import { songRouter } from './modules/song/song.router';
import { albumRouter } from './modules/album/album.router';
import { artistRouter } from './modules/artist/artist.router';
import { playlistRouter } from './modules/playlist/playlist.router';
import { playerRouter } from './modules/player/player.router';
import { searchRouter } from './modules/search/search.router';
import { subscriptionRouter } from './modules/subscription/subscription.router';
import { podcastRouter } from './modules/podcast/podcast.router';
import { notificationRouter } from './modules/notification/notification.router';
import { moderationRouter } from './modules/moderation/moderation.router';
import { adminRouter } from './modules/admin/admin.router';
import { homeRouter } from './modules/home/home.router';

export const createApp = (): Application => {
  const app = express();
  
  // Quan trọng cho Deploy: Render dùng reverse proxy, cần bật trust proxy để nhận diện đúng https
  app.set('trust proxy', 1);

  // ---- Security Middleware ----
  app.use(helmet());
  app.use(
    cors({
      origin: env.FRONTEND_URL,
      credentials: true,
    })
  );

  // ---- Logging ----
  if (env.NODE_ENV !== 'test') {
    app.use(morgan('dev'));
  }

  // ---- Body Parsing ----
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // ---- Health Check ----
  app.get('/health', (_req: Request, res: Response) => {
    res.json({ success: true, message: 'Server đang hoạt động', timestamp: new Date().toISOString() });
  });

  // ---- API Routes ----
  const API_V1 = '/api/v1';

  // Maintenance & Optional Auth Global Check
  app.use(optionalAuthMiddleware);
  app.use(maintenanceMiddleware);

  app.use(`${API_V1}/auth`, authRouter);
  app.use(`${API_V1}/users`, userRouter);
  app.use(`${API_V1}/songs`, songRouter);
  app.use(`${API_V1}/albums`, albumRouter);
  app.use(`${API_V1}/artists`, artistRouter);
  app.use(`${API_V1}/playlists`, playlistRouter);
  app.use(`${API_V1}/player`, playerRouter);
  app.use(`${API_V1}/search`, searchRouter);
  app.use(`${API_V1}/subscriptions`, subscriptionRouter);
  app.use(`${API_V1}/podcasts`, podcastRouter);
  app.use(`${API_V1}/notifications`, notificationRouter);
  app.use(`${API_V1}/moderation`, moderationRouter);
  app.use(`${API_V1}/admin`, adminRouter);
  app.use(`${API_V1}/home`, homeRouter);

  // ---- 404 Handler ----
  app.use((_req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Route không tồn tại' },
    });
  });

  // ---- Global Error Handler (phải đặt cuối cùng) ----
  app.use(errorMiddleware);

  return app;
};
