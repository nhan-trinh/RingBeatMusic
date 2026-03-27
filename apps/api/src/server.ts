import 'dotenv/config';
import http from 'http';
import { Server as SocketServer } from 'socket.io';
import { createApp } from './app';
import { env } from './shared/config/env';
import { prisma } from './shared/config/database';
import { connectMongoDB } from './shared/config/mongodb';
import { redis } from './shared/config/redis';
import './shared/config/cloudinary'; // Initialize Cloudinary
import { initMeiliSearch } from './shared/config/meilisearch';
import { initSocketServer } from './shared/socket/socket.server';

const startServer = async (): Promise<void> => {
  // Kết nối databases
  await connectMongoDB();

  await prisma.$connect();
  console.log('✅ PostgreSQL đã kết nối');

  await initMeiliSearch();



  await redis.ping();
  // (Log ✅ Redis đã kết nối sẽ tự động in ra từ sự kiện 'connect' trong file redis.ts)

  // Tạo Express app và HTTP server
  const app = createApp();
  const httpServer = http.createServer(app);

  // Socket.IO setup
  const io = new SocketServer(httpServer, {
    cors: {
      origin: env.FRONTEND_URL,
      credentials: true,
    },
  });

  initSocketServer(io);

  const port = parseInt(env.PORT, 10);
  httpServer.listen(port, () => {
    console.log(`🚀 Server đang chạy tại http://localhost:${port}`);
    console.log(`📋 Health check: http://localhost:${port}/health`);
    console.log(`🌍 Môi trường: ${env.NODE_ENV}`);
  });

  // Graceful shutdown
  const shutdown = async (): Promise<void> => {
    console.log('\n🔄 Đang tắt server...');
    await prisma.$disconnect();
    httpServer.close(() => {
      console.log('✅ Server đã tắt');
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
};

startServer().catch((err: Error) => {
  console.error('❌ Lỗi khởi động server:', err);
  process.exit(1);
});
