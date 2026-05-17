import { useState, useEffect, useRef } from 'react';
import { Share2, AlertTriangle, Heart } from 'lucide-react';
import { useUIStore } from '../../stores/ui.store';
import { useLibraryStore } from '../../stores/library.store';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

interface Album {
  id: string;
  title: string;
  artistId?: string;
  artistName?: string;
}

interface AlbumContextMenuProps {
  album: Album;
  position: { x: number; y: number };
  onClose: () => void;
}

export const AlbumContextMenu = ({
  album,
  position,
  onClose,
}: AlbumContextMenuProps) => {
  const { openReportModal } = useUIStore();
  const { toggleFollowAlbum, isFollowingAlbum } = useLibraryStore();
  const isSaved = isFollowingAlbum(album.id);
  const menuRef = useRef<HTMLDivElement>(null);

  const adjustedPos = {
    x: Math.min(position.x, window.innerWidth - 240),
    y: Math.min(position.y, window.innerHeight - 150),
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) onClose();
    };
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      ref={menuRef}
      style={{ position: 'fixed', top: adjustedPos.y, left: adjustedPos.x, zIndex: 9999 }}
      className="bg-black border border-white/20 shadow-[20px_20px_60px_rgba(0,0,0,0.8)] w-60 py-0 overflow-hidden isolate select-none"
      onClick={(e) => e.stopPropagation()}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="absolute inset-0 opacity-[0.05] pointer-events-none mix-blend-overlay z-0 bg-noise" />

      <div className="relative z-10">
        <div className="px-4 py-3 border-b border-white/10 bg-white/[0.02]">
          <p className="text-white font-black uppercase tracking-tighter truncate text-[11px]">{album.title}</p>
          <p className="text-white/30 text-[8px] font-black uppercase tracking-widest mt-0.5">Album_Release</p>
        </div>

        <div className="py-2">
          <MenuItem 
            icon={<Heart size={14} className={isSaved ? "fill-current text-[#1db954]" : ""} />} 
            label={isSaved ? "Remove from Library" : "Save to Library"} 
            index="LIB"
            onClick={() => {
              toggleFollowAlbum(album.id, album.title);
              onClose();
            }} 
          />
          <MenuItem 
            icon={<Share2 size={14} />} 
            label="Copy Album Link" 
            index="LNK"
            onClick={() => { 
              navigator.clipboard.writeText(`${window.location.origin}/album/${album.id}`);
              toast.success('Link copied to clipboard');
              onClose(); 
            }} 
          />
          {album.artistId && album.artistName && (
            <MenuItem 
              icon={<AlertTriangle size={14} />} 
              label="Flag Creator Node" 
              index="RPT"
              onClick={() => {
                openReportModal(album.artistId!, 'USER', album.artistName!);
                onClose();
              }} 
            />
          )}
        </div>
      </div>
    </motion.div>
  );
};

const MenuItem = ({
  icon, label, onClick, danger, index
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
  index: string;
}) => (
  <button
    onClick={onClick}
    className={cn(
      "w-full flex items-center justify-between px-4 py-3 hover:bg-[#1db954] hover:text-black transition-all group/item",
      danger ? 'text-red-500' : 'text-white'
    )}
  >
    <div className="flex items-center gap-3">
      <span className="transition-colors group-hover/item:text-black text-white/40">
        {icon}
      </span>
      <span className="text-[10px] font-black uppercase tracking-widest leading-none">{label}</span>
    </div>
    <span className="text-[8px] font-black italic opacity-20 group-hover/item:opacity-100 group-hover/item:text-black">{index}</span>
  </button>
);

export const useAlbumContextMenu = () => {
  const [menu, setMenu] = useState<{ album: Album; position: { x: number; y: number } } | null>(null);

  const openAlbumMenu = (e: React.MouseEvent, album: Album) => {
    e.preventDefault();
    e.stopPropagation();
    setMenu({ album, position: { x: e.clientX, y: e.clientY } });
  };

  const closeAlbumMenu = () => setMenu(null);

  return { menu, openAlbumMenu, closeAlbumMenu };
};
