import { useState, useEffect } from 'react';
import { useAuthStore } from '../../stores/auth.store';
import { api } from '../../lib/api';
import { User as UserIcon, Key, Camera, Save } from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '../../components/ui/Skeleton';

export const AccountSettingsPage = () => {
  const { user, updateUser } = useAuthStore();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Profile Form
  const [name, setName] = useState('');
  const [gender, setGender] = useState('');

  // Password Form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setGender((user as any).gender || '');
      // Giả lập load data mượt mà
      setTimeout(() => setLoading(false), 500);
    }
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.patch('/users/profile', { name, gender }) as any;
      
      // Đồng bộ ngay lập tức lên Store (và Topbar)
      updateUser({ name: res.data.name, gender: res.data.gender });
      
      toast.success('Cập nhật hồ sơ thành công');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Cập nhật thất bại');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp');
      return;
    }
    setSaving(true);
    try {
      await api.patch('/users/password', { currentPassword, newPassword });
      toast.success('Đổi mật khẩu thành công');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Đổi mật khẩu thất bại');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('avatar', file);

    setUploading(true);
    try {
      const res = await api.post('/users/avatar', formData) as any;
      
      // Quan trọng: Cập nhật Store ngay lập tức để Topbar đổi avatar
      updateUser({ avatarUrl: res.data.avatarUrl });
      
      toast.success('Đã cập nhật ảnh đại diện! ✨');
    } catch (error: any) {
      toast.error('Upload ảnh thất bại');
    } finally {
      setUploading(false);
    }
  };


  if (loading) return <SettingsSkeleton />;

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#121212] p-8">
      <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in duration-500">
        <header>
          <h1 className="text-3xl font-bold text-white mb-2">Cài đặt tài khoản</h1>
          <p className="text-[#B3B3B3]">Quản lý thông tin cá nhân và bảo mật của sếp tại đây.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Avatar Section */}
          <div className="lg:col-span-1">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <UserIcon size={20} className="text-[#1DB954]" /> Ảnh đại diện
            </h2>
            <div className="flex flex-col items-center p-6 bg-[#181818] rounded-xl border border-white/5 shadow-xl">
              <div className="relative group w-32 h-32 mb-4">
                <div className="w-full h-full rounded-full overflow-hidden bg-[#282828] border-4 border-[#282828] group-hover:border-[#1DB954] transition-all duration-300">
                  {user?.avatarUrl ? (
                    <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <UserIcon size={48} className="w-full h-full p-8 text-[#B3B3B3]" />
                  )}
                </div>
                <label className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                  <Camera size={24} className="text-white" />
                  <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} disabled={uploading} />
                </label>
                {uploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full">
                    <div className="w-6 h-6 border-2 border-[#1DB954] border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>
              <p className="text-sm font-bold text-white truncate max-w-full">{user?.name}</p>
              <p className="text-[10px] text-[#B3B3B3] mt-1 uppercase tracking-[0.2em] font-bold">{user?.role}</p>
            </div>
          </div>

          {/* Form Section */}
          <div className="lg:col-span-2 space-y-8">
            <form onSubmit={handleUpdateProfile} className="bg-[#181818] p-6 rounded-xl border border-white/5 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#B3B3B3] uppercase tracking-wider">Tên hiển thị</label>
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-[#3E3E3E] border-none rounded-md px-4 py-2.5 text-white text-sm focus:ring-2 focus:ring-[#1DB954] transition-all"
                    placeholder="Nhập tên sếp..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#B3B3B3] uppercase tracking-wider">Giới tính</label>
                  <select 
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full bg-[#3E3E3E] border-none rounded-md px-4 py-2.5 text-white text-sm focus:ring-2 focus:ring-[#1DB954] transition-all"
                  >
                    <option value="">Chọn giới tính</option>
                    <option value="man">Nam</option>
                    <option value="woman">Nữ</option>
                    <option value="non-binary">Khác</option>
                    <option value="prefer_not_to_say">Hông muốn trả lời</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end">
                <button 
                  type="submit"
                  disabled={saving}
                  className="bg-white text-black font-bold px-8 py-2.5 rounded-full text-sm hover:scale-105 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {saving ? 'Đang lưu...' : <><Save size={16} /> Lưu hồ sơ</>}
                </button>
              </div>
            </form>

            {!user?.googleId && (
              <form onSubmit={handleChangePassword} className="bg-[#181818] p-6 rounded-xl border border-white/5 space-y-6">
                <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2">
                  <Key size={16} className="text-[#1DB954]" /> Thay đổi bảo mật
                </h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[#B3B3B3] uppercase tracking-tighter">Mật khẩu hiện tại</label>
                    <input 
                      type="password" 
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full bg-[#3E3E3E] border-none rounded-md px-4 py-2 text-white text-sm focus:ring-2 focus:ring-[#1DB954]"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-[#B3B3B3] uppercase tracking-tighter">Mật khẩu mới</label>
                      <input 
                        type="password" 
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full bg-[#3E3E3E] border-none rounded-md px-4 py-2 text-white text-sm focus:ring-2 focus:ring-[#1DB954]"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-[#B3B3B3] uppercase tracking-tighter">Xác nhận mật khẩu</label>
                      <input 
                        type="password" 
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full bg-[#3E3E3E] border-none rounded-md px-4 py-2 text-white text-sm focus:ring-2 focus:ring-[#1DB954]"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end">
                  <button 
                    type="submit"
                    disabled={saving}
                    className="bg-transparent border border-[#727272] text-white font-bold px-8 py-2.5 rounded-full text-sm hover:border-white hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                  >
                    Đổi mật khẩu
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

const SettingsSkeleton = () => (
    <div className="flex-1 p-8 bg-[#121212]">
        <div className="max-w-4xl mx-auto space-y-12">
            <div className="space-y-3">
                <Skeleton className="h-10 w-64" />
                <Skeleton className="h-4 w-96" />
            </div>
            <div className="grid grid-cols-3 gap-8">
                <div className="col-span-1 space-y-4">
                    <Skeleton className="h-6 w-32" />
                    <div className="bg-[#181818] p-6 rounded-xl border border-white/5 flex flex-col items-center">
                        <Skeleton className="w-32 h-32 rounded-full mb-4" />
                        <Skeleton className="h-4 w-32 mb-2" />
                        <Skeleton className="h-3 w-16" />
                    </div>
                </div>
                <div className="col-span-2 space-y-8">
                    <div className="bg-[#181818] p-6 rounded-xl border border-white/5 space-y-6">
                        <div className="grid grid-cols-2 gap-6">
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                        </div>
                        <div className="flex justify-end"><Skeleton className="h-10 w-32 rounded-full" /></div>
                    </div>
                    <div className="bg-[#181818] p-6 rounded-xl border border-white/5 space-y-6">
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <div className="flex justify-end"><Skeleton className="h-10 w-32 rounded-full" /></div>
                    </div>
                </div>
            </div>
        </div>
    </div>
);
