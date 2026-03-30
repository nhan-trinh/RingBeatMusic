import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../../stores/auth.store';

export const AuthCallbackPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  useEffect(() => {
    const accessToken = searchParams.get('accessToken');
    const refreshToken = searchParams.get('refreshToken');
    const userStr = searchParams.get('user');

    if (accessToken && refreshToken && userStr) {
      try {
        const user = JSON.parse(userStr);
        setAuth(user, accessToken, refreshToken);
        navigate('/', { replace: true });
      } catch (err) {
        navigate('/login?error=JSONParseError', { replace: true });
      }
    } else {
      navigate('/login?error=MissingTokens', { replace: true });
    }
  }, [searchParams, navigate, setAuth]);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-[#121212] text-white">
      <div className="text-center">
        <h2 className="text-xl font-bold mb-4">Đang xác thực bảo mật...</h2>
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#1ed760] border-t-transparent mx-auto"></div>
      </div>
    </div>
  );
};
