import React, { useState } from 'react';
import { X, AlertTriangle, Loader2 } from 'lucide-react';
import { useUIStore } from '../../stores/ui.store';
import { api } from '../../lib/api';
import { toast } from 'sonner';

const REPORT_REASONS = [
  { value: 'INAPPROPRIATE_CONTENT', label: 'Nội dung không phù hợp' },
  { value: 'COPYRIGHT_VIOLATION', label: 'Vi phạm bản quyền' },
  { value: 'SPAM', label: 'Spam / Nội dung rác' },
  { value: 'HATE_SPEECH', label: 'Ngôn từ thù địch' },
  { value: 'FAKE_ACCOUNT', label: 'Tài khoản giả mạo' },
  { value: 'OTHER', label: 'Lý do khác' },
];

export const ReportModal: React.FC = () => {
  const { reportTarget, closeReportModal } = useUIStore();
  const [reason, setReason] = useState(REPORT_REASONS[0].value);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  if (!reportTarget) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/reports', {
        targetId: reportTarget.id,
        targetType: reportTarget.type,
        reason,
        description: description.trim() || undefined,
      });
      toast.success('Báo cáo của bạn đã được gửi. Cảm ơn bạn!');
      closeReportModal();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể gửi báo cáo. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#282828] w-full max-w-md rounded-xl shadow-2xl border border-[#3e3e3e] overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#3e3e3e]">
          <div className="flex items-center gap-2 text-red-500">
            <AlertTriangle size={20} />
            <h3 className="font-bold text-white">Báo cáo nội dung</h3>
          </div>
          <button onClick={closeReportModal} className="text-[#b3b3b3] hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <p className="text-sm text-[#b3b3b3] mb-4">
              Bạn đang báo cáo {reportTarget.type === 'SONG' ? 'bài hát' : reportTarget.type === 'PLAYLIST' ? 'playlist' : 'người dùng'}:
              <span className="text-white font-bold ml-1">"{reportTarget.title}"</span>
            </p>
            
            <label className="block text-xs font-bold text-[#b3b3b3] uppercase mb-2">Lý do báo cáo</label>
            <div className="space-y-2">
              {REPORT_REASONS.map((r) => {
                // Filter reasons based on target type if needed
                if (r.value === 'FAKE_ACCOUNT' && reportTarget.type !== 'USER') return null;
                
                return (
                  <label 
                    key={r.value}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                      reason === r.value 
                        ? 'bg-[#3e3e3e] border-[#1DB954] text-white' 
                        : 'bg-transparent border-[#3e3e3e] text-[#b3b3b3] hover:border-[#535353]'
                    }`}
                  >
                    <input 
                      type="radio" 
                      name="reason" 
                      value={r.value} 
                      checked={reason === r.value}
                      onChange={(e) => setReason(e.target.value)}
                      className="hidden"
                    />
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      reason === r.value ? 'border-[#1DB954]' : 'border-[#b3b3b3]'
                    }`}>
                      {reason === r.value && <div className="w-2 h-2 rounded-full bg-[#1DB954]" />}
                    </div>
                    <span className="text-sm">{r.label}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#b3b3b3] uppercase mb-2">Thông tin bổ sung (tùy chọn)</label>
            <textarea
              className="w-full bg-[#3e3e3e] border border-transparent focus:border-[#535353] rounded-lg p-3 text-sm text-white outline-none min-h-[100px] resize-none"
              placeholder="Vui lòng cung cấp thêm chi tiết..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={closeReportModal}
              className="flex-1 px-4 py-3 text-white font-bold hover:scale-105 transition-transform"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-white text-black font-bold py-3 rounded-full hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : 'Gửi báo cáo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
