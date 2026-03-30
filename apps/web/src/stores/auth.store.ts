import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'USER_FREE' | 'USER_PREMIUM' | 'ARTIST' | 'PODCAST_HOST' | 'MODERATOR' | 'ADMIN';
  avatarUrl: string | null;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  
  // Actions
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  updateUser: (user: Partial<User>) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,

      setAuth: (user, accessToken, refreshToken) => {
        localStorage.setItem('refreshToken', refreshToken);
        set({ user, accessToken, isAuthenticated: true });
      },

      setTokens: (accessToken, refreshToken) => {
        localStorage.setItem('refreshToken', refreshToken);
        set({ accessToken });
      },

      updateUser: (update) => set((state) => ({
        user: state.user ? { ...state.user, ...update } : null
      })),

      logout: () => {
        localStorage.removeItem('refreshToken');
        set({ user: null, accessToken: null, isAuthenticated: false });
        // Sẽ gọi API logout xoá Redis sau
      },
    }),
    {
      name: 'auth-storage',
      // Chỉ lưu accessToken và thông tin user sơ bộ vào storage. Refresh Token chạy ngầm qua localStorage
      partialize: (state) => ({ 
        user: state.user, 
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated 
      }),
      storage: createJSONStorage(() => localStorage),
    }
  )
);
