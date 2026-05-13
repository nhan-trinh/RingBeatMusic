import { useState } from 'react';
import { Monitor, Smartphone, Tablet, Globe, Zap, AlertTriangle, Loader2, LogOut } from 'lucide-react';
import { api } from '../../lib/api';
import { useAuthStore } from '../../stores/auth.store';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

interface ActiveSession {
  id: string;
  deviceName: string;
  deviceType: 'desktop' | 'mobile' | 'tablet' | 'unknown';
  os: string;
  browser: string;
  ipAddress: string | null;
  lastActiveAt: string;
}

interface DeviceLimitModalProps {
  actionToken: string;
  sessions: ActiveSession[];
  onSuccess: () => void; // callback sau khi đăng nhập thành công
  onCancel: () => void;
}

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

const DeviceIcon = ({ type }: { type: ActiveSession['deviceType'] }) => {
  const cls = 'text-white/40';
  if (type === 'mobile') return <Smartphone size={20} className={cls} />;
  if (type === 'tablet') return <Tablet size={20} className={cls} />;
  return <Monitor size={20} className={cls} />;
};

// ──────────────────────────────────────────────
// Main Component
// ──────────────────────────────────────────────

export const DeviceLimitModal = ({ actionToken, sessions, onSuccess, onCancel }: DeviceLimitModalProps) => {
  const { updateUser } = useAuthStore();
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleResolve = async () => {
    if (!selectedSessionId) {
      toast.error('Vui lòng chọn một thiết bị để đăng xuất.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.post('/auth/resolve-device-limit', {
        actionToken,
        sessionId: selectedSessionId,
      }) as any;

      const { user, accessToken } = res.data;
      // Cập nhật auth store giống flow login bình thường
      useAuthStore.getState().setAuth(accessToken, user);
      updateUser(user);

      toast.success('Đăng nhập thành công!');
      onSuccess();
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Không thể xử lý yêu cầu.';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={onCancel} />

      {/* Noise overlay */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-noise" />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-lg border border-white/10 bg-black p-0 overflow-hidden">
        {/* Corner markers */}
        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-[#f97316] opacity-60 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-[#f97316] opacity-60 pointer-events-none" />

        {/* Header */}
        <div className="px-10 py-8 border-b border-white/10">
          <div className="flex items-center gap-4 mb-3">
            <AlertTriangle size={18} className="text-[#f97316]" />
            <span className="text-[9px] font-black text-[#f97316] uppercase tracking-[0.5em]">
              Device_Limit_Exceeded
            </span>
          </div>
          <h2 className="text-2xl font-black uppercase tracking-tighter italic text-white">
            Giới_Hạn_5_Thiết_Bị
          </h2>
          <p className="text-[10px] text-white/30 font-black uppercase tracking-widest mt-3 leading-relaxed">
            Tài khoản đã đạt giới hạn 5 thiết bị đăng nhập. Chọn 1 thiết bị bên dưới để đăng xuất và tiếp tục.
          </p>
        </div>

        {/* Device List */}
        <div className="p-6 space-y-2 max-h-[320px] overflow-y-auto custom-scrollbar">
          {sessions.map((session) => {
            const isSelected = selectedSessionId === session.id;
            const timeAgo = formatDistanceToNow(new Date(session.lastActiveAt), {
              addSuffix: true,
              locale: vi,
            });

            return (
              <button
                key={session.id}
                onClick={() => setSelectedSessionId(session.id)}
                className={cn(
                  'w-full flex items-center gap-5 p-5 border text-left transition-all duration-200',
                  isSelected
                    ? 'border-[#f97316]/40 bg-[#f97316]/[0.05]'
                    : 'border-white/5 bg-white/[0.01] hover:border-white/20'
                )}
              >
                {/* Selection indicator */}
                <div className={cn(
                  'w-3 h-3 border-2 flex-shrink-0 transition-all',
                  isSelected ? 'border-[#f97316] bg-[#f97316]' : 'border-white/20'
                )} />

                <DeviceIcon type={session.deviceType} />

                <div className="flex-1 min-w-0">
                  <p className={cn(
                    'text-[13px] font-black uppercase tracking-tighter truncate transition-colors',
                    isSelected ? 'text-white' : 'text-white/50'
                  )}>
                    {session.deviceName}
                  </p>
                  <div className="flex items-center gap-4 mt-1">
                    {session.ipAddress && (
                      <div className="flex items-center gap-1.5">
                        <Globe size={9} className="text-white/20" />
                        <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">
                          {session.ipAddress}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5">
                      <Zap size={9} className="text-white/20" />
                      <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">
                        {timeAgo}
                      </span>
                    </div>
                  </div>
                </div>

                {isSelected && <LogOut size={14} className="text-[#f97316] flex-shrink-0" />}
              </button>
            );
          })}
        </div>

        {/* Actions */}
        <div className="px-10 py-8 border-t border-white/10 flex gap-4">
          <button
            onClick={onCancel}
            className="flex-1 py-4 border border-white/10 text-white/40 hover:text-white hover:border-white/30 font-black uppercase tracking-[0.3em] text-[10px] transition-all"
          >
            Hủy
          </button>
          <button
            onClick={handleResolve}
            disabled={!selectedSessionId || isSubmitting}
            className="flex-1 py-4 bg-[#f97316] text-black font-black uppercase tracking-[0.3em] text-[10px] hover:bg-white transition-all disabled:opacity-30 flex items-center justify-center gap-3"
          >
            {isSubmitting ? (
              <><Loader2 size={14} className="animate-spin" /> Đang xử lý...</>
            ) : (
              'Kick_&_Login'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
