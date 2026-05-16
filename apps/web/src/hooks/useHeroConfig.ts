import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

interface HeroConfig {
  backgroundUrl: string | null;
  backgroundType: 'video' | 'image';
  heroText: string;
}

export const useHeroConfig = () => {
  return useQuery({
    queryKey: ['hero_config'],
    queryFn: async (): Promise<HeroConfig> => {
      try {
        const res = await api.get('/admin/hero-config');
        return res.data;
      } catch (e) {
        return {
          backgroundUrl: null,
          backgroundType: 'video',
          heroText: 'Truy cập vào hệ thống âm thanh tần số cao. Dữ liệu telemetry cho thấy tín hiệu ổn định trên toàn bộ các node thứ cấp. Sẵn sàng truyền phát tín hiệu đồng bộ.'
        };
      }
    },
    staleTime: 5 * 60 * 1000, // Cache 5 phút
    refetchOnWindowFocus: false,
  });
};
