import { QueryClient } from '@tanstack/react-query';

// Khởi tạo Query Client dùng chung cho toàn dự án
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // Tránh call mạng vô ích mỗi lần người dùng focus lại tab
      retry: 1, // Thử lại 1 lần nếu API fail (VD: lỗi mạng)
      staleTime: 5 * 60 * 1000, // Data được coi là fresh trong 5 phút
    },
  },
});
