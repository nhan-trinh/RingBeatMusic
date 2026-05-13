import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Monitor, Smartphone, Tablet, Globe, Zap, Shield, LogOut, Loader2 } from 'lucide-react';
import { api } from '../../lib/api';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

interface Session {
  id: string;
  deviceName: string;
  deviceType: 'desktop' | 'mobile' | 'tablet' | 'unknown';
  os: string;
  browser: string;
  ipAddress: string | null;
  lastActiveAt: string;
  createdAt: string;
  isCurrent: boolean;
}

// ──────────────────────────────────────────────
// Sub-components
// ──────────────────────────────────────────────

const DeviceIcon = ({ type, isCurrent }: { type: Session['deviceType']; isCurrent: boolean }) => {
  const cls = cn(
    'transition-colors duration-300',
    isCurrent ? 'text-[#1db954]' : 'text-white/20 group-hover:text-white/60'
  );
  if (type === 'mobile') return <Smartphone size={22} className={cls} />;
  if (type === 'tablet') return <Tablet size={22} className={cls} />;
  return <Monitor size={22} className={cls} />;
};

interface SessionCardProps {
  session: Session;
  onRevoke: (id: string) => void;
  isRevoking: boolean;
}

const SessionCard = ({ session, onRevoke, isRevoking }: SessionCardProps) => {
  const timeAgo = formatDistanceToNow(new Date(session.lastActiveAt), {
    addSuffix: true,
    locale: vi,
  });

  return (
    <div
      className={cn(
        'group relative flex items-center gap-8 p-7 border transition-all duration-300',
        session.isCurrent
          ? 'border-[#1db954]/30 bg-[#1db954]/[0.03]'
          : 'border-white/5 bg-white/[0.01] hover:border-white/20 hover:bg-white/[0.03]'
      )}
    >
      {/* Corner accent for current device */}
      {session.isCurrent && (
        <div className="absolute top-0 left-0 w-6 h-6 border-t border-l border-[#1db954] pointer-events-none" />
      )}

      {/* Device Icon */}
      <div className="flex-shrink-0 w-10 flex items-center justify-center">
        <DeviceIcon type={session.deviceType} isCurrent={session.isCurrent} />
      </div>

      {/* Device Info */}
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-center gap-4 flex-wrap">
          <p className={cn(
            'text-[14px] font-black uppercase tracking-tighter truncate transition-colors',
            session.isCurrent ? 'text-white' : 'text-white/60 group-hover:text-white'
          )}>
            {session.deviceName}
          </p>
          {session.isCurrent && (
            <span className="text-[7px] font-black uppercase tracking-[0.4em] text-[#1db954] border border-[#1db954]/30 px-2 py-0.5 shrink-0">
              This_Device
            </span>
          )}
        </div>

        <div className="flex items-center gap-6 flex-wrap">
          {session.ipAddress && (
            <div className="flex items-center gap-2">
              <Globe size={10} className="text-white/20" />
              <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">
                {session.ipAddress}
              </span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Zap size={10} className="text-white/20" />
            <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">
              {timeAgo}
            </span>
          </div>
        </div>
      </div>

      {/* Revoke Button — ẩn cho thiết bị hiện tại */}
      {!session.isCurrent && (
        <button
          onClick={() => onRevoke(session.id)}
          disabled={isRevoking}
          className="flex-shrink-0 flex items-center gap-3 px-6 py-3 border border-white/10 text-white/30 hover:border-red-500/40 hover:text-red-500 hover:bg-red-500/[0.05] transition-all text-[9px] font-black uppercase tracking-widest disabled:opacity-30"
        >
          {isRevoking ? (
            <Loader2 size={12} className="animate-spin" />
          ) : (
            <LogOut size={12} />
          )}
          Revoke
        </button>
      )}
    </div>
  );
};

// ──────────────────────────────────────────────
// Main Component
// ──────────────────────────────────────────────

export const SessionManager = () => {
  const queryClient = useQueryClient();
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const { data: sessions = [], isLoading } = useQuery<Session[]>({
    queryKey: ['auth-sessions'],
    queryFn: async () => {
      const res = await api.get('/auth/sessions') as any;
      return res.data;
    },
    staleTime: 30 * 1000, // 30 giây — không cần quá fresh
  });

  const revokeMutation = useMutation({
    mutationFn: (sessionId: string) => api.delete(`/auth/sessions/${sessionId}`),
    onMutate: (sessionId) => setRevokingId(sessionId),
    onSuccess: () => {
      toast.success('Thiết bị đã được đăng xuất.');
      queryClient.invalidateQueries({ queryKey: ['auth-sessions'] });
    },
    onError: () => {
      toast.error('Không thể thu hồi phiên đăng nhập.');
    },
    onSettled: () => setRevokingId(null),
  });

  const handleRevoke = (sessionId: string) => {
    revokeMutation.mutate(sessionId);
  };

  // Sắp xếp: current device lên đầu
  const sortedSessions = [...sessions].sort((a, b) => {
    if (a.isCurrent) return -1;
    if (b.isCurrent) return 1;
    return new Date(b.lastActiveAt).getTime() - new Date(a.lastActiveAt).getTime();
  });

  return (
    <div className="border border-white/5 bg-white/[0.01] p-10 relative group">
      {/* Header */}
      <div className="flex items-center gap-4 mb-10">
        <span className="text-[9px] font-black text-[#1db954] px-2 py-0.5 border border-[#1db954]/20">04</span>
        <h2 className="text-2xl font-black uppercase tracking-tighter italic">Session_Control</h2>
        <div className="flex-1 h-[1px] bg-white/5" />
        <div className="flex items-center gap-2 opacity-30">
          <Shield size={14} className="text-[#1db954]" />
          <span className="text-[8px] font-black uppercase tracking-widest">
            {sessions.length}/{5}_Active
          </span>
        </div>
      </div>

      {/* Description */}
      <p className="text-[10px] text-white/30 font-black uppercase tracking-widest leading-relaxed mb-10 max-w-lg">
        Danh sách thiết bị đang truy cập tài khoản. Tối đa 5 phiên đăng nhập đồng thời. Thu hồi quyền truy cập của các thiết bị không nhận ra.
      </p>

      {/* Session List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-white/[0.02] animate-pulse border border-white/5" />
          ))}
        </div>
      ) : sortedSessions.length === 0 ? (
        <div className="py-16 border border-white/5 flex items-center justify-center opacity-20">
          <p className="text-[10px] font-black uppercase tracking-widest italic">No_Active_Sessions</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedSessions.map(session => (
            <SessionCard
              key={session.id}
              session={session}
              onRevoke={handleRevoke}
              isRevoking={revokingId === session.id}
            />
          ))}
        </div>
      )}

      {/* Capacity Indicator */}
      <div className="mt-8 flex items-center gap-4">
        <div className="flex gap-1.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className={cn(
                'w-6 h-1 transition-all duration-500',
                i < sessions.length ? 'bg-[#1db954]' : 'bg-white/5'
              )}
            />
          ))}
        </div>
        <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">
          {sessions.length} / 5 Device_Slots_Used
        </span>
      </div>
    </div>
  );
};
