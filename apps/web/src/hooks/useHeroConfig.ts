import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

interface HeroConfig {
  backgroundUrl: string | null;
  backgroundType: 'video' | 'image';
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
        };
      }
    },
    staleTime: 5 * 60 * 1000, // Cache 5 phút
    refetchOnWindowFocus: false,
  });
};
