import { useState, useEffect, useRef } from 'react';
import { Heart, ListPlus, Plus, Trash2, PlayCircle } from 'lucide-react';
import { useLibraryStore } from '../../stores/library.store';
import { useAuthStore } from '../../stores/auth.store';

interface Song {
  id: string;
  title: string;
  artistName?: string;
  coverUrl?: string | null;
  audioUrl?: string;
  duration?: number;
}

interface SongContextMenuProps {
  song: Song;
  position: { x: number; y: number };
  onClose: () => void;
  onPlay?: () => void;
  onRemoveFromPlaylist?: () => void; // Chỉ hiện khi đang ở trong playlist
}

export const SongContextMenu = ({
  song,
  position,
  onClose,
  onPlay,
  onRemoveFromPlaylist,
}: SongContextMenuProps) => {
  const { isAuthenticated } = useAuthStore();
  const { isLiked, toggleLike, playlists, addSongToPlaylist, createPlaylist } = useLibraryStore();
  const [showPlaylistSubmenu, setShowPlaylistSubmenu] = useState(false);
  const [creatingPlaylist, setCreatingPlaylist] = useState(false);
  const [newPlaylistTitle, setNewPlaylistTitle] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);
  const liked = isLiked(song.id);

  // Điều chỉnh vị trí để không bị tràn màn hình
  const adjustedPos = {
    x: Math.min(position.x, window.innerWidth - 220),
    y: Math.min(position.y, window.innerHeight - 300),
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

  const handleAddToNewPlaylist = async () => {
    if (!newPlaylistTitle.trim()) return;
    setCreatingPlaylist(true);
    const playlist = await createPlaylist(newPlaylistTitle.trim());
    if (playlist) {
      await addSongToPlaylist(playlist.id, song.id, song.title);
    }
    setCreatingPlaylist(false);
    setNewPlaylistTitle('');
    onClose();
  };

  return (
    <div
      ref={menuRef}
      style={{ position: 'fixed', top: adjustedPos.y, left: adjustedPos.x, zIndex: 9999 }}
      className="bg-[#282828] rounded-lg shadow-2xl w-52 py-1 border border-[#3e3e3e] text-sm"
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Song info header */}
      <div className="px-3 py-2 border-b border-[#3e3e3e] mb-1">
        <p className="text-white font-medium truncate text-xs">{song.title}</p>
        {song.artistName && <p className="text-[#b3b3b3] text-xs truncate">{song.artistName}</p>}
      </div>

      {/* Play */}
      {onPlay && (
        <MenuItem icon={<PlayCircle size={15} />} label="Phát ngay" onClick={() => { onPlay(); onClose(); }} />
      )}

      {/* Like */}
      {isAuthenticated && (
        <MenuItem
          icon={<Heart size={15} className={liked ? 'fill-[#1DB954] text-[#1DB954]' : ''} />}
          label={liked ? 'Xóa khỏi Bài đã thích' : 'Thêm vào Bài đã thích'}
          onClick={() => { toggleLike(song.id, song.title); onClose(); }}
          active={liked}
        />
      )}

      {/* Add to playlist */}
      {isAuthenticated && (
        <div
          className="relative"
          onMouseEnter={() => setShowPlaylistSubmenu(true)}
          onMouseLeave={() => setShowPlaylistSubmenu(false)}
        >
          <MenuItem
            icon={<ListPlus size={15} />}
            label="Thêm vào playlist"
            hasSubmenu
            onClick={() => setShowPlaylistSubmenu(v => !v)}
          />

          {showPlaylistSubmenu && (
            <div className="absolute left-full top-0 ml-1 bg-[#282828] rounded-lg shadow-2xl w-52 py-1 border border-[#3e3e3e]">
              {/* Create new playlist inline */}
              <div className="px-3 py-2 border-b border-[#3e3e3e]">
                <div className="text-xs text-[#b3b3b3] mb-1.5 flex items-center gap-1">
                  <Plus size={11} />Playlist mới
                </div>
                <div className="flex gap-1">
                  <input
                    className="flex-1 bg-[#3e3e3e] text-white text-xs px-2 py-1 rounded outline-none focus:ring-1 focus:ring-[#1DB954]"
                    placeholder="Tên playlist..."
                    value={newPlaylistTitle}
                    onChange={e => setNewPlaylistTitle(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleAddToNewPlaylist(); e.stopPropagation(); }}
                    autoFocus
                  />
                  <button
                    onClick={handleAddToNewPlaylist}
                    disabled={!newPlaylistTitle.trim() || creatingPlaylist}
                    className="px-2 py-1 bg-[#1DB954] text-black text-xs rounded font-bold hover:bg-[#1ed760] disabled:opacity-40"
                  >
                    {creatingPlaylist ? '...' : 'Tạo'}
                  </button>
                </div>
              </div>

              {/* Existing playlists */}
              <div className="max-h-40 overflow-y-auto">
                {playlists.length === 0 ? (
                  <p className="text-xs text-[#b3b3b3] px-3 py-2">Chưa có playlist nào</p>
                ) : (
                  playlists.map(p => (
                    <button
                      key={p.id}
                      onClick={() => { addSongToPlaylist(p.id, song.id, song.title); onClose(); }}
                      className="w-full text-left px-3 py-1.5 text-xs text-[#b3b3b3] hover:bg-white/10 hover:text-white transition-colors truncate"
                    >
                      {p.title}
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Remove from playlist (chỉ hiện khi được truyền prop) */}
      {onRemoveFromPlaylist && (
        <>
          <div className="border-t border-[#3e3e3e] my-1" />
          <MenuItem
            icon={<Trash2 size={15} />}
            label="Xóa khỏi playlist này"
            onClick={() => { onRemoveFromPlaylist(); onClose(); }}
            danger
          />
        </>
      )}
    </div>
  );
};

// ─── Helper ───────────────────────────────────────────────────────────────────
const MenuItem = ({
  icon, label, onClick, active, danger, hasSubmenu,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
  danger?: boolean;
  hasSubmenu?: boolean;
}) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-3 py-2 hover:bg-white/10 transition-colors text-left ${
      danger ? 'text-red-400 hover:text-red-300' : active ? 'text-[#1DB954]' : 'text-[#b3b3b3] hover:text-white'
    }`}
  >
    {icon}
    <span className="flex-1 text-xs">{label}</span>
    {hasSubmenu && <span className="text-[#b3b3b3] text-xs">›</span>}
  </button>
);

// ─── Hook useContextMenu ──────────────────────────────────────────────────────
export const useContextMenu = () => {
  const [menu, setMenu] = useState<{ song: Song; position: { x: number; y: number } } | null>(null);

  const openMenu = (e: React.MouseEvent, song: Song) => {
    e.preventDefault();
    e.stopPropagation();
    setMenu({ song, position: { x: e.clientX, y: e.clientY } });
  };

  const closeMenu = () => setMenu(null);

  return { menu, openMenu, closeMenu };
};
