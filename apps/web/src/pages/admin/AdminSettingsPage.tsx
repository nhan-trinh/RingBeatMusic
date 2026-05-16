import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { toast } from 'sonner';
import {
  AlertTriangle,
  Bell,
  Users,
  Save,
  Trash2,
  ShieldCheck,
  RefreshCcw,
  Upload,
  Image as ImageIcon,
  X,
  Zap
} from 'lucide-react';
import { useHeroConfig } from '../../hooks/useHeroConfig';
import { useQueryClient } from '@tanstack/react-query';
import { clsx } from 'clsx';

interface SystemSettings {
  maintenance_mode: boolean;
  maintenance_message: string;
  allow_registration: boolean;
  global_banner_text: string;
  global_banner_enabled: boolean;
  app_name: string;
}

export const AdminSettingsPage = () => {
  const [settings, setSettings] = useState<SystemSettings>({
    maintenance_mode: false,
    maintenance_message: 'Hệ thống đang bảo trì. Vui lòng quay lại sau.',
    allow_registration: true,
    global_banner_text: '',
    global_banner_enabled: false,
    app_name: 'RingBeat Music'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const { data: heroConfig } = useHeroConfig();
  const queryClient = useQueryClient();
  const [heroFile, setHeroFile] = useState<File | null>(null);
  const [heroPreview, setHeroPreview] = useState<string | null>(null);
  const [heroText, setHeroText] = useState('');
  const [savingHero, setSavingHero] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    if (heroConfig?.heroText) {
      setHeroText(heroConfig.heroText);
    }
  }, [heroConfig]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/settings');
      // Merge with defaults
      setSettings(prev => ({ ...prev, ...res.data }));
    } catch (error) {
      toast.error('Lỗi khi tải cấu hình hệ thống');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await api.post('/admin/settings', settings);
      toast.success('Đã cập nhật cấu hình hệ thống');
    } catch (error) {
      toast.error('Lỗi khi lưu cấu hình');
    } finally {
      setSaving(false);
    }
  };

  const handleClearCache = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa sạch toàn bộ Redis Cache? Hành động này có thể làm giảm hiệu năng hệ thống trong giây lát.')) return;
    try {
      await api.post('/admin/system/clear-cache');
      toast.success('Đã xóa sạch bộ nhớ đệm thành công');
    } catch (error) {
      toast.error('Lỗi khi xóa cache');
    }
  };

  const handleHeroFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 100 * 1024 * 1024) {
        toast.error('File quá lớn. Vui lòng chọn file dưới 100MB.');
        return;
      }
      setHeroFile(file);
      setHeroPreview(URL.createObjectURL(file));
    }
  };

  const handleSaveHero = async () => {
    try {
      setSavingHero(true);
      const formData = new FormData();
      if (heroFile) {
        formData.append('file', heroFile);
      }
      formData.append('heroText', heroText);

      await api.post('/admin/hero-config', formData);

      toast.success('Đã cập nhật Hero Section');
      queryClient.invalidateQueries({ queryKey: ['hero_config'] });
      setHeroFile(null);
      setHeroPreview(null);
    } catch (error) {
      toast.error('Lỗi khi cập nhật Hero Background');
    } finally {
      setSavingHero(false);
    }
  };

  if (loading) return <div className="p-8 animate-pulse text-zinc-500">Đang tải cấu hình...</div>;

  return (
    <div className="space-y-10 pb-24">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-8">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">System Settings</h2>
          <p className="text-zinc-500 text-sm mt-1">Quản trị các thiết lập toàn cục và trạng thái hệ thống.</p>
        </div>
        <div className="flex items-center gap-3">
           <button
            onClick={fetchSettings}
            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
            title="Làm mới"
          >
            <RefreshCcw size={18} className={loading ? "animate-spin" : ""} />
          </button>
          <button
            disabled={saving}
            onClick={handleSave}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#1db954] hover:bg-[#1ed760] text-black font-bold text-sm rounded-full transition-all shadow-lg shadow-[#1db954]/10 disabled:opacity-50"
          >
            {saving ? <RefreshCcw size={16} className="animate-spin" /> : <Save size={16} />}
            Lưu thay đổi
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          
          <section className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-8 space-y-6">
            <div className="flex items-center gap-3 border-b border-zinc-800 pb-4">
              <ShieldCheck className="text-blue-500" size={20} />
              <h3 className="font-bold text-lg">Cấu hình chung</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Tên ứng dụng</label>
                <input
                  type="text"
                  value={settings.app_name}
                  onChange={e => setSettings({ ...settings, app_name: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 focus:border-[#1db954] outline-none transition-all text-sm"
                  placeholder="Nhập tên ứng dụng..."
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-zinc-950/50 rounded-xl border border-zinc-800">
                <div>
                  <p className="font-bold text-sm">Cho phép đăng ký</p>
                  <p className="text-[11px] text-zinc-500">Mở cổng đăng ký tài khoản mới.</p>
                </div>
                <button
                  onClick={() => setSettings({ ...settings, allow_registration: !settings.allow_registration })}
                  className={clsx(
                    "w-11 h-6 rounded-full relative transition-all duration-300",
                    settings.allow_registration ? "bg-[#1db954]" : "bg-zinc-700"
                  )}
                >
                  <div className={clsx(
                    "absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 shadow-sm",
                    settings.allow_registration ? "left-6" : "left-1"
                  )} />
                </button>
              </div>
            </div>
          </section>

          <section className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-8 space-y-6">
            <div className="flex items-center gap-3 border-b border-zinc-800 pb-4">
              <Bell className="text-yellow-500" size={20} />
              <h3 className="font-bold text-lg">Thông báo & Marketing</h3>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-yellow-500/5 rounded-xl border border-yellow-500/10">
                <div className="flex items-center gap-4">
                   <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center">
                      <Zap size={18} className="text-yellow-500" />
                   </div>
                   <div>
                    <p className="font-bold text-sm">Hiển thị Global Banner</p>
                    <p className="text-[11px] text-zinc-500">Hiện thông báo real-time trên toàn hệ thống.</p>
                   </div>
                </div>
                <button
                  onClick={() => setSettings({ ...settings, global_banner_enabled: !settings.global_banner_enabled })}
                  className={clsx(
                    "w-11 h-6 rounded-full relative transition-all duration-300",
                    settings.global_banner_enabled ? "bg-yellow-500" : "bg-zinc-700"
                  )}
                >
                  <div className={clsx(
                    "absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 shadow-sm",
                    settings.global_banner_enabled ? "left-6" : "left-1"
                  )} />
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Nội dung thông báo</label>
                <textarea
                  value={settings.global_banner_text}
                  onChange={e => setSettings({ ...settings, global_banner_text: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 focus:border-yellow-500 outline-none transition-all text-sm h-24 resize-none"
                  placeholder="Nhập nội dung thông báo..."
                />
              </div>
            </div>
          </section>

          <section className="bg-zinc-900/50 rounded-2xl border border-red-900/20 p-8 space-y-6">
            <div className="flex items-center gap-3 border-b border-zinc-800 pb-4">
              <AlertTriangle className="text-red-500" size={20} />
              <h3 className="font-bold text-lg">Chế độ Bảo trì</h3>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-red-500/5 rounded-xl border border-red-500/10">
                <div>
                  <p className="font-bold text-sm text-red-500">Bật bảo trì toàn hệ thống</p>
                  <p className="text-[11px] text-zinc-500">Người dùng thông thường sẽ không thể truy cập.</p>
                </div>
                <button
                  onClick={() => setSettings({ ...settings, maintenance_mode: !settings.maintenance_mode })}
                  className={clsx(
                    "w-11 h-6 rounded-full relative transition-all duration-300",
                    settings.maintenance_mode ? "bg-red-500" : "bg-zinc-700"
                  )}
                >
                  <div className={clsx(
                    "absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 shadow-sm",
                    settings.maintenance_mode ? "left-6" : "left-1"
                  )} />
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Thông điệp bảo trì</label>
                <input
                  type="text"
                  value={settings.maintenance_message}
                  onChange={e => setSettings({ ...settings, maintenance_message: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 focus:border-red-500 outline-none transition-all text-sm"
                />
              </div>
            </div>
          </section>
        </div>

        <div className="lg:col-span-4 space-y-8">
          
          <section className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-6 space-y-4">
             <div className="flex items-center gap-2 mb-2">
                <ImageIcon className="text-purple-500" size={18} />
                <h3 className="font-bold text-sm">Hero Background</h3>
             </div>

             <div className="relative aspect-video bg-zinc-950 rounded-xl overflow-hidden border border-zinc-800 group">
                {(heroPreview || heroConfig?.backgroundUrl) ? (
                  <>
                    {(heroFile ? heroFile.type.startsWith('video/') : heroConfig?.backgroundType === 'video') ? (
                      <video src={heroPreview || heroConfig?.backgroundUrl || ''} className="w-full h-full object-cover" autoPlay muted loop />
                    ) : (
                      <img src={heroPreview || heroConfig?.backgroundUrl || ''} className="w-full h-full object-cover" alt="Hero" />
                    )}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                       <label className="cursor-pointer bg-white/10 hover:bg-[#1db954] p-3 rounded-full text-white hover:text-black transition-all">
                          <Upload size={20} />
                          <input type="file" className="hidden" accept="video/mp4,video/webm,image/*" onChange={handleHeroFileChange} />
                       </label>
                    </div>
                  </>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer hover:bg-zinc-800/50 transition-colors">
                     <Upload size={24} className="text-zinc-500 mb-2" />
                     <span className="text-xs font-medium text-zinc-400">Tải lên media</span>
                     <input type="file" className="hidden" onChange={handleHeroFileChange} />
                  </label>
                )}
             </div>
             
             {heroFile && (
               <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] text-zinc-500 truncate max-w-[150px]">{heroFile.name}</span>
                  <div className="flex gap-1">
                     <button onClick={() => {setHeroFile(null); setHeroPreview(null);}} className="p-1 text-red-500 hover:bg-red-500/10 rounded"><X size={14} /></button>
                     <button onClick={handleSaveHero} disabled={savingHero} className="p-1 text-[#1db954] hover:bg-[#1db954]/10 rounded">
                        {savingHero ? <RefreshCcw size={14} className="animate-spin" /> : <Save size={14} />}
                     </button>
                  </div>
               </div>
             )}
             
             <p className="text-[10px] text-zinc-500">Tối đa 100MB. Hỗ trợ MP4, WebM, JPG, PNG.</p>

              <div className="pt-4 border-t border-zinc-800 space-y-3">
                 <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Hero Context Text</label>
                    <button 
                      onClick={handleSaveHero} 
                      disabled={savingHero || heroText === heroConfig?.heroText}
                      className="text-[10px] font-bold text-[#1db954] hover:underline disabled:opacity-0 transition-all"
                    >
                      {savingHero ? "Saving..." : "Lưu văn bản"}
                    </button>
                 </div>
                 <textarea
                   value={heroText}
                   onChange={e => setHeroText(e.target.value)}
                   className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 focus:border-[#1db954] outline-none transition-all text-xs h-32 resize-none leading-relaxed"
                   placeholder="Nhập nội dung Hero..."
                 />
              </div>
          </section>

          <section className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-6 space-y-4">
             <div className="flex items-center gap-2 mb-2">
                <RefreshCcw className="text-zinc-400" size={18} />
                <h3 className="font-bold text-sm">Vận hành</h3>
             </div>

             <div className="space-y-3">
                <button 
                  onClick={handleClearCache}
                  className="w-full flex items-center justify-between p-3 bg-zinc-950 hover:bg-zinc-800 rounded-xl border border-zinc-800 transition-colors group"
                >
                   <div className="text-left">
                      <p className="text-xs font-bold">Clear Cache</p>
                      <p className="text-[10px] text-zinc-500">Xóa sạch Redis memory.</p>
                   </div>
                   <Trash2 size={16} className="text-zinc-500 group-hover:text-red-500 transition-colors" />
                </button>

                <div className="p-3 bg-blue-500/5 rounded-xl border border-blue-500/10">
                   <div className="flex items-center gap-2 text-blue-400 mb-1">
                      <Users size={14} />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Active Sessions</span>
                   </div>
                   <p className="text-xs text-zinc-500 italic">Tính năng đang phát triển...</p>
                </div>
             </div>
          </section>

        </div>
      </div>
    </div>
  );
};
