import axios, { InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../stores/auth.store';

// Tạo instance axios kết nối Backend
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Để gửi/nhận cookie nếu cần
});

// Thêm Access Token vào mọi Request
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().accessToken;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Xử lý tự động Refresh Token nếu response trả về 401 Unauthorized
let isRefreshing = false;
let failedQueue: { resolve: (token: string) => void; reject: (err: any) => void; }[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) prom.reject(error);
    else prom.resolve(token as string);
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => {
    // Chỉ trả về data, bỏ qua wrapper axios để dọn dẹp code FE
    return response.data;
  },
  async (error) => {
    const originalRequest = error.config;

    // Tránh vòng lặp nêú login hoặc refresh bị lỗi 401
    if (['/auth/login', '/auth/refresh-token'].includes(originalRequest.url)) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) throw new Error('No refresh token');

        // Gọi API cấp token mới băng axios cơ bản (để khỏi lặp interceptor cũ)
        const refreshResponse = await axios.post(
          `${import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1'}/auth/refresh-token`,
          { refreshToken }
        );

        const { accessToken, refreshToken: newRefresh } = refreshResponse.data.data;

        useAuthStore.getState().setTokens(accessToken, newRefresh);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;

        processQueue(null, accessToken);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        useAuthStore.getState().logout();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
