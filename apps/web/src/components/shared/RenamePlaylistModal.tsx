import React, { useState, useEffect, useRef } from 'react';
import { Modal } from '../ui/modal';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { useLibraryStore } from '../../stores/library.store';

interface RenamePlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  playlistId: string;
  initialTitle: string;
}

export const RenamePlaylistModal: React.FC<RenamePlaylistModalProps> = ({
  isOpen,
  onClose,
  playlistId,
  initialTitle
}) => {
  const [title, setTitle] = useState(initialTitle);
  const [loading, setLoading] = useState(false);
  const { updatePlaylist } = useLibraryStore();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTitle(initialTitle);
      // Auto focus input when modal opens
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, initialTitle]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!title.trim() || title === initialTitle) {
      onClose();
      return;
    }

    setLoading(true);
    try {
      await updatePlaylist(playlistId, { title: title.trim() });
      onClose();
    } catch (error) {
      console.error('Failed to rename playlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const footer = (
    <div className="flex gap-3">
      <Button 
        variant="ghost" 
        onClick={onClose} 
        className="text-[#b3b3b3] hover:text-white"
        disabled={loading}
      >
        Hủy
      </Button>
      <Button 
        onClick={() => handleSubmit()} 
        disabled={loading || !title.trim()}
        className="bg-[#1db954] hover:bg-[#1ed760] text-black font-bold px-8"
      >
        {loading ? 'Đang lưu...' : 'Lưu'}
      </Button>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Sửa chi tiết"
      footer={footer}
      size="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="text-xs font-bold text-[#b3b3b3] uppercase tracking-wider">
            Tên Playlist
          </label>
          <Input
            ref={inputRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Tên Playlist mới"
            className="bg-[#3e3e3e] border-none focus-visible:ring-1 focus-visible:ring-white/20 h-12 text-base"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSubmit();
            }}
          />
        </div>
        <p className="text-[10px] text-[#b3b3b3] leading-tight">
          Hãy đặt một cái tên thật ấn tượng cho danh sách phát của sếp nhé!
        </p>
      </form>
    </Modal>
  );
};
