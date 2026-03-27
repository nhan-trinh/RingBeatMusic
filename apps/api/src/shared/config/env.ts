import { z } from 'zod';

// Validate và export tất cả biến môi trường
// Dừng server ngay nếu thiếu biến bắt buộc
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3000'),

  // Database
  DATABASE_URL: z.string().min(1, 'DATABASE_URL là bắt buộc'),
  MONGODB_URI: z.string().min(1, 'MONGODB_URI là bắt buộc'),
  REDIS_URL: z.string().min(1, 'REDIS_URL là bắt buộc'),

  // JWT
  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET phải dài ít nhất 32 ký tự'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET phải dài ít nhất 32 ký tự'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  // Supabase
  SUPABASE_URL: z.string().url('SUPABASE_URL không hợp lệ'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'SUPABASE_SERVICE_ROLE_KEY là bắt buộc'),

  // Meilisearch
  MEILI_HOST: z.string().default('http://localhost:7700'),
  MEILI_MASTER_KEY: z.string().min(1, 'MEILI_MASTER_KEY là bắt buộc'),

  // Email
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().default('587'),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  EMAIL_FROM: z.string().default('noreply@spotify-clone.com'),

  // VNPAY
  VNPAY_TMN_CODE: z.string().optional(),
  VNPAY_HASH_SECRET: z.string().optional(),
  VNPAY_URL: z.string().optional(),
  VNPAY_RETURN_URL: z.string().optional(),

  // Google OAuth
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_CALLBACK_URL: z.string().optional(),

  // Frontend CORS
  FRONTEND_URL: z.string().default('http://localhost:5173'),
  BACKEND_URL: z.string().default('http://localhost:3001'),

  // JWT alias used in socket auth
  JWT_SECRET: z.string().optional(),

  // Cloudinary
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),

  // Sentry
  SENTRY_DSN: z.string().optional(),
});

const _parsed = envSchema.safeParse(process.env);

if (!_parsed.success) {
  console.error('❌ Biến môi trường không hợp lệ:');
  console.error(_parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = _parsed.data;
export type Env = typeof env;
