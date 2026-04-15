import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  name: string;
  gender?: string | null;
  googleId?: string | null;
  role: 'USER_FREE' | 'USER_PREMIUM' | 'ARTIST' | 'PODCAST_HOST' | 'MODERATOR' | 'ADMIN';
  avatarUrl: string | null;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  
  // Actions
  setAuth: (user: User, accessToken: string) => void;
  setTokens: (accessToken: string) => void;
  updateUser: (user: Partial<User>) => void;
  logout: () => void;
  setAuthenticated: (status: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,

      setAuth: (user, accessToken) => {
        set({ user, accessToken, isAuthenticated: true });
      },

      setTokens: (accessToken) => {
        set({ accessToken, isAuthenticated: true });
      },

      updateUser: (update) => set((state) => ({
        user: state.user ? { ...state.user, ...update } : null
      })),

      logout: () => {
        set({ user: null, accessToken: null, isAuthenticated: false });
      },

      setAuthenticated: (status) => set({ isAuthenticated: status }),
    }),
    {
      name: 'auth-storage',
      // CHỈ lưu thông tin user. Access Token lưu trong bộ nhớ (In-memory)
      // Refresh Token do trình duyệt tự quản lý qua HttpOnly Cookie.
      partialize: (state) => ({ 
        user: state.user, 
        isAuthenticated: state.isAuthenticated 
      }),
      storage: createJSONStorage(() => localStorage),
    }
  )
);
