import { useMutation } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useAuthStore } from '../stores/auth.store';

// Login Mutation
export const useLogin = () => {
  const setAuth = useAuthStore(state => state.setAuth);

  return useMutation({
    mutationFn: async (credentials: Record<string, any>) => {
      const response = await api.post('/auth/login', credentials);
      return response as any; // backend format { success, data, message }
    },
    onSuccess: (res) => {
      if (res.success && res.data) {
        const { user, accessToken, refreshToken } = res.data;
        setAuth(user, accessToken, refreshToken);
      }
    },
  });
};

// Register Mutation
export const useRegister = () => {
  return useMutation({
    mutationFn: async (data: Record<string, any>) => {
      const response = await api.post('/auth/register', data);
      return response as any;
    },
  });
};
