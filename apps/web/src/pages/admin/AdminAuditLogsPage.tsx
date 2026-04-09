import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { Shield, Music, Settings, AlertTriangle, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

export const AdminAuditLogsPage = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/admin/audit-logs?page=${page}`);
      setLogs(res.data.logs);
      setTotal(res.data.total);
    } catch (error) {
      toast.error('Lỗi khi tải nhật ký hệ thống');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page]);

  const getActionStyles = (action: string) => {
    switch (action) {
      case 'USER_BANNED': return { bg: 'bg-[#e22134]/10', text: 'text-[#e22134]', icon: AlertTriangle };
      case 'USER_UNBANNED': return { bg: 'bg-[#1DB954]/10', text: 'text-[#1DB954]', icon: Shield };
      case 'SONG_APPROVED': return { bg: 'bg-[#1DB954]/10', text: 'text-[#1DB954]', icon: Music };
      case 'SONG_REJECTED': return { bg: 'bg-[#e22134]/10', text: 'text-[#e22134]', icon: Music };
      case 'ROLE_CHANGED': return { bg: 'bg-blue-500/10', text: 'text-blue-400', icon: Shield };
      default: return { bg: 'bg-[#282828]', text: 'text-[#b3b3b3]', icon: Settings };
    }
  };

  return (
    <div className="p-8 h-full flex flex-col">
      <div className="flex flex-col md:row items-center justify-between gap-4 mb-8">
        <div className="w-full">
          <h2 className="text-3xl font-bold tracking-tight mb-2">Audit Logs</h2>
          <p className="text-[#b3b3b3]">Theo dõi lịch sử toàn bộ các thao tác nhạy cảm trên hệ thống.</p>
        </div>
      </div>

      <div className="flex-1 bg-[#181818] rounded-xl border border-[#282828] overflow-hidden flex flex-col">
        <div className="overflow-auto flex-1 p-6">
          <div className="space-y-4">
            {loading && logs.length === 0 ? (
              [...Array(6)].map((_, i) => (
                <div key={i} className="h-20 bg-[#282828]/30 rounded-lg animate-pulse"></div>
              ))
            ) : logs.length === 0 ? (
              <div className="text-center p-20 text-[#555]">Chưa có ghi chép nào.</div>
            ) : (
              logs.map((log) => {
                const style = getActionStyles(log.action);
                const ActionIcon = style.icon;
                return (
                  <div key={log.id} className="group flex items-start gap-4 p-4 rounded-xl border border-[#282828] hover:bg-[#202020] transition-all relative overflow-hidden">
                    <div className={`p-3 rounded-xl ${style.bg} ${style.text} shrink-0`}>
                      <ActionIcon size={20} />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm">{log.actor?.name || 'System Auto'}</span>
                          <ArrowRight size={14} className="text-[#555]" />
                          <span className={`text-[11px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${style.bg} ${style.text}`}>
                            {log.action.replace('_', ' ')}
                          </span>
                        </div>
                        <span className="text-xs text-[#555] font-mono">{new Date(log.createdAt).toLocaleString('vi-VN')}</span>
                      </div>

                      <div className="text-sm text-[#b3b3b3] flex items-center gap-2">
                        <span>Target: <span className="text-[#888] font-mono">{log.targetType}</span></span>
                        <span className="text-[#555]">•</span>
                        <span>ID: <span className="text-[#888] font-mono">{log.targetId?.split('-')[0]}...</span></span>
                        {log.metadata && (
                          <>
                            <span className="text-[#555]">•</span>
                            <span className="bg-[#282828] px-2 py-0.5 rounded text-[10px] text-white">
                              {JSON.stringify(log.metadata).length > 50 ? 'View Details' : JSON.stringify(log.metadata)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Pagination */}
        <div className="h-14 bg-[#282828]/50 border-t border-[#282828] flex items-center justify-between px-6 shrink-0">
          <span className="text-sm text-[#b3b3b3]">
            Tổng số: <span className="font-bold text-white">{total}</span> logs
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="px-3 py-1 text-sm font-bold bg-[#282828] hover:bg-[#3e3e3e] rounded disabled:opacity-50"
            >
              Prev
            </button>
            <span className="text-sm px-2 font-bold">{page}</span>
            <button
              disabled={logs.length < 50}
              onClick={() => setPage(p => p + 1)}
              className="px-3 py-1 text-sm font-bold bg-[#282828] hover:bg-[#3e3e3e] rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
