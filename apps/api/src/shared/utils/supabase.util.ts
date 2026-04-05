import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env';

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

export const SupabaseUtil = {
  createUploadUrl: async (bucket: string, filePath: string) => {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUploadUrl(filePath);

    if (error) throw error;
    return data;
  },

  createStreamUrl: async (bucket: string, filePath: string, expiresIn: number = 3600) => {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(filePath, expiresIn);

    if (error) throw error;
    return data.signedUrl;
  },

  getPublicUrl: (bucket: string, filePath: string) => {
    const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
    return data.publicUrl;
  },

  // Upload file trực tiếp từ backend (dùng cho avatar/cover nhỏ)
  uploadBuffer: async (bucket: string, filePath: string, buffer: Buffer, contentType: string) => {
    // Đảm bảo bucket tồn tại (tự tạo nếu chưa có)
    const { data: buckets } = await supabase.storage.listBuckets();
    const exists = buckets?.some((b) => b.name === bucket);
    if (!exists) {
      await supabase.storage.createBucket(bucket, { public: true });
    }

    const { error } = await supabase.storage
      .from(bucket)
      .upload(filePath, buffer, { contentType, upsert: true });

    if (error) throw error;
    const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
    return data.publicUrl;
  },
};
