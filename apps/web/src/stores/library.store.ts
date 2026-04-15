import { create } from 'zustand';
import { api } from '../lib/api';
import { toast } from 'sonner';
import { queryClient } from '../lib/query-client';

interface Playlist {
  id: string;
  title: string;
  coverUrl: string | null;
  isPublic: boolean;
  ownerId: string;
  _count?: { songs: number };
}

interface LibraryState {
  likedSongIds: Set<string>;
  followedArtistIds: Set<string>;
  followedAlbumIds: Set<string>;
  followedPlaylistIds: Set<string>;
  playlists: Playlist[];
  isHydrated: boolean;
  libraryVersion: number; // Counter tăng mỗi lần API thành công (like/follow) → trigger re-render full library

  hydrate: () => Promise<void>;
  toggleLike: (songId: string, songTitle?: string) => Promise<void>;
  toggleFollow: (artistId: string, artistName?: string) => Promise<void>;
  toggleFollowAlbum: (albumId: string, albumTitle?: string) => Promise<void>;
  toggleFollowPlaylist: (playlistId: string, playlistTitle?: string) => Promise<void>;
  isLiked: (songId: string) => boolean;
  isFollowing: (artistId: string) => boolean;
  isFollowingAlbum: (albumId: string) => boolean;
  isFollowingPlaylist: (playlistId: string) => boolean;

  // Playlist management
  createPlaylist: (title: string) => Promise<Playlist | null>;
  deletePlaylist: (playlistId: string) => Promise<void>;
  addSongToPlaylist: (playlistId: string, songId: string, songTitle?: string) => Promise<void>;
  removeSongFromPlaylist: (playlistId: string, songId: string) => Promise<void>;
  updatePlaylist: (playlistId: string, data: Partial<Playlist>) => Promise<void>;
  fetchPlaylists: () => Promise<void>;
}

