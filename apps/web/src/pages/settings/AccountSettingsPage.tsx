import { useState, useEffect } from 'react';
import { useAuthStore } from '../../stores/auth.store';
import { api } from '../../lib/api';
import { User as UserIcon, Camera, Cpu, Shield, Zap, Globe, AlertTriangle, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Modal } from '../../components/ui/modal';
import { SessionManager } from '../../components/settings/SessionManager';

export const AccountSettingsPage = () => {
  const { user, updateUser } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();

  // Danger Zone
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteStep, setDeleteStep] = useState<1 | 2>(1);
  const [deleteOtp, setDeleteOtp] = useState('');

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
      setTimeout(() => setLoading(false), 500);
    }
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.patch('/users/profile', { name, gender }) as any;
      updateUser({ name: res.data.name, gender: res.data.gender });
      toast.success('Hồ sơ đã được đồng bộ hóa.');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Lỗi đồng bộ.');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('Xác thực mật khẩu không khớp.');
      return;
    }
    setSaving(true);
    try {
      await api.patch('/users/password', { currentPassword, newPassword });
      toast.success('Mật khẩu đã được ghi đè.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Lỗi ghi đè.');
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
      updateUser({ avatarUrl: res.data.avatarUrl });
      toast.success('Dữ liệu hình ảnh đã được cập nhật.');
    } catch (error: any) {
      toast.error('Lỗi truyền tải hình ảnh.');
    } finally {
      setUploading(false);
    }
  };

  const handleRequestDelete = async () => {
    setSaving(true);
    try {
      await api.post('/auth/account/delete-request');
      setDeleteStep(2);
      toast.success('Mã xác nhận đã được gửi đến email của bạn.');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể yêu cầu mã xác nhận.');
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (deleteOtp.length !== 6) {
      toast.error('Vui lòng nhập đúng 6 chữ số OTP.');
      return
    }

    setSaving(true);
    try {
      await api.delete('/auth/account/delete-confirm', { data: { code: deleteOtp } });

      // ✅ Đúng thứ tự: đóng modal → navigate trước → logout sau
      setDeleteModalOpen(false);
      navigate('/login', { replace: true }); // replace: true để không back lại được

      // Delay nhẹ để navigate xong rồi mới clear state
      setTimeout(() => {
        useAuthStore.getState().logout();
        toast.success('Tài khoản đã được xóa vĩnh viễn.');
      }, 100);

    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Mã xác nhận không hợp lệ.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <SettingsSkeleton />;

  return (
    <div className="flex-1 w-full min-h-full bg-black overflow-y-auto no-scrollbar relative isolate selection:bg-[#1db954] selection:text-black text-white">
      {/* Grain Overlay */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay z-50 bg-noise" />

      {/* Giant Background Watermark */}
      <div className="fixed -right-20 top-1/2 -translate-y-1/2 select-none pointer-events-none origin-center rotate-90 z-0 opacity-10">
        <span className="text-[180px] font-black text-white/[0.01] tracking-tighter uppercase leading-none">PREFERENCES</span>
      </div>

      <div className="px-6 lg:px-12 pt-16 pb-32 relative z-10 w-full max-w-screen-2xl mx-auto">

        {/* ── HEADER MANIFEST ── */}
        <header className="mb-20 border-b border-white/10 pb-12 flex flex-col md:flex-row justify-between items-end gap-12">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-[1px] bg-[#1db954]" />
              <span className="text-[9px] font-black uppercase tracking-[0.5em] text-[#1db954]">System_Identity_v4.2</span>
            </div>
            <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tighter leading-[0.8] italic">
              Account_Manifest
            </h1>
          </div>

          <div className="flex gap-12 opacity-40">
            <TechnicalReadout icon={Cpu} label="System_Core" value="NEURAL_LINK" />
            <TechnicalReadout icon={Shield} label="Security" value="ENCRYPTED" />
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">

          {/* ── SIDEBAR: IDENTITY ── */}
          <aside className="lg:col-span-4 space-y-8 sticky top-24">
            <div className="border border-white/10 bg-white/[0.02] p-8 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-16 h-16 border-t border-r border-[#1db954]/20 pointer-events-none" />
              
              <div className="relative mb-8">
                <div className="aspect-square bg-black border border-white/5 relative overflow-hidden group-hover:border-[#1db954]/40 transition-colors duration-700">
                  {user?.avatarUrl ? (
                    <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 scale-105 group-hover:scale-100" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center opacity-5">
                      <UserIcon size={80} strokeWidth={1} />
                    </div>
                  )}

                  <label className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 opacity-0 group-hover:opacity-100 cursor-pointer transition-all z-20">
                    <Camera size={24} className="text-[#1db954] mb-2" />
                    <span className="text-[8px] font-black uppercase tracking-[0.3em]">Update_Stream</span>
                    <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} disabled={uploading} />
                  </label>

                  {uploading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/90 z-30">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-12 h-[1px] bg-[#1db954] animate-pulse" />
                        <span className="text-[7px] font-black text-[#1db954] animate-pulse uppercase tracking-[0.5em]">Transmitting...</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <p className="text-3xl font-black uppercase tracking-tighter italic leading-none">{user?.name}</p>
                  <p className="text-[9px] text-[#1db954] font-black uppercase tracking-widest mt-2">Unit_ID: {user?.id.slice(0, 16)}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-6 border-t border-white/5">
                  <div className="space-y-1">
                    <span className="text-[7px] text-white/20 font-black uppercase tracking-widest">Auth_Role</span>
                    <p className="text-[10px] text-white/60 font-black uppercase italic">{user?.role?.toUpperCase()}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[7px] text-white/20 font-black uppercase tracking-widest">Account_Status</span>
                    <p className="text-[10px] text-[#1db954] font-black uppercase italic">Active_Link</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border border-white/5 bg-white/[0.01] space-y-4">
              <div className="flex justify-between items-center opacity-30">
                <span className="text-[8px] font-black uppercase tracking-[0.3em]">Network_Sync</span>
                <div className="flex gap-1">
                  <div className="w-1 h-1 bg-[#1db954]" />
                  <div className="w-1 h-1 bg-[#1db954]" />
                  <div className="w-1 h-1 bg-[#1db954]/20" />
                </div>
              </div>
              <div className="flex justify-between items-center opacity-30">
                <span className="text-[8px] font-black uppercase tracking-[0.3em]">Access_Level</span>
                <span className="text-[8px] font-black uppercase text-[#1db954]">VERIFIED</span>
              </div>
            </div>
          </aside>

          {/* ── MAIN CONFIGURATION ── */}
          <main className="lg:col-span-8 space-y-12">
            
            {/* Module 01: Profile */}
            <div className="border border-white/5 bg-white/[0.01] p-10 relative group">
              <div className="flex items-center gap-4 mb-10">
                <span className="text-[9px] font-black text-[#1db954] px-2 py-0.5 border border-[#1db954]/20">01</span>
                <h2 className="text-2xl font-black uppercase tracking-tighter italic">Metadata_Sync</h2>
                <div className="flex-1 h-[1px] bg-white/5" />
              </div>

              <form onSubmit={handleUpdateProfile} className="space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-3">
                    <label className="text-[9px] font-black text-white/30 uppercase tracking-[0.4em]">Alias_Identifier</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-black border border-white/10 px-6 py-4 text-white text-sm focus:border-[#1db954] outline-none transition-all font-black uppercase tracking-widest placeholder:text-white/5"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[9px] font-black text-white/30 uppercase tracking-[0.4em]">Gender_Model</label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full bg-black border border-white/10 px-6 py-4 text-white text-sm focus:border-[#1db954] outline-none transition-all font-black uppercase tracking-widest appearance-none"
                    >
                      <option value="" className="bg-black">SELECT_MODEL</option>
                      <option value="man" className="bg-black">XY_UNIT</option>
                      <option value="woman" className="bg-black">XX_UNIT</option>
                      <option value="non-binary" className="bg-black">NEUTRAL</option>
                      <option value="prefer_not_to_say" className="bg-black">UNDISCLOSED</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end pt-6">
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-10 py-4 bg-[#1db954] text-black font-black uppercase tracking-[0.3em] text-[10px] hover:bg-white transition-all disabled:opacity-30 relative group/btn"
                  >
                    {saving ? 'Synchronizing...' : 'Commit_Profile'}
                    <div className="absolute inset-0 border border-black/10 scale-90 opacity-0 group-hover/btn:opacity-100 group-hover/btn:scale-100 transition-all" />
                  </button>
                </div>
              </form>
            </div>

            {/* Module 02: Security */}
            {!user?.googleId && (
              <div className="border border-white/5 bg-white/[0.01] p-10 relative group">
                <div className="flex items-center gap-4 mb-10">
                  <span className="text-[9px] font-black text-[#1db954] px-2 py-0.5 border border-[#1db954]/20">02</span>
                  <h2 className="text-2xl font-black uppercase tracking-tighter italic">Key_Overwrite</h2>
                  <div className="flex-1 h-[1px] bg-white/5" />
                </div>

                <form onSubmit={handleChangePassword} className="space-y-10">
                  <div className="max-w-md space-y-3">
                    <label className="text-[9px] font-black text-white/30 uppercase tracking-[0.4em]">Master_Credential</label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full bg-black border border-white/10 px-6 py-4 text-white text-sm focus:border-[#1db954] outline-none transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-10 border-t border-white/5">
                    <div className="space-y-3">
                      <label className="text-[9px] font-black text-white/30 uppercase tracking-[0.4em]">New_Access_Key</label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full bg-black border border-white/10 px-6 py-4 text-white text-sm focus:border-[#1db954] outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[9px] font-black text-white/30 uppercase tracking-[0.4em]">Verify_Sequence</label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full bg-black border border-white/10 px-6 py-4 text-white text-sm focus:border-[#1db954] outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-6">
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-10 py-4 border border-white/20 text-white font-black uppercase tracking-[0.3em] text-[10px] hover:border-white hover:bg-white hover:text-black transition-all disabled:opacity-30"
                    >
                      Update_Protocol
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Module 03: Danger Zone */}
            <div className="border border-red-500/10 bg-red-500/[0.01] p-10 relative group">
              <div className="flex items-center gap-4 mb-10">
                <span className="text-[9px] font-black text-red-500 px-2 py-0.5 border border-red-500/20">03</span>
                <h2 className="text-2xl font-black uppercase tracking-tighter italic text-red-500">Danger_Zone</h2>
                <div className="flex-1 h-[1px] bg-red-500/10" />
              </div>
              
              <div className="flex flex-col md:flex-row gap-8 items-center justify-between">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-widest text-red-500">Terminate_Entity_Link</h3>
                  <p className="text-[10px] text-white/40 uppercase tracking-widest mt-2 max-w-sm leading-relaxed">Vĩnh viễn ngắt kết nối thực thể khỏi mạng RingBeat. Toàn bộ metadata và quyền truy cập sẽ bị thanh trừng.</p>
                </div>
                <button
                  onClick={() => { setDeleteModalOpen(true); setDeleteStep(1); setDeleteOtp(''); }}
                  className="px-8 py-4 border border-red-500/30 text-red-500 hover:bg-red-500 hover:text-black font-black uppercase tracking-[0.3em] text-[10px] transition-all"
                >
                  Terminate_Account
                </button>
              </div>
            </div>

            {/* Module 04: Session Control */}
            <SessionManager />

            <footer className="pt-12 flex justify-between items-center opacity-10 border-t border-white/5">
              <span className="text-[8px] font-black uppercase tracking-[0.6em] italic">SYSTEM_END_OF_MANIFEST // RINGBEAT_INTERNAL</span>
              <div className="flex gap-6">
                <Zap size={14} />
                <Globe size={14} />
              </div>
            </footer>
          </main>
        </div>
      </div>

      {/* Delete Account Modal */}
      {deleteModalOpen && (
        <Modal isOpen={true} onClose={() => setDeleteModalOpen(false)} title="System_Purge_Warning" size="sm">
          <div className="space-y-8">
            <div className="flex justify-center text-red-500 mb-6">
              <AlertTriangle size={48} strokeWidth={1} />
            </div>

            {deleteStep === 1 ? (
              <div className="space-y-8 text-center">
                <p className="text-sm font-black uppercase tracking-widest text-white/80">Bạn có chắc chắn muốn xóa tài khoản?</p>
                <p className="text-[10px] text-red-500/80 uppercase tracking-widest">Hành động này sẽ xóa hoàn toàn profile, playlist public và ngắt mọi kết nối hiện tại.</p>
                <button
                  onClick={handleRequestDelete}
                  disabled={saving}
                  className="w-full py-4 bg-red-500 text-black font-black uppercase tracking-[0.2em] text-xs hover:bg-white transition-all disabled:opacity-30"
                >
                  {saving ? 'Requesting...' : 'Confirm_&_Send_Code'}
                </button>
              </div>
            ) : (
              <div className="space-y-8">
                <p className="text-[10px] text-white/60 text-center uppercase tracking-widest">Mã xác nhận đã được gửi. Vui lòng nhập mã để hoàn tất thủ tục hủy diệt.</p>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-red-500 uppercase tracking-[0.3em] flex items-center gap-2">
                    <Trash2 size={12} /> Purge_Code
                  </label>
                  <input
                    type="text"
                    value={deleteOtp}
                    onChange={(e) => setDeleteOtp(e.target.value)}
                    maxLength={6}
                    placeholder="------"
                    className="w-full bg-red-500/[0.05] border border-red-500/30 px-6 py-4 text-red-500 text-center text-2xl tracking-[1em] font-black outline-none focus:border-red-500 transition-all placeholder:text-red-500/20"
                  />
                </div>
                <button
                  onClick={handleConfirmDelete}
                  disabled={saving || deleteOtp.length !== 6}
                  className="w-full py-4 bg-red-500 text-black font-black uppercase tracking-[0.2em] text-xs hover:bg-white transition-all disabled:opacity-30"
                >
                  {saving ? 'Purging...' : 'Execute_Purge'}
                </button>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};

const TechnicalReadout = ({ icon: Icon, label, value }: { icon: any; label: string; value: string }) => (
  <div className="flex items-center gap-4">
    <div className="w-10 h-10 flex items-center justify-center border border-white/10 bg-white/[0.02]">
      <Icon size={16} className="text-[#1db954]" />
    </div>
    <div className="flex flex-col">
      <span className="text-[7px] font-black uppercase tracking-[0.4em] text-white/40">{label}</span>
      <span className="text-[12px] font-black uppercase tracking-widest text-white">{value}</span>
    </div>
  </div>
);

const SettingsSkeleton = () => (
  <div className="flex-1 w-full min-h-full bg-black p-12">
    <div className="max-w-screen-2xl mx-auto space-y-24 animate-pulse">
      <div className="h-40 w-full bg-white/[0.02] border border-white/5" />
      <div className="grid grid-cols-[400px_1fr] gap-20">
        <div className="h-96 bg-white/[0.02]" />
        <div className="space-y-12">
          <div className="h-64 bg-white/[0.02]" />
          <div className="h-64 bg-white/[0.02]" />
        </div>
      </div>
    </div>
  </div>
);
