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
  }
};
