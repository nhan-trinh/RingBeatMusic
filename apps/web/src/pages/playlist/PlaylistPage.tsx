import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { queryClient } from '../../lib/query-client';
import { usePlayerStore } from '../../stores/player.store';
import { useLibraryStore } from '../../stores/library.store';
import { useAuthStore } from '../../stores/auth.store';
import { FastAverageColor } from 'fast-average-color';
import { Play, Pause, Heart, MoreHorizontal, Clock, Edit2, Camera, X, Loader2, UserPlus } from 'lucide-react';
import { formatTime, cn } from '../../lib/utils';
import { Link } from 'react-router-dom';
import { SongContextMenu, useContextMenu } from '../../components/shared/SongContextMenu';
import { PlaylistContextMenu, usePlaylistContextMenu } from '../../components/shared/PlaylistContextMenu';
import { CollaboratorModal } from '../../components/playlist/CollaboratorModal';
import { toast } from 'sonner';
import { useInteractionTracker } from '../../hooks/useInteractionTracker';

export const PlaylistPage = () => {
  const { id } = useParams();
  const [dominantColor, setDominantColor] = useState('#121212');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ title: '', description: '', coverUrl: '', isCollaborative: false });
  const [saving, setSaving] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [showCollaborators, setShowCollaborators] = useState(false);

  const { user } = useAuthStore();
  const { setContextAndPlay, currentContextId, currentTrack, isPlaying, togglePlay } = usePlayerStore();
  const { isLiked, toggleLike, isFollowingPlaylist, toggleFollowPlaylist, removeSongFromPlaylist } = useLibraryStore();
  const playlistFollowed = id ? isFollowingPlaylist(id) : false;
  const { menu: trackMenu, openMenu: openTrackMenu, closeMenu: closeTrackMenu } = useContextMenu();
  const { menu: playlistMenu, openPlaylistMenu, closePlaylistMenu } = usePlaylistContextMenu();

  // Tracking tương tác
  useInteractionTracker('PLAYLIST', id);

  const { data: playlist, isLoading: loading } = useQuery({
    queryKey: ['playlist', id],
    queryFn: async () => {
      const res = await api.get(`/playlists/${id}`) as any;
      return res.data;
    },
    enabled: !!id,
  });

  useEffect(() => {
    if (!playlist) return;

    setEditForm({
      title: playlist.title || '',
      description: playlist.description || '',
      coverUrl: playlist.coverUrl || '',
      isCollaborative: playlist.isCollaborative || false,
    });

    if (playlist.coverUrl && playlist.coverUrl.length > 5) {
      const fac = new FastAverageColor();
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.src = playlist.coverUrl + (playlist.coverUrl.includes('?') ? '&' : '?') + 'corsbuster=' + Date.now();
      img.onload = () => {
        try {
          const color = fac.getColor(img);
          setDominantColor(color.hex);
        } catch (e) { } finally { fac.destroy(); }
      };
    }
  }, [playlist]);

  if (loading) {
    return (
      <div className="flex-1 w-full min-h-full overflow-y-auto bg-[#121212] p-6 pt-24 text-white">
        <div className="flex items-end gap-6 mb-8 animate-pulse">
          <div className="w-[232px] h-[232px] bg-white/10 rounded shadow-lg"></div>
          <div className="flex flex-col gap-4 flex-1">
            <div className="h-4 w-24 bg-white/10 rounded"></div>
            <div className="h-16 w-3/4 bg-white/10 rounded"></div>
            <div className="h-4 w-1/2 bg-white/10 rounded mt-4"></div>
          </div>
        </div>
        <div className="px-6">
          <div className="flex items-center gap-6 mb-8 animate-pulse">
            <div className="w-14 h-14 bg-white/10 rounded-full"></div>
            <div className="w-10 h-10 bg-white/10 rounded-full"></div>
            <div className="w-10 h-10 bg-white/10 rounded-full"></div>
          </div>
          <div className="flex flex-col gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex gap-4 items-center animate-pulse">
                <div className="w-8 h-8 bg-white/10 rounded"></div>
                <div className="w-10 h-10 bg-white/10 rounded"></div>
                <div className="flex-1 h-4 bg-white/10 rounded"></div>
                <div className="w-16 h-4 bg-white/10 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!playlist) {
    return <div className="p-6 pt-24 text-white text-center">Không tìm thấy Playlist</div>;
  }

  const isThisPlaying = currentContextId === id && isPlaying;
  // Format for player store
  const trackList = playlist.songs.map((ps: any) => ({
    id: ps.song.id,
    title: ps.song.title,
    artistName: ps.song.artist.stageName,
    artistId: ps.song.artistId,
    coverUrl: ps.song.coverUrl,
    audioUrl: ps.song.audioUrl320 || ps.song.audioUrl128 || '',
    canvasUrl: ps.song.canvasUrl,
    duration: ps.song.duration,
  }));

  const handleMainPlay = () => {
    if (trackList.length === 0) return;
    if (currentContextId === id) {
      togglePlay();
    } else {
      setContextAndPlay(trackList, 0, id);
    }
  };

  const handleTrackPlay = (index: number) => {
    // Nếu đang phát bài hát CHÍNH XÁC ID này trong context này thì Pause
    if (currentContextId === id && currentTrack?.id === trackList[index].id) {
      togglePlay();
    } else {
      setContextAndPlay(trackList, index, id);
    }
  };

  const handleUpdatePlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.patch(`/playlists/${id}`, editForm);
      // Xóa cache để Reload data mới nhất
      queryClient.invalidateQueries({ queryKey: ['playlist', id] });
      setIsEditing(false);
      toast.success('Đã cập nhật playlist thành công');
    } catch (e: any) {
      console.error('Failed to update playlist:', e);
      toast.error(e?.response?.data?.message || 'Có lỗi khi cập nhật playlist');
    } finally {
      setSaving(false);
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCover(true);
    try {
      const formData = new FormData();
      formData.append('cover', file);
      const res = await api.patch(`/playlists/${id}/cover`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      }) as any;
      const newUrl = res.data.coverUrl;
      setEditForm((prev: any) => ({ ...prev, coverUrl: newUrl }));
      queryClient.invalidateQueries({ queryKey: ['playlist', id] });
    } catch (e) {
      console.error('Failed to upload cover:', e);
    } finally {
      setUploadingCover(false);
    }
  };

  const isOwner = playlist.ownerId === user?.id;
  const isCollaborator = playlist.collaborators?.some((c: any) => c.userId === user?.id);
  const canManageItems = isOwner || isCollaborator;

  const handleRemoveFromPlaylist = async (songId: string) => {
    if (!id) return;
    try {
      await removeSongFromPlaylist(id, songId);
      // Invalidate query để cập nhật UI ngay lập tức
      queryClient.invalidateQueries({ queryKey: ['playlist', id] });
    } catch (err) {
      console.error('Failed to remove song:', err);
    }
  };

  return (
    <div className="flex-1 w-full min-h-full overflow-y-auto relative isolate text-white">
      {/* Dynamic Header Gradient Background */}
      <div
        className="absolute inset-0 pointer-events-none transition-colors duration-1000 ease-in-out -z-10 h-[400px]"
        style={{
          background: `linear-gradient(to bottom, ${dominantColor} 0%, #121212 100%)`
        }}
      ></div>

      {/* Header Info */}
      <div className="flex items-end gap-6 px-6 pt-24 pb-6 w-full max-w-screen-2xl mx-auto">
        <div
          className={cn(
            "relative group flex-shrink-0 shadow-[0_8px_40px_rgba(0,0,0,0.5)]",
            isOwner && "cursor-pointer"
          )}
          onClick={() => isOwner && setIsEditing(true)}
        >
          <img
            src={playlist.coverUrl || 'https://community.spotify.com/t5/image/serverpage/image-id/25294i2836BD1C1A33BE2E/image-size/large?v=v2&px=999'}
            alt={playlist.title}
            className="w-[232px] h-[232px] object-cover"
          />
          {isOwner && (
            <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Edit2 size={48} className="text-white mb-2" />
              <span className="text-white text-sm font-bold">Chọn ảnh</span>
            </div>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold">Danh sách phát</span>
            <span className={cn(
              "text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider",
              playlist.isPublic ? "bg-[#1db954]/20 text-[#1db954] border border-[#1db954]/30" : "bg-white/10 text-[#b3b3b3] border border-white/20"
            )}>
              {playlist.isPublic ? "Công khai" : "Riêng tư"}
            </span>
            {playlist.isCollaborative && (
              <span className="text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider bg-blue-500/20 text-blue-400 border border-blue-500/30">
                Collaborative
              </span>
            )}
          </div>
          <div className="relative group/title">
            <h1
              className={cn(
                "text-5xl md:text-7xl font-bold tracking-tighter mb-2 line-clamp-2",
                isOwner && "cursor-pointer"
              )}
              onClick={() => isOwner && setIsEditing(true)}
            >
              {playlist.title}
            </h1>
          </div>
          <p className="text-sm text-[#b3b3b3]">{playlist.description}</p>
          <div className="flex items-center gap-1 text-sm mt-1">
            <span className="font-bold hover:underline cursor-pointer">{playlist.owner?.name}</span>
            <span className="text-[#b3b3b3] px-1">•</span>
            <span className="text-[#b3b3b3]">{playlist.songs.length} bài hát</span>
          </div>
        </div>
      </div>

      {/* Background layer 2 (dark gradient fading down) */}
      <div
        className="absolute inset-x-0 w-full top-[340px] bottom-0 pointer-events-none -z-10"
        style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, #121212 250px)' }}
      ></div>

      {/* Actions */}
      <div className="px-6 py-6 flex items-center gap-6 w-full max-w-screen-2xl mx-auto relative z-10">
        <button
          onClick={handleMainPlay}
          className="w-14 h-14 flex items-center justify-center rounded-full bg-[#1db954] text-black shadow-xl hover:scale-105 hover:bg-[#1ed760] transition-all duration-300"
        >
          {isThisPlaying ? <Pause size={28} className="fill-current" /> : <Play size={28} className="fill-current ml-1" />}
        </button>
        <button
          onClick={() => id && toggleFollowPlaylist(id, playlist.title)}
          className={`transition-colors ${playlistFollowed ? 'text-[#1db954]' : 'text-[#b3b3b3] hover:text-white'
            }`}
          title={playlistFollowed ? 'Xóa khỏi thư viện' : 'Lưu vào thư viện'}
        >
          <Heart size={32} className={playlistFollowed ? 'fill-[#1db954]' : ''} />
        </button>
        <button
          onClick={(e) => openPlaylistMenu(e, { ...playlist, ownerId: playlist.ownerId })}
          className="text-[#b3b3b3] hover:text-white transition-colors"
        >
          <MoreHorizontal size={32} />
        </button>
        {isOwner && playlist.isCollaborative && (
          <button
            onClick={() => setShowCollaborators(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/20 hover:border-white transition-all text-sm font-bold ml-auto"
          >
            <UserPlus size={20} />
            Mời người khác
          </button>
        )}
      </div>

      {/* Tracks Table */}
      <div className="px-6 pb-28 w-full max-w-screen-2xl mx-auto relative z-10">
        <div className={cn(
          "grid gap-4 px-4 py-2 border-b border-[#ffffff1a] text-[#b3b3b3] text-sm font-medium",
          playlist.isCollaborative 
            ? "grid-cols-[16px_minmax(120px,4fr)_minmax(120px,2fr)_minmax(120px,1.5fr)_minmax(120px,1fr)]" 
            : "grid-cols-[16px_minmax(120px,4fr)_minmax(120px,2fr)_minmax(120px,1fr)]"
        )}>
          <div className="text-center">#</div>
          <div>Tiêu đề</div>
          <div className="hidden md:block">Lượt nghe</div>
          {playlist.isCollaborative && <div className="hidden lg:block">Người thêm</div>}
          <div className="flex justify-end pr-8"><Clock size={16} /></div>
        </div>

        <div className="mt-4 flex flex-col gap-1">
          {playlist.songs.map((item: any, index: number) => {
            const track = item.song;
            const isRowPlaying = currentContextId === id && currentTrack?.id === track.id;

            return (
              <div
                key={item.songId}
                className={cn(
                  "grid gap-4 px-4 py-2 rounded-md hover:bg-white/10 group cursor-pointer text-[#b3b3b3] items-center",
                  playlist.isCollaborative 
                    ? "grid-cols-[16px_minmax(120px,4fr)_minmax(120px,2fr)_minmax(120px,1.5fr)_minmax(120px,1fr)]" 
                    : "grid-cols-[16px_minmax(120px,4fr)_minmax(120px,2fr)_minmax(120px,1fr)]"
                )}
                onDoubleClick={() => handleTrackPlay(index)}
                onContextMenu={(e) => openTrackMenu(e, { ...track, artistName: track.artist.stageName })}
              >
                {/* Chỗ này sẽ chuyển từ số thành Nút play khi hover */}
                <div className="text-base flex items-center justify-center w-full">
                  <div className="group-hover:hidden text-center w-full">
                    {isRowPlaying ? (
                      isPlaying ? (
                        <img src="https://open.spotifycdn.com/cdn/images/equaliser-animated-green.f93a2ef4.gif" className="w-3 h-3 mx-auto" alt="playing" />
                      ) : (
                        <span className="text-[#1db954]">{index + 1}</span>
                      )
                    ) : (
                      index + 1
                    )}
                  </div>
                  <div className="hidden group-hover:flex items-center justify-center w-full text-white">
                    <button onClick={(e) => { e.stopPropagation(); handleTrackPlay(index); }}>
                      {isRowPlaying && isPlaying ? <Pause size={14} className="fill-current" /> : <Play size={14} className="fill-current ml-1" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-3 overflow-hidden">
                  <img src={track.coverUrl} alt={track.title} className="w-10 h-10 object-cover flex-shrink-0 rounded shadow" />
                  <div className="flex flex-col truncate">
                    <span className={cn("text-base truncate font-medium", isRowPlaying ? "text-[#1db954]" : "text-white")}>{track.title}</span>
                    <Link to={`/artist/${track.artistId}`} onClick={(e) => e.stopPropagation()} className="text-sm truncate hover:underline hover:text-white inline-block">
                      {track.artist.stageName}
                    </Link>
                  </div>
                </div>

                <div className="hidden md:flex items-center text-sm truncate">
                  {track.playCount.toLocaleString()}
                </div>

                {playlist.isCollaborative && (
                  <div className="hidden lg:flex items-center gap-2 overflow-hidden">
                    {item.addedByUser && (
                      <>
                        <img src={item.addedByUser.avatarUrl || 'https://www.gravatar.com/avatar/?d=mp'} alt={item.addedByUser.name} className="w-5 h-5 rounded-full object-cover flex-shrink-0" />
                        <span className="text-xs truncate hover:underline cursor-pointer">{item.addedByUser.name}</span>
                      </>
                    )}
                  </div>
                )}

                <div className="flex justify-end items-center gap-4 pr-4 text-sm">
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleLike(track.id, track.title); }}
                    className={`opacity-0 group-hover:opacity-100 transition-opacity ${isLiked(track.id) ? 'text-[#1db954]' : 'text-[#b3b3b3] hover:text-white'
                      }`}
                  >
                    <Heart size={16} className={isLiked(track.id) ? 'fill-[#1db954]' : ''} />
                  </button>
                  {formatTime(track.duration)}
                  <button
                    onClick={(e) => { e.stopPropagation(); openTrackMenu(e, { ...track, artistName: track.artist.stageName }); }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-[#b3b3b3] hover:text-white p-1"
                  >
                    <MoreHorizontal size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Edit Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
          <div className="bg-[#282828] w-full max-w-[524px] rounded-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 pb-0">
              <h2 className="text-2xl font-bold">Sửa chi tiết</h2>
              <button onClick={() => setIsEditing(false)} className="text-[#b3b3b3] hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleUpdatePlaylist} className="p-6 space-y-4">
              <div className="flex gap-4">
                <div className="relative group w-48 h-48 bg-[#333] shadow-lg flex-shrink-0">
                  <img
                    src={editForm.coverUrl || 'https://community.spotify.com/t5/image/serverpage/image-id/25294i2836BD1C1A33BE2E/image-size/large?v=v2&px=999'}
                    className="w-full h-full object-cover"
                    alt=""
                  />
                  <label className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    {uploadingCover ? <Loader2 className="animate-spin text-white" /> : <Camera size={48} className="text-white" />}
                    <span className="text-xs text-white font-bold mt-2">Chọn ảnh</span>
                    <input type="file" className="hidden" accept="image/*" onChange={handleCoverUpload} />
                  </label>
                </div>

                <div className="flex-1 space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#b3b3b3]">Tên</label>
                    <input
                      className="w-full bg-[#3e3e3e] border-none rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-white/20"
                      value={editForm.title}
                      onChange={e => setEditForm((p: any) => ({ ...p, title: e.target.value }))}
                      placeholder="Thêm tên"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#b3b3b3]">Mô tả</label>
                    <textarea
                      className="w-full bg-[#3e3e3e] border-none rounded px-3 py-2 text-sm h-28 focus:outline-none focus:ring-1 focus:ring-white/20 resize-none"
                      value={editForm.description}
                      onChange={e => setEditForm((p: any) => ({ ...p, description: e.target.value }))}
                      placeholder="Thêm mô tả tùy chọn"
                    />
                  </div>
                  {isOwner && !playlist.isSystem && (
                    <div className="flex items-center justify-between p-3 bg-white/5 rounded border border-white/10">
                      <div>
                        <p className="text-sm font-bold">Chế độ cộng tác</p>
                        <p className="text-xs text-[#b3b3b3]">Cho phép người khác thêm/xóa bài hát.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setEditForm((p: any) => ({ ...p, isCollaborative: !p.isCollaborative }))}
                        className={cn(
                          "w-12 h-6 rounded-full relative transition-colors duration-200",
                          editForm.isCollaborative ? "bg-[#1db954]" : "bg-[#727272]"
                        )}
                      >
                        <div className={cn(
                          "absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-200",
                          editForm.isCollaborative ? "left-7" : "left-1"
                        )} />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-white text-black font-bold px-8 py-3 rounded-full hover:scale-105 transition-transform disabled:opacity-50"
                >
                  {saving ? 'Đang lưu...' : 'Lưu'}
                </button>
              </div>
              <p className="text-[10px] text-[#b3b3b3] leading-tight mt-4">
                Bằng cách tiếp tục, bạn đồng ý cho phép sếp tải hình ảnh lên dịch vụ của mình. Vui lòng đảm bảo sếp có quyền tải hình ảnh này lên.
              </p>
            </form>
          </div>
        </div>
      )}

      {trackMenu && (
        <SongContextMenu
          song={trackMenu.song}
          position={trackMenu.position}
          onClose={closeTrackMenu}
          onPlay={() => {
            const idx = playlist.songs.findIndex((s: any) => s.song.id === trackMenu.song.id);
            if (idx !== -1) handleTrackPlay(idx);
          }}
          onRemoveFromPlaylist={canManageItems ? () => handleRemoveFromPlaylist(trackMenu.song.id) : undefined}
        />
      )}
      {playlistMenu && (
        <PlaylistContextMenu
          playlist={playlistMenu.playlist}
          position={playlistMenu.position}
          onClose={closePlaylistMenu}
          onRename={() => setIsEditing(true)}
        />
      )}

      {showCollaborators && (
        <CollaboratorModal
          playlistId={id!}
          collaborators={playlist.collaborators}
          ownerId={playlist.ownerId}
          currentUserId={user?.id || ''}
          onClose={() => setShowCollaborators(false)}
        />
      )}
    </div>
  );
};
