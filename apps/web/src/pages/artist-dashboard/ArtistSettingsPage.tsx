import { useEffect, useState, useRef } from 'react';
import { api } from '../../lib/api';
import { useAuthStore } from '../../stores/auth.store';
import { toast } from 'sonner';
import { Camera, Loader2, BadgeCheck, Send, Upload } from 'lucide-react';

export const ArtistSettingsPage = () => {
  const { user } = useAuthStore();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [requestingVerify, setRequestingVerify] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    stageName: '',
    bio: '',
    avatarUrl: '',
    socialLinks: {
      website: '',
      instagram: '',
      facebook: '',
      youtube: '',
      tiktok: '',
    },
  });

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const res = await api.get('/artists/me') as any;
        const data = res.data;
        setProfile(data);
        setForm({
          stageName: data.stageName || '',
          bio: data.bio || '',
          avatarUrl: data.avatarUrl || '',
          socialLinks: {
            website: data.socialLinks?.website || '',
            instagram: data.socialLinks?.instagram || '',
            facebook: data.socialLinks?.facebook || '',
            youtube: data.socialLinks?.youtube || '',
            tiktok: data.socialLinks?.tiktok || '',
          },
        });
      } catch {
        setForm(prev => ({ ...prev, stageName: user?.name || '' }));
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [user]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) { toast.error('Vui lòng chọn file ảnh'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('Ảnh quá lớn (tối đa 5MB)'); return; }

    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      const res = await api.post('/artists/me/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }) as any;
      const newUrl = res.data?.avatarUrl;
      setForm((p) => ({ ...p, avatarUrl: newUrl }));
      toast.success('Đã cập nhật ảnh đại diện! 🎤');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Upload thất bại');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Không gửi avatarUrl trong PATCH – đã được cập nhật riêng qua /me/avatar
      const { avatarUrl: _skip, ...patchBody } = form;
      await api.patch('/artists/me', patchBody);
      toast.success('Đã lưu thông tin!');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Không thể lưu thông tin');
    } finally {
      setSaving(false);
    }
  };

  const handleRequestVerify = async () => {
    if (profile?.isVerified) return;
    setRequestingVerify(true);
    try {
      await api.post('/artists/request-verify');
      toast.success('Đã gửi yêu cầu cấp Verified Badge tới Admin! ✅');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Không thể gửi yêu cầu');
    } finally {
      setRequestingVerify(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center py-20">
        <Loader2 size={32} className="animate-spin text-[#1DB954]" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <h2 className="text-2xl font-bold">Cài đặt Profile</h2>
        <p className="text-[#b3b3b3] text-sm mt-1">Quản lý thông tin nghệ sĩ công khai của bạn</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Avatar Upload */}
        <div className="flex items-center gap-5">
          <div className="relative group cursor-pointer" onClick={() => avatarInputRef.current?.click()}>
            {form.avatarUrl ? (
              <img
                src={form.avatarUrl}
                alt="Avatar"
                className="w-24 h-24 rounded-full object-cover ring-2 ring-[#1DB954]"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-[#282828] flex items-center justify-center ring-2 ring-[#282828]">
                <Camera size={28} className="text-[#b3b3b3]" />
              </div>
            )}
            {/* Overlay khi hover */}
            <div className="absolute inset-0 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              {uploadingAvatar
                ? <Loader2 size={20} className="animate-spin text-white" />
                : <Upload size={20} className="text-white" />}
            </div>
            {profile?.isVerified && (
              <div className="absolute -bottom-1 -right-1 bg-[#1DB954] rounded-full p-0.5">
                <BadgeCheck size={16} className="text-white" />
              </div>
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-white mb-0.5">Ảnh đại diện</p>
            <p className="text-xs text-[#b3b3b3] mb-2">JPG, PNG tối đa 5MB</p>
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="text-xs px-3 py-1.5 rounded-full border border-[#535353] hover:border-white transition-colors disabled:opacity-50"
            >
              {uploadingAvatar ? 'Đang tải lên...' : 'Chọn ảnh'}
            </button>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarUpload}
            />
          </div>
        </div>

        {/* Basic Info */}
        <div className="bg-[#181818] rounded-xl p-5 border border-[#282828] space-y-4">
          <h3 className="font-bold text-sm text-[#b3b3b3] uppercase tracking-wider">Thông tin cơ bản</h3>
          <div>
            <label className="text-xs text-[#b3b3b3] mb-1 block">Tên nghệ sĩ *</label>
            <input
              className="w-full bg-[#282828] border border-[#3e3e3e] rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-[#1DB954] transition-colors"
              value={form.stageName}
              onChange={(e) => setForm((p) => ({ ...p, stageName: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-xs text-[#b3b3b3] mb-1 block">Tiểu sử</label>
            <textarea
              rows={4}
              className="w-full bg-[#282828] border border-[#3e3e3e] rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-[#1DB954] transition-colors resize-none"
              placeholder="Kể câu chuyện của bạn..."
              value={form.bio}
              onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))}
            />
          </div>
        </div>

        {/* Social Links */}
        <div className="bg-[#181818] rounded-xl p-5 border border-[#282828] space-y-3">
          <h3 className="font-bold text-sm text-[#b3b3b3] uppercase tracking-wider">Mạng xã hội</h3>
          {[
            { key: 'website', label: 'Website', placeholder: 'https://yournewweb.com' },
            { key: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/yourname' },
            { key: 'facebook', label: 'Facebook', placeholder: 'https://facebook.com/yourname' },
            { key: 'youtube', label: 'YouTube', placeholder: 'https://youtube.com/@yourchannel' },
            { key: 'tiktok', label: 'TikTok', placeholder: 'https://tiktok.com/@yourname' },
          ].map(({ key, label, placeholder }) => (
            <div key={key}>
              <label className="text-xs text-[#b3b3b3] mb-1 block">{label}</label>
              <input
                className="w-full bg-[#282828] border border-[#3e3e3e] rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-[#1DB954] transition-colors"
                placeholder={placeholder}
                value={(form.socialLinks as any)[key]}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    socialLinks: { ...p.socialLinks, [key]: e.target.value },
                  }))
                }
              />
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 py-3 bg-[#1DB954] text-black font-bold rounded-full hover:bg-[#1ed760] disabled:opacity-50 transition-colors text-sm flex items-center justify-center gap-2"
          >
            {saving ? <><Loader2 size={14} className="animate-spin" /> Đang lưu...</> : 'Lưu thay đổi'}
          </button>
        </div>
      </form>

      {/* Verified Badge Section */}
      <div className={`mt-6 p-5 rounded-xl border ${profile?.isVerified ? 'bg-[#1DB954]/10 border-[#1DB954]/30' : 'bg-[#181818] border-[#282828]'}`}>
        <div className="flex items-center gap-3 mb-3">
          <BadgeCheck size={20} className={profile?.isVerified ? 'text-[#1DB954]' : 'text-[#b3b3b3]'} />
          <h3 className="font-bold">{profile?.isVerified ? 'Tài khoản đã xác minh ✅' : 'Yêu cầu Verified Badge'}</h3>
        </div>
        {profile?.isVerified ? (
          <p className="text-sm text-[#b3b3b3]">Tài khoản của bạn đã được xác minh bởi Admin.</p>
        ) : (
          <>
            <p className="text-sm text-[#b3b3b3] mb-4">
              Verified Badge giúp người dùng nhận biết bạn là nghệ sĩ chính thức trên nền tảng.
            </p>
            <button
              onClick={handleRequestVerify}
              disabled={requestingVerify}
              className="flex items-center gap-2 px-5 py-2 bg-white text-black font-bold rounded-full hover:bg-[#e0e0e0] disabled:opacity-50 transition-colors text-sm"
            >
              {requestingVerify
                ? <><Loader2 size={14} className="animate-spin" /> Đang gửi...</>
                : <><Send size={14} /> Gửi yêu cầu</>}
            </button>
          </>
        )}
      </div>
    </div>
  );
};
