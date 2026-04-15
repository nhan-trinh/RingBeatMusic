import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useAuthStore } from '../../stores/auth.store';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';

export const VerifyEmailPage = () => {
  const [otp, setOtp] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  const setAuth = useAuthStore(state => state.setAuth);

  const email = location.state?.email || '';

  const verifyMutation = useMutation({
    mutationFn: async (data: { email: string; otp: string }) => {
      const response = await api.post('/auth/verify-email', data);
      return response as any;
    },
    onSuccess: (res) => {
      if (res.success && res.data) {
        const { user, accessToken } = res.data;
        setAuth(user, accessToken);
        navigate('/');
      }
    },
    onError: (error: any) => {
      setErrorMsg(error.response?.data?.error?.message || 'Mã xác thực không hợp lệ');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setErrorMsg('Không tìm thấy email cần xác thực. Trở về trang đăng nhập.');
      return;
    }
    setErrorMsg('');
    verifyMutation.mutate({ email, otp });
  };

  return (
    <div className="flex h-screen w-full flex-col items-center pt-16 bg-gradient-to-b from-[#2a2a2a] to-[#000000] px-4">
      <div className="w-full max-w-[500px] rounded-lg bg-[#121212] py-12 px-8 shadow-lg text-white text-center">
        <h1 className="text-3xl font-bold tracking-tight text-white mb-4">Xác thực Email</h1>
        <p className="text-[#a7a7a7] mb-8">
          Hệ thống đang ở chế độ DEV. Hãy mở cửa sổ Terminal backend (`npm run dev:api`) 
          để xem mã OTP được gửi cho email <strong>{email || 'của bạn'}</strong>.
        </p>

        {errorMsg && (
          <div className="mb-6 rounded-md bg-[#e22134] p-3 text-sm font-semibold">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Input
              type="text"
              placeholder="Nhập mã OTP 6 số"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="text-center text-lg tracking-widest font-bold h-14"
              maxLength={6}
            />
          </div>

          <Button
            type="submit"
            variant="spotify"
            size="lg"
            className="w-full"
            disabled={verifyMutation.isPending || otp.length < 6}
          >
            {verifyMutation.isPending ? 'Đang xác thực...' : 'Xác thực ngay'}
          </Button>
        </form>
      </div>
    </div>
  );
};
