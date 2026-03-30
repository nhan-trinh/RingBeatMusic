import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Icons } from '../../components/ui/icons';

const forgotSchema = z.object({
  email: z.string().min(1, 'Vui lòng nhập email.').email('Email không hợp lệ.'),
});

type ForgotFormValues = z.infer<typeof forgotSchema>;

export const ForgotPasswordPage = () => {
  const [serverMsg, setServerMsg] = useState<{ type: 'error' | 'success', text: string } | null>(null);
  const navigate = useNavigate();

  const forgotMutation = useMutation({
    mutationFn: async (email: string) => {
      return (await api.post('/auth/forgot-password', { email })) as any;
    },
    onSuccess: (_, email) => {
      setServerMsg({ type: 'success', text: 'Đã gửi yêu cầu! Đang chuyển trang nhập mã...' });
      setTimeout(() => navigate('/reset-password', { state: { email } }), 2000);
    },
    onError: (error: any) => {
      setServerMsg({ type: 'error', text: error.response?.data?.error?.message || 'Có lỗi xảy ra.' });
    },
  });

  const { register, handleSubmit, formState: { errors } } = useForm<ForgotFormValues>({
    resolver: zodResolver(forgotSchema),
  });

  const onSubmit = (data: ForgotFormValues) => {
    setServerMsg(null);
    forgotMutation.mutate(data.email);
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-gradient-to-b from-[#2a2a2a] to-[#000000]">
      <header className="px-8 py-6 w-full flex justify-center sm:justify-start">
        <Link to="/"><Icons.logo className="" /></Link>
      </header>

      <div className="flex-1 flex flex-col items-center pt-8 px-4 pb-16">
        <div className="w-full max-w-[734px] rounded-lg py-16 px-8 sm:px-[104px] text-white">
          <div className="mx-auto w-full max-w-[324px]">
            <h1 className="text-3xl font-bold tracking-tighter text-center mb-6">Đặt lại mật khẩu</h1>
            <p className="text-center text-[#a7a7a7] text-sm font-semibold mb-8">
              Nhập địa chỉ email liên kết với tài khoản Spotify của bạn, chúng tôi sẽ cấp mã để đặt lại mật khẩu.
            </p>

            {serverMsg && (
              <div className={`mb-6 rounded-sm px-4 py-3 text-sm font-semibold flex ${serverMsg.type === 'error' ? 'bg-[#e22134] text-white' : 'bg-[#1ed760] text-black'}`}>
                {serverMsg.text}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-bold">Địa chỉ email</Label>
                <Input
                  id="email"
                  placeholder="name@domain.com"
                  className="rounded-sm border border-[#727272] h-12 bg-[#121212]"
                  {...register('email')}
                  error={!!errors.email}
                />
                {errors.email && <p className="text-sm text-[#e22134]">{errors.email.message}</p>}
              </div>

              <Button
                type="submit"
                variant="spotify"
                size="lg"
                className="w-full mt-8 rounded-full h-12 text-base"
                disabled={forgotMutation.isPending}
              >
                {forgotMutation.isPending ? 'Đang gửi...' : 'Gửi mã xác nhận'}
              </Button>
            </form>

            <div className="mt-8 text-center text-sm font-bold underline">
              <Link to="/login" className="text-white hover:text-[#1ed760]">Quay lại màn hình đăng nhập</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
