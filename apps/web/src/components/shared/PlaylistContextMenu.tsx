import { useState, useEffect, useRef } from 'react';
import { Edit2, Trash2, Share2, Globe, Lock } from 'lucide-react';
import { useLibraryStore } from '../../stores/library.store';
import { useAuthStore } from '../../stores/auth.store';

interface Playlist {
  id: string;
  title: string;
  coverUrl?: string | null;
  isPublic?: boolean;
  ownerId: string;
}

interface PlaylistContextMenuProps {
  playlist: Playlist;
  position: { x: number; y: number };
  onClose: () => void;
  onRename?: () => void;
}

export const PlaylistContextMenu = ({
  playlist,
  position,
  onClose,
  onRename,
}: PlaylistContextMenuProps) => {
  const { deletePlaylist, updatePlaylist } = useLibraryStore();
  const { user } = useAuthStore();
  const menuRef = useRef<HTMLDivElement>(null);

  const isOwner = playlist.ownerId === user?.id;

  // Điều chỉnh vị trí để không bị tràn màn hình
  const adjustedPos = {
    x: Math.min(position.x, window.innerWidth - 220),
    y: Math.min(position.y, window.innerHeight - 200),
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  const handleDelete = async () => {
    if (confirm(`Sếp có chắc chắn muốn xóa playlist "${playlist.title}" không?`)) {
      await deletePlaylist(playlist.id);
      onClose();
    }
  };

  return (
    <div
      ref={menuRef}
      style={{ position: 'fixed', top: adjustedPos.y, left: adjustedPos.x, zIndex: 9999 }}
      className="bg-[#282828] rounded-lg shadow-2xl w-52 py-1 border border-[#3e3e3e] text-sm animate-in fade-in zoom-in-95 duration-100"
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="px-3 py-2 border-b border-[#3e3e3e] mb-1">
        <p className="text-white font-medium truncate text-xs">{playlist.title}</p>
        <p className="text-[#b3b3b3] text-[10px] uppercase font-bold tracking-wider">Playlist</p>
      </div>

      {isOwner && (
        <MenuItem 
          icon={<Edit2 size={15} />} 
          label="Đổi tên" 
          onClick={() => { if (onRename) onRename(); onClose(); }} 
        />
      )}

      <MenuItem 
        icon={<Share2 size={15} />} 
        label="Chia sẻ" 
        onClick={() => { 
          navigator.clipboard.writeText(`${window.location.origin}/playlist/${playlist.id}`);
          alert('Đã sao chép liên kết vào bộ nhớ tạm! 💎');
          onClose(); 
        }} 
      />

      {isOwner && (
        <MenuItem 
          icon={playlist.isPublic ? <Lock size={15} /> : <Globe size={15} />} 
          label={playlist.isPublic ? "Đặt làm riêng tư" : "Công khai playlist"} 
          onClick={async () => {
            await updatePlaylist(playlist.id, { isPublic: !playlist.isPublic });
            onClose();
          }} 
        />
      )}

      {isOwner && (
        <>
          <div className="border-t border-[#3e3e3e] my-1" />
          <MenuItem 
            icon={<Trash2 size={15} />} 
            label="Xóa" 
            onClick={handleDelete}
            danger 
          />
        </>
      )}
    </div>
  );
};

// ─── MenuItem ───────────────────────────────────────────────────────────────────
const MenuItem = ({
  icon, label, onClick, danger,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-3 py-2 hover:bg-white/10 transition-colors text-left ${
      danger ? 'text-red-400 hover:text-red-300' : 'text-[#b3b3b3] hover:text-white'
    }`}
  >
    {icon}
    <span className="flex-1 text-xs">{label}</span>
  </button>
);

// ─── Hook usePlaylistContextMenu ──────────────────────────────────────────────
export const usePlaylistContextMenu = () => {
  const [menu, setMenu] = useState<{ playlist: Playlist; position: { x: number; y: number } } | null>(null);

  const openPlaylistMenu = (e: React.MouseEvent, playlist: Playlist) => {
    e.preventDefault();
    e.stopPropagation();
    setMenu({ playlist, position: { x: e.clientX, y: e.clientY } });
  };

  const closePlaylistMenu = () => setMenu(null);

  return { menu, openPlaylistMenu, closePlaylistMenu };
};
