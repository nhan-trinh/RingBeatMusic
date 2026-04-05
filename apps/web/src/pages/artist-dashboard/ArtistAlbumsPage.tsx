import { useEffect, useState, useRef } from 'react';
import { api } from '../../lib/api';
import { Plus, Disc3, Trash2, Edit2, Music2, Upload, Loader2, Globe, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

// ─── Create Album Modal ─────────────────────────────────────────────────────
const AlbumModal = ({
  album,
  onClose,
  onSuccess,
}: {
  album?: any;
  onClose: () => void;
  onSuccess: () => void;
}) => {
  const isEdit = !!album;
  const [form, setForm] = useState({
    title: album?.title || '',
    coverUrl: album?.coverUrl || '',
    releaseDate: album?.releaseDate
      ? new Date(album.releaseDate).toISOString().split('T')[0]
      : '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [albumId, setAlbumId] = useState<string | null>(album?.id || null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Vui lòng chọn file ảnh'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('Ảnh quá lớn (tối đa 5MB)'); return; }

    // Nếu đây là album mới chưa tạo, tạo album trước rồi upload cover
    let targetAlbumId = albumId;
    if (!targetAlbumId) {
      if (!form.title.trim()) { toast.error('Nhập tên album trước khi chọn ảnh bìa'); return; }
      try {
        const res = await api.post('/albums', {
          title: form.title,
          releaseDate: form.releaseDate || undefined,
        }) as any;
        targetAlbumId = res.data?.id;
        setAlbumId(targetAlbumId);
      } catch (err: any) {
        toast.error('Không thể tạo album'); return;
      }
    }

    setUploadingCover(true);
    try {
      const formData = new FormData();
      formData.append('cover', file);
      const res = await api.post(`/albums/${targetAlbumId}/cover`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }) as any;
      setForm(p => ({ ...p, coverUrl: res.data?.coverUrl || '' }));
      toast.success('Đã cập nhật ảnh bìa!');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Upload thất bại');
    } finally {
      setUploadingCover(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error('Vui lòng nhập tên album'); return; }
    setSubmitting(true);
    try {
      if (isEdit) {
        await api.patch(`/albums/${album.id}`, { title: form.title, releaseDate: form.releaseDate || undefined });
        toast.success('Đã cập nhật album!');
      } else if (albumId) {
        // Đã tạo album (khi upload ảnh bìa) – chỉ cập nhật title/date
        await api.patch(`/albums/${albumId}`, { title: form.title, releaseDate: form.releaseDate || undefined });
        toast.success('Album đã được tạo! 💿');
      } else {
        // Tạo mới hoàn toàn (không upload ảnh bìa)
        await api.post('/albums', { title: form.title, releaseDate: form.releaseDate || undefined });
        toast.success('Đã tạo album mới! 💿');
      }
      onSuccess();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-[#282828] rounded-2xl w-full max-w-md p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-xl font-bold mb-5">{isEdit ? 'Chỉnh sửa Album' : 'Tạo Album mới'}</h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs text-[#b3b3b3] mb-1 block">Tiêu đề album *</label>
            <input
              className="w-full bg-[#3e3e3e] rounded-lg px-3 py-2 text-sm text-white outline-none focus:ring-1 focus:ring-[#1DB954]"
              placeholder="Tên album..."
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              autoFocus
            />
          </div>

          {/* Cover Upload */}
          <div>
            <label className="text-xs text-[#b3b3b3] mb-1 block">Ảnh bìa</label>
            <div
              onClick={() => coverInputRef.current?.click()}
              className="relative w-full aspect-video bg-[#3e3e3e] rounded-lg overflow-hidden cursor-pointer group hover:bg-[#4e4e4e] transition-colors flex items-center justify-center"
            >
              {form.coverUrl ? (
                <img src={form.coverUrl} alt="cover" className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center gap-2 text-[#b3b3b3] group-hover:text-white transition-colors">
                  <Upload size={24} />
                  <span className="text-xs">Click để chọn ảnh bìa</span>
                  <span className="text-xs opacity-60">JPG, PNG tối đa 5MB</span>
                </div>
              )}
              {/* Upload overlay */}
              {form.coverUrl && (
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  {uploadingCover
                    ? <Loader2 size={20} className="animate-spin text-white" />
                    : <><Upload size={16} className="text-white" /><span className="text-white text-xs">Đổi ảnh</span></>}
                </div>
              )}
              {uploadingCover && !form.coverUrl && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 size={24} className="animate-spin text-[#1DB954]" />
                </div>
              )}
            </div>
            <input
              ref={coverInputRef} type="file" accept="image/*"
              className="hidden" onChange={handleCoverUpload}
            />
          </div>
          <div>
            <label className="text-xs text-[#b3b3b3] mb-1 block">Ngày phát hành</label>
            <input
              type="date"
              className="w-full bg-[#3e3e3e] rounded-lg px-3 py-2 text-sm text-white outline-none focus:ring-1 focus:ring-[#1DB954]"
              value={form.releaseDate}
              onChange={(e) => setForm((p) => ({ ...p, releaseDate: e.target.value }))}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-full border border-[#535353] text-sm font-bold hover:border-white transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2 rounded-full bg-[#1DB954] text-black text-sm font-bold hover:bg-[#1ed760] disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Đang lưu...' : isEdit ? 'Cập nhật' : 'Tạo album'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Main Page ───────────────────────────────────────────────────────────────
export const ArtistAlbumsPage = () => {
  const [albums, setAlbums] = useState<any[]>([]);
  const [songs, setSongs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalState, setModalState] = useState<{ open: boolean; album?: any }>({ open: false });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [albumsRes, songsRes] = await Promise.all([
        api.get('/artists/me/albums') as any,
        api.get('/artists/me/songs') as any,
      ]);
      setAlbums(albumsRes.data || []);
      setSongs(songsRes.data || []);
    } catch { }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleDelete = async (albumId: string) => {
    if (!confirm('Xóa album này? Các bài hát sẽ không bị xóa.')) return;
    try {
      await api.delete(`/albums/${albumId}`);
      toast.success('Đã xóa album');
      fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Không thể xóa album');
    }
  };

  const handleAddSongsToAlbum = async (albumId: string, songId: string) => {
    try {
      await api.post(`/albums/${albumId}/songs`, { songId });
      toast.success('Đã thêm bài hát vào album!');
      fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Không thể thêm bài hát');
    }
  };

  const handleTogglePublish = async (album: any) => {
    const newStatus = album.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
    try {
      await api.patch(`/albums/${album.id}`, { status: newStatus });
      toast.success(newStatus === 'PUBLISHED' ? 'Album đã được xuất bản! 🌍' : 'Album đã chuyển về bản nháp');
      fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Không thể cập nhật');
    }
  };


  const statusColor: Record<string, string> = {
    DRAFT: 'bg-[#b3b3b3]/20 text-[#b3b3b3]',
    PUBLISHED: 'bg-[#1DB954]/20 text-[#1DB954]',
    ARCHIVED: 'bg-red-500/20 text-red-400',
  };
  const statusLabel: Record<string, string> = {
    DRAFT: 'Bản nháp',
    PUBLISHED: 'Đã phát hành',
    ARCHIVED: 'Đã lưu trữ',
  };

  // Bài hát chưa có album
  const unassignedSongs = songs.filter((s) => !s.albumId);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Album của bạn</h2>
          <p className="text-[#b3b3b3] text-sm mt-1">{albums.length} album</p>
        </div>
        <button
          onClick={() => setModalState({ open: true })}
          className="flex items-center gap-2 bg-[#1DB954] text-black font-bold px-5 py-2.5 rounded-full hover:bg-[#1ed760] transition-colors text-sm"
        >
          <Plus size={16} />
          Tạo album
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-[#181818] rounded-xl p-4 border border-[#282828] animate-pulse">
              <div className="w-full aspect-square bg-white/10 rounded-lg mb-3" />
              <div className="h-4 bg-white/10 rounded w-2/3 mb-2" />
              <div className="h-3 bg-white/10 rounded w-1/3" />
            </div>
          ))}
        </div>
      ) : albums.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Disc3 size={48} className="text-[#b3b3b3] mb-4" />
          <p className="font-bold text-white text-lg mb-2">Chưa có album nào</p>
          <p className="text-sm text-[#b3b3b3] mb-6">Tạo album đầu tiên để tổ chức bài hát của bạn</p>
          <button
            onClick={() => setModalState({ open: true })}
            className="bg-[#1DB954] text-black font-bold px-6 py-2.5 rounded-full hover:bg-[#1ed760] transition-colors text-sm"
          >
            Tạo album đầu tiên
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {albums.map((album) => (
            <div
              key={album.id}
              className="bg-[#181818] rounded-xl border border-[#282828] hover:border-[#383838] overflow-hidden group transition-colors"
            >
              {/* Cover */}
              <div className="relative">
                {album.coverUrl ? (
                  <img
                    src={album.coverUrl}
                    alt={album.title}
                    className="w-full aspect-square object-cover"
                  />
                ) : (
                  <div className="w-full aspect-square bg-[#282828] flex items-center justify-center">
                    <Disc3 size={48} className="text-[#b3b3b3]" />
                  </div>
                )}
                {/* Hover actions */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                  <Link
                    to={`/album/${album.id}`}
                    target="_blank"
                    className="px-3 py-1.5 bg-white text-black text-xs font-bold rounded-full hover:bg-[#1DB954] transition-colors"
                  >
                    Xem
                  </Link>
                  <button
                    onClick={() => setModalState({ open: true, album })}
                    className="p-2 bg-[#282828] rounded-full hover:bg-[#383838] transition-colors"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(album.id)}
                    className="p-2 bg-red-500/20 rounded-full hover:bg-red-500/40 text-red-400 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Info */}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white truncate">{album.title}</p>
                    <p className="text-xs text-[#b3b3b3] mt-0.5">
                      {album._count?.songs || 0} bài hát
                      {album.releaseDate && ` • ${new Date(album.releaseDate).getFullYear()}`}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${statusColor[album.status] || 'bg-white/10 text-white'}`}>
                    {statusLabel[album.status] || album.status}
                  </span>
                </div>

                {/* Publish / Unpublish button */}
                <button
                  onClick={() => handleTogglePublish(album)}
                  className={`mt-3 w-full flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    album.status === 'PUBLISHED'
                      ? 'bg-[#b3b3b3]/10 text-[#b3b3b3] hover:bg-red-500/10 hover:text-red-400'
                      : 'bg-[#1DB954]/10 text-[#1DB954] hover:bg-[#1DB954]/20'
                  }`}
                >
                  {album.status === 'PUBLISHED'
                    ? <><EyeOff size={12} /> Hủy xuất bản</>
                    : <><Globe size={12} /> Xuất bản lên trang chủ</>}
                </button>

                {/* Add songs to album */}
                {unassignedSongs.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-[#282828]">
                    <p className="text-xs text-[#b3b3b3] mb-2 flex items-center gap-1">
                      <Music2 size={12} />
                      Thêm bài vào album:
                    </p>
                    <select
                      className="w-full bg-[#282828] text-xs text-white rounded px-2 py-1.5 outline-none focus:ring-1 focus:ring-[#1DB954]"
                      defaultValue=""
                      onChange={(e) => {
                        if (e.target.value) {
                          handleAddSongsToAlbum(album.id, e.target.value);
                          e.target.value = '';
                        }
                      }}
                    >
                      <option value="">— Chọn bài hát —</option>
                      {unassignedSongs.map((s) => (
                        <option key={s.id} value={s.id}>{s.title}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {modalState.open && (
        <AlbumModal
          album={modalState.album}
          onClose={() => setModalState({ open: false })}
          onSuccess={() => { setModalState({ open: false }); fetchData(); }}
        />
      )}
    </div>
  );
};
