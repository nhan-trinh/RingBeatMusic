import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useRegister } from '../../hooks/useAuthMutation';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Icons } from '../../components/ui/icons';

const passwordRegex = /^(?=.*[A-Za-z])(?=.*[\d#?!&@$%\^&\*]).{10,}$/;

const step1Schema = z.object({ email: z.string().min(1, 'Vui lòng nhập email').email('Email không hợp lệ') });
const step2Schema = z.object({ password: z.string().min(10, 'Mật khẩu từ 10 kí tự').regex(passwordRegex, 'Thêm 1 chữ số hoặc kí tự đặc biệt') });
const step3Schema = z.object({
  name: z.string().min(1, 'Nhập tên cho hồ sơ'),
  dateOfBirth: z.string().min(1, 'Vui lòng chọn ngày sinh hợp lệ'),
  gender: z.enum(['man', 'woman', 'non-binary', 'prefer-not-to-say'], { required_error: 'Vui lòng chọn giới tính' }),
});

export const RegisterPage = () => {
  const [step, setStep] = useState(1);
  const registerMutation = useRegister();
  const navigate = useNavigate();

  // Lưu state tổng 3 bước
  const [formData, setFormData] = useState<any>({});
  const [serverMsg, setServerMsg] = useState<{ type: 'error' | 'success', text: string } | null>(null);

  const formStep1 = useForm({ resolver: zodResolver(step1Schema) });
  const formStep2 = useForm({ resolver: zodResolver(step2Schema) });
  const formStep3 = useForm({ resolver: zodResolver(step3Schema) });

  const handleNext1 = (data: any) => { setFormData({ ...formData, ...data }); setStep(2); };
  const handleNext2 = (data: any) => { setFormData({ ...formData, ...data }); setStep(3); };
  const handleFinalSubmit = (data: any) => {
    const finalData = { ...formData, ...data };
    registerMutation.mutate(finalData, {
      onSuccess: (res) => {
        setServerMsg({ type: 'success', text: res.data?.message || 'Đăng ký thành công! Đang chuyển trang.' });
        setTimeout(() => navigate('/verify-email', { state: { email: finalData.email } }), 2000);
      },
      onError: (error: any) => {
        setServerMsg({ type: 'error', text: error.response?.data?.error?.message || 'Đăng ký lỗi. Email có thể đã tồn tại.' });
      },
    });
  };

  const handleGoogleRegister = () => {
    window.location.href = `${import.meta.env.VITE_API_URL}/auth/google`;
  };

  return (
    <div className="flex min-h-screen w-full justify-center p-8 bg-[#121212] lg:bg-gradient-to-b lg:from-[#2a2a2a] lg:to-[#000000]">
      <div className="w-full max-w-[400px] pt-4 lg:pt-10 flex flex-col">
        {/* Header Spotify Logo */}
        <header className="mb-10 w-full flex justify-center">
          <Link to="/">
            <Icons.logo className="" />
          </Link>
        </header>

        {serverMsg && (
          <div className={`mb-6 rounded-sm p-4 text-sm font-semibold flex items-center justify-center gap-2 ${serverMsg.type === 'error' ? 'bg-[#e22134] text-white' : 'bg-[#1ed760] text-black'}`}>
            {serverMsg.text}
          </div>
        )}

        {/* --- STEP 1: XÁC THỰC EMAIL --- */}
        {step === 1 && (
          <div className="w-full px-8 sm:px-0">
            <h1 className="text-[40px] md:text-5xl font-bold tracking-tighter text-white text-center mb-10 leading-tight">
              Sign up to start listening
            </h1>

            <form onSubmit={formStep1.handleSubmit(handleNext1)} className="mx-auto w-full max-w-[324px] space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-bold text-white">Email address</Label>
                <Input
                  id="email"
                  placeholder="name@domain.com"
                  className="rounded-[4px] border border-[#727272] h-12 bg-[#121212] hover:border-white focus-visible:ring-2 focus-visible:ring-white"
                  {...formStep1.register('email')}
                  error={!!formStep1.formState.errors.email}
                />
                {formStep1.formState.errors.email && <p className="text-sm text-[#e22134] flex items-center gap-1.5 pt-1"><span className="text-xl leading-none">⚠️</span>{formStep1.formState.errors.email.message as string}</p>}
                <Link to="#" className="text-[#1ed760] font-bold text-sm underline pb-2 block"></Link>
              </div>

              <Button type="submit" variant="spotify" size="lg" className="w-full mt-4 h-12 rounded-full font-bold">Next</Button>
            </form>

            <div className="mx-auto w-full max-w-[324px] flex items-center gap-4 my-8">
              <div className="flex-1 h-[1px] bg-[#292929]"></div>
              <span className="text-sm font-bold text-[#a7a7a7]">or</span>
              <div className="flex-1 h-[1px] bg-[#292929]"></div>
            </div>

            <div className="mx-auto w-full max-w-[324px]">
              <Button onClick={handleGoogleRegister} variant="outline" className="w-full h-12 rounded-full border-[#878787] text-white hover:border-white bg-transparent justify-center gap-3 font-bold">
                <Icons.google className="h-5 w-5 mr-1" /> Sign up with Google
              </Button>

              <div className="mt-8 mb-8 text-center text-[#a7a7a7] text-sm font-medium">
                Already have an account?{' '}
                <div className="mt-2 text-base">
                  <Link to="/login" className="text-white hover:text-[#1ed760] underline underline-offset-1 font-bold">Log in</Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- STEP 2: TẠO MẬT KHẨU --- */}
        {step === 2 && (
          <div className="w-full px-8 sm:px-0 mx-auto max-w-[324px]">
            {/* Thanh trượt trạng thái form (Mô phỏng Spotify) */}
            <div className="flex flex-col mb-4">
              <div className="w-full h-[3px] bg-[#727272] rounded-full mb-6">
                <div className="h-full bg-[#1ed760] rounded-full" style={{ width: '33%' }}></div>
              </div>
              <div className="flex items-center text-[#a7a7a7]">
                <button type="button" onClick={() => setStep(1)} className="hover:text-white mr-4">
                  <svg role="img" height="24" width="24" viewBox="0 0 24 24" fill="currentColor"><path d="M15.957 2.793a1 1 0 0 1 0 1.414L8.164 12l7.793 7.793a1 1 0 1 1-1.414 1.414L5.336 12l9.207-9.207a1 1 0 0 1 1.414 0z"></path></svg>
                </button>
                <div className="text-[15px] font-medium text-[#a7a7a7]">
                  <div className="text-sm font-normal">Step 1 of 3</div>
                  <div className="font-bold text-white">Create a password</div>
                </div>
              </div>
            </div>

            <form onSubmit={formStep2.handleSubmit(handleNext2)} className="space-y-4 mt-8">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-bold text-white">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type="password"
                    className="rounded-[4px] border border-[#727272] h-12 bg-[#121212] pr-10 focus-visible:ring-2 focus-visible:ring-white"
                    {...formStep2.register('password')}
                    error={!!formStep2.formState.errors.password}
                  />
                  {/* Password helper text could go here */}
                </div>

                <div className="mt-2 text-sm text-white">
                  <p className="font-bold mb-1">Your password must contain at least</p>
                  <ul className="text-sm space-y-1 mt-1">
                    <li className="flex items-center gap-2"><span className="text-[#1ed760]">✓</span> 1 letter</li>
                    <li className="flex items-center gap-2"><span className="text-[#1ed760]">✓</span> 1 number or special character</li>
                    <li className="flex items-center gap-2"><span className="text-[#1ed760]">✓</span> 10 characters</li>
                  </ul>
                </div>
                {formStep2.formState.errors.password && <p className="text-sm text-[#e22134] pt-2">{formStep2.formState.errors.password.message as string}</p>}
              </div>

              <Button type="submit" variant="spotify" size="lg" className="w-full mt-10 h-12 rounded-full font-bold">Next</Button>
            </form>
          </div>
        )}

        {/* --- STEP 3: VỀ BẠN --- */}
        {step === 3 && (
          <div className="w-full px-8 sm:px-0 mx-auto max-w-[324px]">
            <div className="flex flex-col mb-4">
              <div className="w-full h-[3px] bg-[#727272] rounded-full mb-6">
                <div className="h-full bg-[#1ed760] rounded-full" style={{ width: '66%' }}></div>
              </div>
              <div className="flex items-center text-[#a7a7a7]">
                <button type="button" onClick={() => setStep(2)} className="hover:text-white mr-4">
                  <svg role="img" height="24" width="24" viewBox="0 0 24 24" fill="currentColor"><path d="M15.957 2.793a1 1 0 0 1 0 1.414L8.164 12l7.793 7.793a1 1 0 1 1-1.414 1.414L5.336 12l9.207-9.207a1 1 0 0 1 1.414 0z"></path></svg>
                </button>
                <div className="text-[15px] font-medium text-[#a7a7a7]">
                  <div className="text-sm font-normal">Step 2 of 3</div>
                  <div className="font-bold text-white">Tell us about yourself</div>
                </div>
              </div>
            </div>

            <form onSubmit={formStep3.handleSubmit(handleFinalSubmit)} className="space-y-6 mt-8 pb-10">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-bold text-white">Name</Label>
                <p className="text-xs text-[#a7a7a7]">This name will appear on your profile</p>
                <Input
                  id="name"
                  className="rounded-[4px] border border-[#727272] h-12 bg-[#121212] focus-visible:ring-2 focus-visible:ring-white"
                  {...formStep3.register('name')}
                  error={!!formStep3.formState.errors.name}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dateOfBirth" className="text-sm font-bold text-white">Date of birth</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  className="rounded-[4px] border border-[#727272] h-12 text-[#a7a7a7] bg-[#121212] focus-visible:ring-2 focus-visible:ring-white"
                  {...formStep3.register('dateOfBirth')}
                  error={!!formStep3.formState.errors.dateOfBirth}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-bold text-white">Gender</Label>
                <p className="text-xs text-[#a7a7a7]">We use your gender to help personalize our content recommendations.</p>
                <div className="flex flex-wrap gap-x-6 gap-y-4 pt-2">
                  <label className="flex items-center gap-3 cursor-pointer text-sm text-white">
                    <input type="radio" value="man" {...formStep3.register('gender')} className="accent-[#1DB954] w-4 h-4" /> Man
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer text-sm text-white">
                    <input type="radio" value="woman" {...formStep3.register('gender')} className="accent-[#1DB954] w-4 h-4" /> Woman
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer text-sm text-white">
                    <input type="radio" value="non-binary" {...formStep3.register('gender')} className="accent-[#1DB954] w-4 h-4" /> Non-binary
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer text-sm text-white">
                    <input type="radio" value="prefer-not-to-say" {...formStep3.register('gender')} className="accent-[#1DB954] w-4 h-4" /> Prefer not to say
                  </label>
                </div>
              </div>

              <Button
                type="submit"
                variant="spotify"
                size="lg"
                className="w-full h-12 rounded-full mt-6 font-bold"
                disabled={registerMutation.isPending}
              >
                {registerMutation.isPending ? 'Signing up...' : 'Sign up'}
              </Button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
