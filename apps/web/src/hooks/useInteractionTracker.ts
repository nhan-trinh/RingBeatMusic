import { useEffect, useRef } from 'react';
import { api } from '../lib/api';
import { useAuthStore } from '../stores/auth.store';

type InteractionType = 'ARTIST' | 'ALBUM' | 'PLAYLIST' | 'SONG';

export const useInteractionTracker = (type: InteractionType, targetId: string | undefined) => {
  const { isAuthenticated } = useAuthStore();
  const trackedId = useRef<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !targetId || trackedId.current === targetId) return;

    const track = async () => {
      try {
        await api.post('/player/track-interaction', { type, targetId });
        trackedId.current = targetId;
      } catch (e) {
        console.error('Lỗi khi ghi nhận tương tác:', e);
      }
    };

    // Delay một chút để tránh track các lượt click nhầm / chuyển trang quá nhanh
    const timer = setTimeout(track, 2000);

    return () => clearTimeout(timer);
  }, [type, targetId, isAuthenticated]);
};
