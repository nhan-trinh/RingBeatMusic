import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Icons } from '../../components/ui/icons';

const passwordRegex = /^(?=.*[A-Za-z])(?=.*[\d#?!&@$%\^&\*]).{10,}$/;

const resetSchema = z.object({
  otp: z.string().length(6, 'Mã OTP phải gồm 6 chữ số.'),
  newPassword: z.string().min(10, 'Mật khẩu phải từ 10 kí tự').regex(passwordRegex, 'Mật khẩu phải chứa ít nhất 1 chữ cái và 1 số (hoặc kí tự đặc biệt)'),
});

type ResetFormValues = z.infer<typeof resetSchema>;

export const ResetPasswordPage = () => {
  const [serverMsg, setServerMsg] = useState<{ type: 'error' | 'success', text: string } | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const email = location.state?.email || '';

  const resetMutation = useMutation({
    mutationFn: async (data: ResetFormValues) => {
      return (await api.post('/auth/reset-password', { email, ...data })) as any;
    },
    onSuccess: (res) => {
      setServerMsg({ type: 'success', text: res.data?.message || 'Thành công! Chuyển tới Đăng nhập...' });
      setTimeout(() => navigate('/login'), 2500);
    },
    onError: (error: any) => {
      setServerMsg({ type: 'error', text: error.response?.data?.error?.message || 'Có lỗi xảy ra.' });
    },
  });

  const { register, handleSubmit, formState: { errors } } = useForm<ResetFormValues>({
    resolver: zodResolver(resetSchema),
  });

  const onSubmit = (data: ResetFormValues) => {
    setServerMsg(null);
    if (!email) {
      setServerMsg({ type: 'error', text: 'Thiếu email để xử lý. Vui lòng quay lại bước trước.' });
      return;
    }
    resetMutation.mutate(data);
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-[#121212] lg:bg-gradient-to-b lg:from-[#2a2a2a] lg:to-[#000000]">
      <header className="px-8 py-6 w-full flex justify-center sm:justify-start">
        <Link to="/"><Icons.logo className="" /></Link>
      </header>

      <div className="flex-1 flex flex-col items-center pt-8 px-4 pb-16">
        <div className="w-full max-w-[734px] rounded-lg py-16 px-8 sm:px-[104px] text-white">
          <div className="mx-auto w-full max-w-[324px]">
            <h1 className="text-3xl font-bold tracking-tighter text-center mb-6">Tạo mật khẩu mới</h1>
            <p className="text-center text-[#a7a7a7] text-sm font-semibold mb-8">
              Mở cổng Terminal ở phía BE để xem mã OTP của <strong>{email}</strong> nhé.
            </p>

            {serverMsg && (
              <div className={`mb-6 rounded-sm px-4 py-3 text-sm font-semibold flex ${serverMsg.type === 'error' ? 'bg-[#e22134] text-white' : 'bg-[#1ed760] text-black'}`}>
                {serverMsg.text}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otp" className="text-sm font-bold">Mã xác nhận (OTP)</Label>
                <Input
                  id="otp"
                  maxLength={6}
                  placeholder="Nhập 6 số từ Terminal"
                  className="rounded-sm border border-[#727272] h-12 tracking-widest text-center text-lg font-bold"
                  {...register('otp')}
                  error={!!errors.otp}
                />
                {errors.otp && <p className="text-sm text-[#e22134]">{errors.otp.message}</p>}
              </div>

              <div className="space-y-2 pt-4">
                <Label htmlFor="newPassword" className="text-sm font-bold">Mật khẩu mới</Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="Mật khẩu mới bảo mật cao"
                  className="rounded-sm border border-[#727272] h-12"
                  {...register('newPassword')}
                  error={!!errors.newPassword}
                />
                {errors.newPassword && <p className="text-sm text-[#e22134]">{errors.newPassword.message}</p>}
              </div>

              <Button
                type="submit"
                variant="spotify"
                size="lg"
                className="w-full mt-8 rounded-full h-12 text-base"
                disabled={resetMutation.isPending}
              >
                {resetMutation.isPending ? 'Đang cập nhật...' : 'Đổi Mật Khẩu'}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
