import React, { useState } from 'react';
import { X, AlertTriangle, Loader2, Shield } from 'lucide-react';
import { useUIStore } from '../../stores/ui.store';
import { api } from '../../lib/api';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';
import { motion } from 'framer-motion';

const REPORT_REASONS = [
  { value: 'INAPPROPRIATE_CONTENT', label: 'Nội dung không phù hợp', code: 'INAPP_CONT_01' },
  { value: 'COPYRIGHT_VIOLATION', label: 'Vi phạm bản quyền', code: 'COPYR_VIOL_02' },
  { value: 'SPAM', label: 'Spam / Nội dung rác', code: 'SPAM_LOGS_03' },
  { value: 'HATE_SPEECH', label: 'Ngôn từ thù địch', code: 'HATE_SPCH_04' },
  { value: 'FAKE_ACCOUNT', label: 'Tài khoản giả mạo', code: 'FAKE_ACCT_05' },
  { value: 'OTHER', label: 'Lý do khác', code: 'OTHR_NODE_06' },
];

const Crosshair = ({ className }: { className?: string }) => (
  <div className={`absolute w-3 h-3 text-red-500/30 pointer-events-none ${className}`}>
    <div className="absolute top-1/2 left-0 w-full h-[1px] bg-current" />
    <div className="absolute top-0 left-1/2 w-[1px] h-full bg-current" />
  </div>
);

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
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/90 backdrop-blur-md animate-in fade-in duration-200 p-4">
      {/* Grain Overlay */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay z-0 bg-noise" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-[#050505] w-full max-w-lg rounded-none border-2 border-red-500/30 overflow-hidden shadow-[20px_20px_0px_rgba(239,68,68,0.05)] relative z-10 flex flex-col group/modal"
      >
        {/* Corners Decor */}
        <Crosshair className="top-2 left-2" />
        <Crosshair className="top-2 right-2" />
        <Crosshair className="bottom-2 left-2" />
        <Crosshair className="bottom-2 right-2" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b-2 border-red-500/20 bg-red-500/5 select-none">
          <div className="flex items-center gap-3">
            <AlertTriangle size={18} className="text-red-500 animate-pulse" />
            <div className="flex flex-col">
              <h3 className="font-black text-xs text-white uppercase tracking-[0.2em] leading-none">
                [REPORT_TARGET_NODE]
              </h3>
              <span className="text-[7px] font-black text-red-500/50 uppercase tracking-[0.3em] mt-1 leading-none">
                Security_Audit_Incident: v4.2
              </span>
            </div>
          </div>
          <button 
            onClick={closeReportModal} 
            className="text-white/40 hover:text-red-500 border border-white/5 hover:border-red-500 bg-white/[0.01] hover:bg-red-500/10 p-2 transition-all rounded-none"
            title="CLOSE_SIGNAL"
          >
            <X size={14} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-6">
          
          {/* Target Manifest Box */}
          <div className="border border-dashed border-white/10 bg-black p-4 relative overflow-hidden select-none">
            <div className="absolute right-[-10px] top-[-10px] text-white/[0.01] text-6xl font-black font-mono italic">UNIT</div>
            <div className="text-[7px] font-black text-white/30 uppercase tracking-[0.3em] mb-2 leading-none">
              Incident_Target_Manifest
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="text-[8px] font-black text-red-500/60 uppercase tracking-widest leading-none">
                  [CLASS]: {reportTarget.type}
                </span>
                <span className="text-[8px] font-black text-white/20">//</span>
                <span className="text-[8px] font-black text-white/40 uppercase tracking-widest leading-none">
                  [ID]: {reportTarget.id.slice(0, 8)}...
                </span>
              </div>
              <p className="text-sm font-black text-white uppercase tracking-tighter truncate mt-1">
                "{reportTarget.title}"
              </p>
            </div>
          </div>

          {/* Reasons List */}
          <div>
            <div className="flex items-center justify-between mb-3 select-none">
              <label className="text-[8px] font-black text-white/40 uppercase tracking-[0.3em]">
                Select_Violation_Protocol
              </label>
              <div className="flex gap-1.5 items-center opacity-30">
                <Shield size={8} />
                <span className="text-[6px] font-black uppercase tracking-widest">Protocol: 09_R</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {REPORT_REASONS.map((r, i) => {
                if (r.value === 'FAKE_ACCOUNT' && reportTarget.type !== 'USER') return null;
                const isSelected = reason === r.value;
                const indexStr = (i + 1).toString().padStart(2, '0');
                
                return (
                  <label 
                    key={r.value}
                    className={cn(
                      "flex items-center gap-3 p-3 border transition-all cursor-pointer rounded-none relative overflow-hidden select-none",
                      isSelected 
                        ? 'bg-red-500/5 border-red-500 text-white shadow-[3px_3px_10px_rgba(239,68,68,0.1)]' 
                        : 'bg-white/[0.01] border-white/5 text-white/40 hover:border-white/20 hover:text-white/80'
                    )}
                  >
                    <input 
                      type="radio" 
                      name="reason" 
                      value={r.value} 
                      checked={isSelected}
                      onChange={(e) => setReason(e.target.value)}
                      className="hidden"
                    />
                    
                    {/* Mechanical indicator box */}
                    <div className={cn(
                      "w-6 h-6 border flex items-center justify-center font-mono text-[8px] font-black flex-shrink-0 transition-colors",
                      isSelected 
                        ? 'border-red-500 bg-red-500/20 text-red-500' 
                        : 'border-white/10 text-white/20 bg-black'
                    )}>
                      {indexStr}
                    </div>

                    <div className="flex flex-col min-w-0">
                      <span className="text-[9px] font-black uppercase tracking-widest truncate">{r.label}</span>
                      <span className={cn(
                        "text-[5px] font-mono tracking-widest mt-0.5 leading-none transition-colors",
                        isSelected ? "text-red-500/50" : "text-white/10"
                      )}>{r.code}</span>
                    </div>

                    {isSelected && (
                      <div className="absolute right-0 bottom-0 w-1 h-full bg-red-500" />
                    )}
                  </label>
                );
              })}
            </div>
          </div>

          {/* Description Textarea */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between select-none">
              <label className="text-[8px] font-black text-white/40 uppercase tracking-[0.3em]">
                [ADDITIONAL_TELEMETRY_LOGS]
              </label>
              <span className="text-[6px] font-black text-white/25 uppercase tracking-widest">Optional</span>
            </div>
            <textarea
              className="w-full bg-black border border-white/5 focus:border-red-500/40 p-3 text-[10px] font-mono text-white placeholder-white/10 focus:placeholder-white/20 outline-none rounded-none min-h-[90px] resize-none transition-colors focus:shadow-[0_0_15px_rgba(239,68,68,0.05)]"
              placeholder="Cung cấp các thông số, bằng chứng hoặc thông tin chi tiết liên quan đến sự cố..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-2">
            <button
              type="button"
              onClick={closeReportModal}
              className="flex-1 border border-white/5 hover:border-white/20 hover:bg-white/[0.02] py-3.5 text-[9px] font-black uppercase tracking-widest rounded-none transition-all text-white/40 hover:text-white"
            >
              HỦY_BỎ
            </button>
            <button
              type="submit"
              disabled={loading}
              className={cn(
                "flex-1 py-3.5 text-[9px] font-black uppercase tracking-widest rounded-none transition-all flex items-center justify-center gap-2 text-white relative overflow-hidden group/btn disabled:opacity-30",
                loading 
                  ? "bg-red-500/20 border border-red-500/40"
                  : "bg-red-600 hover:bg-white hover:text-black border border-red-600 hover:border-white shadow-[4px_4px_0px_rgba(239,68,68,0.15)] hover:shadow-none"
              )}
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin text-red-500" size={12} />
                  <span>TRANSMITTING...</span>
                </>
              ) : (
                <>
                  <span>GỬI_BÁO_CÁO</span>
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

