import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useLogin } from '../../hooks/useAuthMutation';
import { api } from '../../lib/api';
import { toast } from 'sonner';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Icons } from '../../components/ui/icons';
import { motion, AnimatePresence } from 'framer-motion';
import { Cpu, Fingerprint, Zap, Loader2, Activity, Database, Globe, ChevronLeft } from 'lucide-react';
import { DeviceLimitModal } from '../../components/auth/DeviceLimitModal';

const loginSchema = z.object({
  email: z.string().min(1, 'Vui lòng nhập email.').email('Email không hợp lệ.'),
  password: z.string().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export const LoginPage = () => {
  const [step, setStep] = useState(1);
  const [emailValue, setEmailValue] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isActivated, setIsActivated] = useState(false);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const loginMutation = useLogin();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Device Limit state
  const [deviceLimitData, setDeviceLimitData] = useState<{
    actionToken: string;
    sessions: any[];
  } | null>(null);

  const from = location.state?.from?.pathname || '/';

  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam === 'Account_Banned') {
      toast.error('Tài khoản đã bị khóa!', { duration: 5000 });
      setErrorMsg('IDENTITY_ACCESS_REVOKED: Account associated with this signal has been restricted.');
    } else if (errorParam) {
      toast.error(`SIGNAL_ERROR: ${errorParam}`);
    }
  }, [searchParams]);

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
            setErrorMsg('LINKED_SIGNAL_DETECTED: This identity is associated with Google OAuth. Use the external link below.');
          } else {
            setEmailValue(email);
            setStep(2);
          }
        } else {
          setErrorMsg('SIGNAL_NOT_FOUND: Provided email does not exist in the primary registry.');
        }
      } catch (error) {
        setErrorMsg('BUFFER_TIMEOUT: Server connection failure during identity verification.');
      } finally {
        setIsCheckingEmail(false);
      }
    }
  };

  const onSubmit = (data: LoginFormValues) => {
    setErrorMsg('');
    loginMutation.mutate(data, {
      onSuccess: () => {
        setIsActivated(true);
        setTimeout(() => navigate(from, { replace: true }), 1500);
      },
      onError: (error: any) => {
        // Xử lý đặc biệt: DEVICE_LIMIT_EXCEEDED — hiện modal chọn thiết bị kick
        if (error.response?.status === 409 && error.response?.data?.code === 'DEVICE_LIMIT_EXCEEDED') {
          const { actionToken, sessions } = error.response.data.data;
          setDeviceLimitData({ actionToken, sessions });
          return;
        }
        setErrorMsg(error.response?.data?.error?.message || 'AUTHENTICATION_FAILED: Key mismatched or signal corrupted.');
      },
    });
  };

  const handleGoogleLogin = () => {
    window.location.href = `${import.meta.env.VITE_API_URL}/auth/google`;
  };

  return (
    <div className="flex min-h-screen w-full bg-black text-white relative overflow-hidden selection:bg-[#1db954] selection:text-black font-sans">
      {/* Device Limit Modal */}
      {deviceLimitData && (
        <DeviceLimitModal
          actionToken={deviceLimitData.actionToken}
          sessions={deviceLimitData.sessions}
          onSuccess={() => {
            setDeviceLimitData(null);
            setIsActivated(true);
            setTimeout(() => navigate(from, { replace: true }), 1500);
          }}
          onCancel={() => setDeviceLimitData(null)}
        />
      )}
      {/* ── Noise Texture Overlay ── */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay z-0 bg-noise" />

      {/* ── Editorial Background Elements ── */}
      <div className="absolute top-0 right-0 p-12 opacity-[0.05] pointer-events-none hidden lg:block">
         <span className="text-[15rem] font-black uppercase tracking-tighter italic leading-none">RB_v4</span>
      </div>
      
      <div className="absolute bottom-0 left-0 p-12 opacity-[0.05] pointer-events-none hidden lg:block">
         <div className="flex flex-col gap-2">
            <span className="text-[1.5rem] font-black uppercase tracking-[0.5em]">ARCHIVE_SYSTEM</span>
            <div className="w-64 h-[2px] bg-white/20" />
            <span className="text-[0.7rem] font-black uppercase tracking-[1em]">IDENTITY_RECORDS</span>
         </div>
      </div>

      {/* ── Main Layout Container ── */}
      <div className="flex-1 flex flex-col lg:flex-row relative z-10 h-full min-h-screen">
        
        {/* Left Side: Branding/Identity Manifest (Desktop only) */}
        <div className="hidden lg:flex flex-1 flex-col justify-between p-16 border-r border-white/5 bg-white/[0.01]">
           <Link to="/" className="flex items-baseline gap-1 group">
              <span className="text-4xl font-black uppercase tracking-tighter text-white">Ring</span>
              <span className="text-4xl font-black uppercase tracking-tighter text-[#1db954]">Beat</span>
              <div className="w-2 h-2 bg-[#1db954] ml-2 animate-pulse" />
           </Link>

           <div className="space-y-12">
              <div className="space-y-4">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-[1px] bg-[#1db954]" />
                    <span className="text-[10px] font-black uppercase tracking-[0.5em] text-[#1db954]">Core_Protocol</span>
                 </div>
                 <h2 className="text-7xl font-black uppercase tracking-tighter leading-none italic">
                   Identity<br />Verification
                 </h2>
              </div>
              
              <div className="flex flex-col gap-6 opacity-30">
                 <TechnicalReadout icon={Cpu} label="System_Core" value="Stable_v4.0.1" />
                 <TechnicalReadout icon={Globe} label="Access_Node" value="External_Auth_v1" />
                 <TechnicalReadout icon={Database} label="Cluster_Link" value="User_Registry_09" />
              </div>
           </div>

           <div className="flex justify-between items-end opacity-20">
              <span className="text-[8px] font-black uppercase tracking-[0.4em]">Auth_Gate_77 // Cluster_Primary</span>
              <div className="flex gap-4">
                 <Zap size={12} />
                 <Activity size={12} />
              </div>
           </div>
        </div>

        {/* Right Side: Auth Form */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-24 relative">
           
           {/* Form Terminal Container */}
           <motion.div 
             initial={{ opacity: 0, x: 20 }}
             animate={{ opacity: 1, x: 0 }}
             className="w-full max-w-[420px] bg-white/[0.02] border border-white/5 p-8 lg:p-12 shadow-[40px_40px_100px_rgba(0,0,0,0.5)] relative"
           >
              {/* Terminal Corner Markers */}
              <div className="absolute -top-[1px] -left-[1px] w-4 h-4 border-t border-l border-[#1db954]" />
              <div className="absolute -bottom-[1px] -right-[1px] w-4 h-4 border-b border-r border-white/20" />

              <div className="mb-12">
                 <div className="flex items-center gap-2 mb-2">
                    <span className="text-[8px] font-black text-[#1db954] uppercase tracking-widest">GATE_01_INPUT</span>
                    <div className="h-[1px] flex-1 bg-[#1db954]/20" />
                 </div>
                 <h1 className="text-4xl font-black uppercase tracking-tighter text-white italic">
                   {step === 1 ? 'Manifest_ID' : 'Key_Entry'}
                 </h1>
              </div>

              {errorMsg && (
                <div className="mb-8 border border-[#e22134]/30 bg-[#e22134]/5 px-4 py-3">
                  <div className="flex items-center gap-3">
                     <div className="w-1.5 h-1.5 bg-[#e22134] animate-pulse" />
                     <span className="text-[10px] font-black uppercase tracking-widest text-[#e22134] leading-relaxed">
                       {errorMsg}
                     </span>
                  </div>
                </div>
              )}

              <AnimatePresence mode="wait">
                {step === 1 ? (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-8"
                  >
                    <div className="space-y-4">
                      <div className="flex justify-between items-end">
                         <Label htmlFor="email" className="text-[9px] font-black uppercase tracking-[0.3em] text-white/40">Registered_Email</Label>
                         <span className="text-[7px] font-black text-[#1db954]/40 uppercase tracking-widest">Awaiting_Input</span>
                      </div>
                      <Input
                        id="email"
                        placeholder="IDENTITY@DOMAIN.COM"
                        className="rounded-none border-x-0 border-t-0 border-b border-white/20 h-14 bg-transparent text-lg font-black tracking-tighter focus-visible:ring-0 focus-visible:border-[#1db954] transition-all hover:border-white placeholder:text-white/10 uppercase"
                        {...register('email')}
                        error={!!errors.email}
                      />
                      {errors.email && <p className="text-[9px] font-black uppercase tracking-widest text-[#e22134] mt-2 italic">_{errors.email.message}</p>}
                    </div>

                    <button
                      type="button"
                      onClick={handleNextStep}
                      disabled={isCheckingEmail}
                      className="w-full bg-[#1db954] text-black h-14 font-black uppercase tracking-[0.3em] text-xs hover:bg-white transition-all shadow-[8px_8px_0px_rgba(29,185,84,0.1)] active:translate-x-1 active:translate-y-1 active:shadow-none flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                      {isCheckingEmail ? (
                        <>
                           <Loader2 className="h-4 w-4 animate-spin" />
                           Verifying...
                        </>
                      ) : 'Proceed_to_Key'}
                    </button>

                    <div className="flex items-center gap-4 my-10">
                      <div className="flex-1 h-[1px] bg-white/5"></div>
                      <span className="text-[8px] font-black text-white/10 uppercase tracking-[0.5em]">External_Links</span>
                      <div className="flex-1 h-[1px] bg-white/5"></div>
                    </div>

                    <button
                      type="button"
                      className="w-full border border-white/10 h-14 font-black uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-4 hover:bg-white hover:text-black transition-all bg-black"
                      onClick={handleGoogleLogin}
                    >
                      <Icons.google className="h-4 w-4" />
                      Continue with Google
                    </button>

                    <div className="mt-12 text-center">
                       <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] mb-4">No Registry Record Found?</p>
                       <Link to="/register" className="text-[11px] font-black text-[#1db954] uppercase tracking-[0.3em] hover:text-white transition-colors border-b-2 border-[#1db954]/20 pb-1">
                         Initialize_New_Account
                       </Link>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-8"
                  >
                    <div className="space-y-2">
                       <button 
                         type="button" 
                         onClick={() => setStep(1)} 
                         className="flex items-center gap-2 text-[9px] font-black text-white/30 hover:text-[#1db954] transition-colors uppercase tracking-[0.2em]"
                       >
                          <ChevronLeft size={12} />
                          Return_to_Step_01
                       </button>
                       <div className="mt-4 p-4 bg-white/[0.03] border border-white/5">
                          <span className="text-[8px] font-black text-white/20 uppercase tracking-[0.3em] block mb-1">Target_Identity</span>
                          <span className="text-sm font-black uppercase tracking-tighter text-white truncate block">{emailValue}</span>
                       </div>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
                      <div className="space-y-4">
                        <div className="flex justify-between items-end">
                           <Label htmlFor="password" className="text-[9px] font-black uppercase tracking-[0.3em] text-white/40">Security_Key</Label>
                           <span className="text-[7px] font-black text-[#1db954]/40 uppercase tracking-widest">Encrypted_Input</span>
                        </div>
                        <Input
                          id="password"
                          type="password"
                          placeholder="••••••••••••"
                          className="rounded-none border-x-0 border-t-0 border-b border-white/20 h-14 bg-transparent text-lg font-black tracking-widest focus-visible:ring-0 focus-visible:border-[#1db954] transition-all hover:border-white placeholder:text-white/10"
                          {...register('password')}
                          error={!!errors.password}
                        />
                        {errors.password && <p className="text-[9px] font-black uppercase tracking-widest text-[#e22134] mt-2 italic">_{errors.password.message}</p>}
                        
                        <div className="pt-2">
                          <Link to="/forgot-password" title="Initialize Recovery Sequence" className="text-[9px] font-black text-white/40 hover:text-white uppercase tracking-widest italic transition-colors">
                            // Reset_Sequence
                          </Link>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmitting || loginMutation.isPending}
                        className="w-full bg-[#1db954] text-black h-14 font-black uppercase tracking-[0.3em] text-xs hover:bg-white transition-all shadow-[8px_8px_0px_rgba(29,185,84,0.1)] active:translate-x-1 active:translate-y-1 active:shadow-none flex items-center justify-center gap-3 disabled:opacity-50"
                      >
                        {isSubmitting || loginMutation.isPending ? (
                          <>
                             <Loader2 className="h-4 w-4 animate-spin" />
                             Processing...
                          </>
                        ) : 'Grant_Access'}
                      </button>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>
           </motion.div>

           {/* Mobile Footer Decor */}
           <div className="mt-12 lg:hidden opacity-20 flex flex-col items-center gap-2">
              <span className="text-[7px] font-black uppercase tracking-[0.5em]">RingBeat Archive System // v4.0.1</span>
              <Fingerprint size={24} />
           </div>
        </div>
      </div>

      {/* ── Activation Overlay ── */}
      <AnimatePresence>
        {isActivated && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black flex items-center justify-center overflow-hidden"
          >
            <div className="absolute inset-0 opacity-[0.2] pointer-events-none bg-noise" />
            
            {/* Background Lightning/Sparks */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              {Array.from({ length: 20 }).map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                  animate={{ 
                    opacity: [0, 1, 0], 
                    scale: [0.5, 2, 0],
                    x: (Math.random() - 0.5) * 800,
                    y: (Math.random() - 0.5) * 400,
                    rotate: Math.random() * 360
                  }}
                  transition={{ 
                    duration: 0.3, 
                    repeat: Infinity, 
                    delay: Math.random() * 0.5,
                    repeatDelay: Math.random() * 0.2
                  }}
                  className="absolute w-[2px] h-[100px] bg-[#1db954] shadow-[0_0_20px_#1db954]"
                />
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ 
                opacity: [0, 1, 0.8, 1, 0],
                scale: [0.8, 1.2, 0.9, 1.1, 1.5],
                x: [0, -5, 5, -2, 2, 0],
                y: [0, 2, -2, 1, -1, 0],
                skewX: [0, 10, -10, 5, -5, 0],
                filter: [
                  "drop-shadow(0 0 0px #1db954)",
                  "drop-shadow(0 0 30px #1db954) blur(2px)",
                  "drop-shadow(0 0 0px #1db954) blur(0px)"
                ]
              }}
              transition={{ 
                duration: 0.8,
                times: [0, 0.2, 0.4, 0.6, 1],
                ease: "easeInOut"
              }}
              className="relative"
            >
               {/* Multiple Layers for Glitch Effect */}
               <h2 className="text-[18vw] font-black italic uppercase tracking-tighter text-[#1db954] leading-none select-none relative z-10">
                 Activated
               </h2>
               <div className="absolute top-0 left-0 w-full h-full text-[18vw] font-black italic uppercase tracking-tighter text-white mix-blend-difference opacity-50 animate-glitch-1">
                 Activated
               </div>
               <div className="absolute top-0 left-0 w-full h-full text-[18vw] font-black italic uppercase tracking-tighter text-cyan-400 mix-blend-screen opacity-30 animate-glitch-2">
                 Activated
               </div>
            </motion.div>

            {/* Horizontal Glitch Strips */}
            {Array.from({ length: 5 }).map((_, i) => (
              <motion.div
                key={i}
                animate={{ 
                  y: ["-100%", "200%"],
                  opacity: [0, 1, 0],
                  scaleY: [1, 5, 1]
                }}
                transition={{ 
                  duration: 0.2, 
                  repeat: Infinity, 
                  delay: i * 0.1,
                  ease: "linear"
                }}
                className="absolute inset-x-0 h-[2px] bg-[#1db954]/20 pointer-events-none z-50"
              />
            ))}
            
            <div className="absolute bottom-12 left-1/2 -translate-x-1/2">
               <motion.span 
                 animate={{ opacity: [0.2, 1, 0.2] }}
                 transition={{ duration: 0.1, repeat: Infinity }}
                 className="text-[10px] font-black uppercase tracking-[1em] text-[#1db954]"
               >
                 SYNC_SUCCESS_01
               </motion.span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const TechnicalReadout = ({ icon: Icon, label, value }: { icon: any; label: string; value: string }) => (
  <div className="flex items-center gap-4">
     <div className="w-8 h-8 flex items-center justify-center border border-white/10 bg-white/[0.02]">
        <Icon size={14} className="text-[#1db954]" />
     </div>
     <div className="flex flex-col">
        <span className="text-[7px] font-black uppercase tracking-[0.4em] text-white/40">{label}</span>
        <span className="text-[11px] font-black uppercase tracking-widest text-white">{value}</span>
     </div>
  </div>
);
