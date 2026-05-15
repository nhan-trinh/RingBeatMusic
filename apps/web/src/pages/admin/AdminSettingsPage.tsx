import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { toast } from 'sonner';
import {
  Settings,
  AlertTriangle,
  Bell,
  Users,
  Save,
  Trash2,
  ShieldCheck,
  RefreshCcw,
  Upload,
  Image as ImageIcon,
  X
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { useHeroConfig } from '../../hooks/useHeroConfig';
import { useQueryClient } from '@tanstack/react-query';

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
  const [savingHero, setSavingHero] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

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

      await api.post('/admin/hero-config', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      toast.success('Đã cập nhật Hero Background');
      queryClient.invalidateQueries({ queryKey: ['hero_config'] });
      setHeroFile(null);
    } catch (error) {
      toast.error('Lỗi khi cập nhật Hero Background');
    } finally {
      setSavingHero(false);
    }
  };

  if (loading) return <div className="p-8 animate-pulse text-[#b3b3b3]">Đang tải cấu hình...</div>;

  return (
    <div className="p-8 max-w-5xl mx-auto pb-24">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight mb-2 flex items-center gap-3">
            <Settings size={32} className="text-[#1DB954]" />
            System Settings
          </h2>
          <p className="text-[#b3b3b3]">Quản trị các thiết lập toàn cục và trạng thái hoạt động của hệ thống.</p>
        </div>
        <Button
          variant="spotify"
          disabled={saving}
          onClick={handleSave}
          className="flex items-center gap-2 shadow-[0_0_20px_rgba(29,185,84,0.2)]"
        >
          {saving ? <RefreshCcw size={18} className="animate-spin" /> : <Save size={18} />}
          Lưu thay đổi
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* General Settings */}
        <section className="bg-[#181818] p-6 rounded-2xl border border-[#282828] space-y-6">
          <div className="flex items-center gap-3 mb-4">
            <ShieldCheck className="text-blue-400" />
            <h3 className="font-bold text-lg">Cấu hình chung</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-[#b3b3b3] uppercase mb-2 block">Tên ứng dụng</label>
              <input
                type="text"
                value={settings.app_name}
                onChange={e => setSettings({ ...settings, app_name: e.target.value })}
                className="w-full bg-[#282828] border border-[#3e3e3e] rounded-lg p-3 focus:border-[#1DB954] outline-none transition-all"
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-[#282828]/30 rounded-xl border border-[#282828]">
              <div>
                <p className="font-bold text-sm">Cho phép đăng ký</p>
                <p className="text-xs text-[#b3b3b3]">Cho phép người dùng mới tạo tài khoản.</p>
              </div>
              <button
                onClick={() => setSettings({ ...settings, allow_registration: !settings.allow_registration })}
                className={`w-12 h-6 rounded-full relative transition-colors ${settings.allow_registration ? 'bg-[#1DB954]' : 'bg-[#3e3e3e]'}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.allow_registration ? 'left-7' : 'left-1'}`} />
              </button>
            </div>
          </div>
        </section>

        {/* Hero Section Config */}
        <section className="bg-[#181818] p-6 rounded-2xl border border-[#282828] space-y-6">
          <div className="flex items-center gap-3 mb-4">
            <ImageIcon className="text-pink-500" />
            <h3 className="font-bold text-lg">Hero Background</h3>
          </div>

          <div className="space-y-4">
            <div className="relative w-full aspect-video bg-[#282828] rounded-xl overflow-hidden border-2 border-dashed border-[#3e3e3e] flex items-center justify-center group">
              {(heroPreview || heroConfig?.backgroundUrl) ? (
                <>
                  {(heroFile ? heroFile.type.startsWith('video/') : heroConfig?.backgroundType === 'video') ? (
                    <video src={heroPreview || heroConfig?.backgroundUrl || ''} className="w-full h-full object-cover opacity-60" autoPlay muted loop />
                  ) : (
                    <img src={heroPreview || heroConfig?.backgroundUrl || ''} className="w-full h-full object-cover opacity-60" alt="Hero" />
                  )}
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <label className="cursor-pointer bg-black/60 p-3 rounded-full hover:bg-[#1db954] hover:text-black transition-colors">
                      <Upload size={24} />
                      <input type="file" className="hidden" accept="video/mp4,video/webm,image/jpeg,image/png,image/webp" onChange={handleHeroFileChange} />
                    </label>
                  </div>
                  {heroFile && (
                    <button
                      onClick={() => { setHeroFile(null); setHeroPreview(null); }}
                      className="absolute top-2 right-2 bg-red-500/80 p-1 rounded-full text-white hover:bg-red-500"
                    >
                      <X size={16} />
                    </button>
                  )}
                </>
              ) : (
                <label className="cursor-pointer flex flex-col items-center justify-center w-full h-full text-[#b3b3b3] hover:text-white transition-colors">
                  <Upload size={32} className="mb-2" />
                  <span className="text-sm font-bold">Tải lên Video hoặc Ảnh</span>
                  <span className="text-xs mt-1 opacity-60">MP4, WEBM, JPG, PNG (Max 100MB)</span>
                  <input type="file" className="hidden" accept="video/mp4,video/webm,image/jpeg,image/png,image/webp" onChange={handleHeroFileChange} />
                </label>
              )}
            </div>

            <div className="flex justify-end">
              <Button
                variant="spotify"
                disabled={savingHero || !heroFile}
                onClick={handleSaveHero}
                className="text-sm py-2 px-4"
              >
                {savingHero ? <RefreshCcw size={16} className="animate-spin mr-2" /> : <Save size={16} className="mr-2" />}
                Upload & Lưu Hero
              </Button>
            </div>
          </div>
        </section>

        {/* Maintenance Mode */}
        <section className="bg-[#181818] p-6 rounded-2xl border border-[#e22134]/30 space-y-6">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="text-[#e22134]" />
            <h3 className="font-bold text-lg">Chế độ Bảo trì</h3>
          </div>

          <div className="flex items-center justify-between p-4 bg-[#e22134]/5 rounded-xl border border-[#e22134]/10 mb-4">
            <div>
              <p className="font-bold text-sm text-[#e22134]">Bật bảo trì toàn hệ thống</p>
              <p className="text-xs text-[#b3b3b3]">Chỉ Admin mới có thể truy cập Web/API.</p>
            </div>
            <button
              onClick={() => setSettings({ ...settings, maintenance_mode: !settings.maintenance_mode })}
              className={`w-12 h-6 rounded-full relative transition-colors ${settings.maintenance_mode ? 'bg-[#e22134]' : 'bg-[#3e3e3e]'}`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.maintenance_mode ? 'left-7' : 'left-1'}`} />
            </button>
          </div>

          <div>
            <label className="text-xs font-bold text-[#b3b3b3] uppercase mb-2 block">Thông báo bảo trì</label>
            <textarea
              value={settings.maintenance_message}
              onChange={e => setSettings({ ...settings, maintenance_message: e.target.value })}
              className="w-full bg-[#282828] border border-[#3e3e3e] rounded-lg p-3 focus:border-[#e22134] outline-none h-24 resize-none"
              placeholder="Nhập lý do hoặc thời gian dự kiến quay lại..."
            />
          </div>
        </section>

        {/* Marketing / Banner */}
        <section className="bg-[#181818] p-6 rounded-2xl border border-[#282828] space-y-6">
          <div className="flex items-center gap-3 mb-4">
            <Bell className="text-yellow-500" />
            <h3 className="font-bold text-lg">Thông báo & Marketing</h3>
          </div>

          <div className="flex items-center justify-between p-4 bg-yellow-500/5 rounded-xl border border-yellow-500/10 mb-4">
            <div>
              <p className="font-bold text-sm">Bật Banner toàn hệ thống</p>
              <p className="text-xs text-[#b3b3b3]">Hiện thông báo quan trọng ở góc trên màn hình.</p>
            </div>
            <button
              onClick={() => setSettings({ ...settings, global_banner_enabled: !settings.global_banner_enabled })}
              className={`w-12 h-6 rounded-full relative transition-colors ${settings.global_banner_enabled ? 'bg-yellow-500 text-black' : 'bg-[#3e3e3e]'}`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.global_banner_enabled ? 'left-7' : 'left-1'}`} />
            </button>
          </div>

          <div>
            <label className="text-xs font-bold text-[#b3b3b3] uppercase mb-2 block">Nội dung Banner</label>
            <input
              type="text"
              value={settings.global_banner_text}
              onChange={e => setSettings({ ...settings, global_banner_text: e.target.value })}
              className="w-full bg-[#282828] border border-[#3e3e3e] rounded-lg p-3 focus:border-yellow-500 outline-none"
              placeholder="Ví dụ: Chào mừng bạn đến với RingBeat!"
            />
          </div>
        </section>

        {/* System Operations */}
        <section className="bg-[#181818] p-6 rounded-2xl border border-[#282828] space-y-6">
          <div className="flex items-center gap-3 mb-4">
            <RefreshCcw className="text-purple-400" />
            <h3 className="font-bold text-lg">Vận hành Hệ thống</h3>
          </div>

          <div className="p-4 bg-purple-500/5 rounded-xl border border-purple-500/10 mb-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-bold text-sm">Redis Cache</p>
                <p className="text-xs text-[#b3b3b3]">Xóa sạch các tệp tạm để ép buộc cập nhật dữ liệu.</p>
              </div>
              <Button
                variant="outline"
                onClick={handleClearCache}
                className="border-purple-500/50 hover:bg-purple-500 hover:text-white"
              >
                <Trash2 size={16} className="mr-2" />
                Clear All Cache
              </Button>
            </div>

            <div className="flex items-center gap-2 p-3 bg-purple-500/10 rounded-lg text-purple-400 text-xs">
              <Users size={14} />
              <span>Số lượng phiên đăng nhập đang lưu trữ: (Tính năng đang chờ)</span>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
};
