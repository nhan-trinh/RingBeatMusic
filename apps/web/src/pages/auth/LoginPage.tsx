import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useLogin } from '../../hooks/useAuthMutation';
import { api } from '../../lib/api';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Icons } from '../../components/ui/icons';

const loginSchema = z.object({
  email: z.string().min(1, 'Vui lòng nhập email.').email('Email không hợp lệ.'),
  password: z.string().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export const LoginPage = () => {
  const [step, setStep] = useState(1);
  const [emailValue, setEmailValue] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const loginMutation = useLogin();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const {
    register,
    handleSubmit,
    trigger,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const handleNextStep = async () => {
    const isEmailValid = await trigger('email');
    if (isEmailValid) {
      const email = getValues('email');
      setIsCheckingEmail(true);
      setErrorMsg('');
      try {
        const res = await api.post('/auth/check-email', { email }) as any;
        if (res.data?.exists) {
          if (res.data?.isGoogleLogin) {
            setErrorMsg('Email này liên kết với Google. Vui lòng chọn "Continue with Google".');
          } else {
            setEmailValue(email);
            setStep(2);
          }
        } else {
          setErrorMsg('Email chưa được đăng ký trong hệ thống.');
        }
      } catch (error) {
        setErrorMsg('Lỗi kết nối máy chủ khi kiểm tra email.');
      } finally {
        setIsCheckingEmail(false);
      }
    }
  };

  const onSubmit = (data: LoginFormValues) => {
    setErrorMsg('');
    loginMutation.mutate(data, {
      onSuccess: () => {
        navigate(from, { replace: true });
      },
      onError: (error: any) => {
        setErrorMsg(error.response?.data?.error?.message || 'Tên người dùng hoặc mật khẩu không chính xác.');
      },
    });
  };

  const handleGoogleLogin = () => {
    // Chuyển hướng trình duyệt đén API Backend để bắt đầu quy trình Google OAuth
    window.location.href = `${import.meta.env.VITE_API_URL}/auth/google`;
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-[#121212] lg:bg-gradient-to-b lg:from-[#2a2a2a] lg:to-[#000000]">
      <header className="px-8 py-6 w-full flex justify-center sm:justify-start">
        <Link to="/">
          <Icons.logo className="" />
        </Link>
      </header>

      <div className="flex-1 flex flex-col items-center pt-8 px-4 pb-16">

        <div className="mx-auto w-full max-w-[324px]">
          {step === 1 && (
            <>
              <h1 className="text-[32px] md:text-[40px] font-bold tracking-tighter text-center mb-10 leading-tight">Welcome back</h1>

              {errorMsg && (
                <div className="mb-6 rounded-sm bg-[#e22134] px-4 py-3 text-sm font-semibold flex items-center gap-2">
                  <span className="text-white">{errorMsg}</span>
                </div>
              )}

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-bold">Email</Label>
                  <Input
                    id="email"
                    placeholder="Email address"
                    className="rounded-[4px] border border-[#727272] h-12 hover:border-white focus-visible:ring-2 focus-visible:ring-offset-0 focus-visible:ring-white bg-[#121212]"
                    {...register('email')}
                    error={!!errors.email}
                  />
                  {errors.email && <p className="text-sm text-[#e22134]">{errors.email.message}</p>}
                </div>

                <Button
                  type="button"
                  onClick={handleNextStep}
                  variant="spotify"
                  size="lg"
                  className="w-full mt-4 rounded-full h-12 text-base font-bold shadow-none"
                  disabled={isCheckingEmail}
                >
                  {isCheckingEmail ? 'Wait...' : 'Continue'}
                </Button>
              </div>

              <div className="flex items-center gap-4 my-8">
                <div className="flex-1 h-[1px] bg-[#292929]"></div>
                <span className="text-sm font-bold text-[#a7a7a7]">or</span>
                <div className="flex-1 h-[1px] bg-[#292929]"></div>
              </div>

              <div className="flex flex-col gap-4">
                <Button
                  variant="outline"
                  className="w-full h-12 rounded-full font-bold border-[#878787] text-white hover:border-white bg-transparent justify-center gap-3"
                  onClick={handleGoogleLogin}
                >
                  <Icons.google className="h-5 w-5 mr-1" />
                  Continue with Google
                </Button>
              </div>

              <hr className="border-[#292929] my-8" />

              <div className="text-center text-[#a7a7a7] text-[15px] font-medium">
                Don't have an account?{' '}
                <Link to="/register" className="text-white hover:text-[#1ed760] font-bold underline underline-offset-1">
                  Sign up
                </Link>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="flex flex-col mb-8">
                <div className="flex items-center text-[#a7a7a7] mb-6">
                  <button type="button" onClick={() => setStep(1)} className="hover:text-white p-1">
                    <svg role="img" height="24" width="24" viewBox="0 0 24 24" fill="currentColor"><path d="M15.957 2.793a1 1 0 0 1 0 1.414L8.164 12l7.793 7.793a1 1 0 1 1-1.414 1.414L5.336 12l9.207-9.207a1 1 0 0 1 1.414 0z"></path></svg>
                  </button>
                </div>
                <h1 className="text-3xl font-bold tracking-tighter text-left mb-2 leading-tight">Enter your password</h1>
                <p className="text-[#a7a7a7] text-sm">{emailValue}</p>
              </div>

              {errorMsg && (
                <div className="mb-6 rounded-sm bg-[#e22134] px-4 py-3 text-sm font-semibold flex items-center gap-2">
                  <span className="text-white">{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-bold">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Password"
                    className="rounded-[4px] border border-[#727272] h-12 hover:border-white focus-visible:ring-2 focus-visible:ring-offset-0 focus-visible:ring-white bg-[#121212]"
                    {...register('password')}
                    error={!!errors.password}
                  />
                  {errors.password && <p className="text-sm text-[#e22134]">{errors.password.message}</p>}
                </div>

                <div className="pt-2">
                  <Link to="/forgot-password" className="text-white hover:text-[#1ed760] text-sm font-bold underline underline-offset-1">
                    Forgot your password?
                  </Link>
                </div>

                <Button
                  type="submit"
                  variant="spotify"
                  size="lg"
                  className="w-full mt-8 rounded-full h-12 text-base font-bold shadow-none"
                  disabled={isSubmitting || loginMutation.isPending}
                >
                  {isSubmitting || loginMutation.isPending ? 'Logging in...' : 'Log in'}
                </Button>
              </form>
            </>
          )}
        </div>

      </div>
    </div>
  );
};