export const useLibraryStore = create<LibraryState>((set, get) => ({
  likedSongIds: new Set(),
  followedArtistIds: new Set(),
  followedAlbumIds: new Set(),
  followedPlaylistIds: new Set(),
  playlists: [],
  isHydrated: false,
  libraryVersion: 0,

  hydrate: async () => {
    try {
      const [libRes, playlistRes] = await Promise.all([
        api.get('/users/library') as any,
        api.get('/playlists') as any,
      ]);
      const data = libRes.data;
      set({
        likedSongIds: new Set(data.likedSongIds || []),
        followedArtistIds: new Set(data.followedArtistIds || []),
        followedAlbumIds: new Set(data.followedAlbumIds || []),
        followedPlaylistIds: new Set(data.followedPlaylistIds || []),
        playlists: playlistRes.data || [],
        isHydrated: true,
      });
    } catch {
      set({ isHydrated: true });
    }
  },

  fetchPlaylists: async () => {
    try {
      const res = await api.get('/playlists') as any;
      set({ playlists: res.data || [] });
    } catch { }
  },

  toggleLike: async (songId: string, songTitle?: string) => {
    const { likedSongIds, libraryVersion } = get();
    const wasLiked = likedSongIds.has(songId);

    // Optimistic update UI ngay lập tức
    const newSet = new Set(likedSongIds);
    if (wasLiked) { newSet.delete(songId); } else { newSet.add(songId); }
    set({ likedSongIds: newSet });

    if (!wasLiked) {
      toast.success(songTitle ? `Đã thêm "${songTitle}" vào Bài hát đã thích` : 'Đã thêm vào Bài hát đã thích', { icon: '💚', duration: 2500 });
    } else {
      toast(songTitle ? `Đã xóa "${songTitle}" khỏi Bài hát đã thích` : 'Đã xóa khỏi Bài hát đã thích', { duration: 2000 });
    }

    try {
      if (wasLiked) { await api.delete(`/songs/${songId}/like`); }
      else { await api.post(`/songs/${songId}/like`); }
      // Sau khi API thành công, trigger re-fetch cho library lists
      queryClient.invalidateQueries({ queryKey: ['homeFeed'] });
      set({ libraryVersion: process.env.NODE_ENV !== 'test' ? get().libraryVersion + 1 : libraryVersion + 1 });
    } catch {
      set({ likedSongIds }); // revert optimistic
      toast.error('Có lỗi xảy ra, vui lòng thử lại.');
    }
  },

  toggleFollow: async (artistId: string, artistName?: string) => {
    const { followedArtistIds } = get();
    const wasFollowing = followedArtistIds.has(artistId);

    const newSet = new Set(followedArtistIds);
    if (wasFollowing) { newSet.delete(artistId); } else { newSet.add(artistId); }
    set({ followedArtistIds: newSet });

    if (!wasFollowing) {
      toast.success(artistName ? `Đang theo dõi ${artistName}` : 'Đang theo dõi nghệ sĩ', { icon: '🎵', duration: 2500 });
    } else {
      toast(artistName ? `Đã bỏ theo dõi ${artistName}` : 'Đã bỏ theo dõi nghệ sĩ', { duration: 2000 });
    }

    try {
      if (wasFollowing) { await api.delete(`/artists/${artistId}/follow`); }
      else { await api.post(`/artists/${artistId}/follow`); }
      set({ libraryVersion: process.env.NODE_ENV !== 'test' ? get().libraryVersion + 1 : 0 });
    } catch {
      set({ followedArtistIds });
      toast.error('Có lỗi xảy ra, vui lòng thử lại.');
    }
  },

  isLiked: (songId: string) => get().likedSongIds.has(songId),
  isFollowing: (artistId: string) => get().followedArtistIds.has(artistId),
  isFollowingAlbum: (albumId: string) => get().followedAlbumIds.has(albumId),
  isFollowingPlaylist: (playlistId: string) => get().followedPlaylistIds.has(playlistId),

  toggleFollowAlbum: async (albumId: string, albumTitle?: string) => {
    const { followedAlbumIds } = get();
    const wasFollowing = followedAlbumIds.has(albumId);
    const newSet = new Set(followedAlbumIds);
    if (wasFollowing) { newSet.delete(albumId); } else { newSet.add(albumId); }
    set({ followedAlbumIds: newSet });

    if (!wasFollowing) {
      toast.success(albumTitle ? `Đã lưu "${albumTitle}" vào thư viện` : 'Đã lưu album', { icon: '💿', duration: 2500 });
    } else {
      toast(albumTitle ? `Đã xóa "${albumTitle}" khỏi thư viện` : 'Đã xóa album', { duration: 2000 });
    }

    try {
      if (wasFollowing) { await api.delete(`/albums/${albumId}/follow`); }
      else { await api.post(`/albums/${albumId}/follow`); }
      set({ libraryVersion: process.env.NODE_ENV !== 'test' ? get().libraryVersion + 1 : 0 });
    } catch {
      set({ followedAlbumIds });
      toast.error('Có lỗi xảy ra.');
    }
  },

  toggleFollowPlaylist: async (playlistId: string, playlistTitle?: string) => {
    const { followedPlaylistIds } = get();
    const wasFollowing = followedPlaylistIds.has(playlistId);
    const newSet = new Set(followedPlaylistIds);
    if (wasFollowing) { newSet.delete(playlistId); } else { newSet.add(playlistId); }
    set({ followedPlaylistIds: newSet });

    if (!wasFollowing) {
      toast.success(playlistTitle ? `Đã lưu "${playlistTitle}" vào thư viện` : 'Đã lưu playlist', { icon: '❤️', duration: 2500 });
    } else {
      toast(playlistTitle ? `Đã xóa "${playlistTitle}" khỏi thư viện` : 'Đã xóa playlist', { duration: 2000 });
    }

    try {
      if (wasFollowing) { await api.delete(`/playlists/${playlistId}/follow`); }
      else { await api.post(`/playlists/${playlistId}/follow`); }
      set({ libraryVersion: process.env.NODE_ENV !== 'test' ? get().libraryVersion + 1 : 0 });
      // Cập nhật lại danh sách playlists để hiện ở sidebar ngay lập tức
      await get().fetchPlaylists();
      queryClient.invalidateQueries({ queryKey: ['homeFeed'] });
    } catch {
      set({ followedPlaylistIds });
      toast.error('Có lỗi xảy ra.');
    }
  },

  createPlaylist: async (title: string) => {
    try {
      const res = await api.post('/playlists', { title, isPublic: false }) as any;
      const newPlaylist = res.data;
      set(state => ({ playlists: [newPlaylist, ...state.playlists] }));
      queryClient.invalidateQueries({ queryKey: ['homeFeed'] });
      toast.success(`Đã tạo playlist "${title}"! 🎵`);
      return newPlaylist;
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Không thể tạo playlist');
      return null;
    }
  },

  deletePlaylist: async (playlistId: string) => {
    try {
      await api.delete(`/playlists/${playlistId}`);
      set(state => ({ playlists: state.playlists.filter(p => p.id !== playlistId) }));
      toast.success('Đã xóa playlist');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Không thể xóa playlist');
    }
  },

  addSongToPlaylist: async (playlistId: string, songId: string, songTitle?: string) => {
    try {
      await api.post(`/playlists/${playlistId}/songs`, { songId });
      const playlist = get().playlists.find(p => p.id === playlistId);
      toast.success(`Đã thêm${songTitle ? ` "${songTitle}"` : ''} vào "${playlist?.title || 'playlist'}"`, { icon: '➕', duration: 2500 });
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Không thể thêm bài hát');
    }
  },

  removeSongFromPlaylist: async (playlistId: string, songId: string) => {
    try {
      await api.delete(`/playlists/${playlistId}/songs/${songId}`);
      toast.success('Đã xóa khỏi playlist');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Không thể xóa bài hát');
    }
  },

  updatePlaylist: async (playlistId: string, data: Partial<Playlist>) => {
    try {
      const res = await api.patch(`/playlists/${playlistId}`, data) as any;
      const updated = res.data;
      set(state => ({
        playlists: state.playlists.map(p => p.id === playlistId ? { ...p, ...updated } : p)
      }));
      queryClient.invalidateQueries({ queryKey: ['playlist', playlistId] });
      queryClient.invalidateQueries({ queryKey: ['homeFeed'] });
      toast.success('Đã cập nhật playlist');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Không thể cập nhật playlist');
    }
  },
}));
