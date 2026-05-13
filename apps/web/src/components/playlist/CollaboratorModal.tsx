import React, { useState } from 'react';
import { X, Search, UserPlus, UserMinus, Loader2 } from 'lucide-react';
import { api } from '../../lib/api';
import { cn } from '../../lib/utils';
import { queryClient } from '../../lib/query-client';

interface CollaboratorModalProps {
  playlistId: string;
  collaborators: any[];
  ownerId: string;
  currentUserId: string;
  onClose: () => void;
}

export const CollaboratorModal: React.FC<CollaboratorModalProps> = ({
  playlistId,
  collaborators,
  ownerId,
  currentUserId,
  onClose
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const isOwner = currentUserId === ownerId;

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearching(true);
    try {
      const res = await api.get(`/search?q=${searchQuery}`) as any;
      // Chỉ lấy users và loại bỏ owner + những người đã là active collaborator
      const activeIds = collaborators
        .filter(c => c.status === 'ACTIVE')
        .map(c => c.userId);

      const filtered = (res.data.users || []).filter((u: any) =>
        u.id !== ownerId && !activeIds.includes(u.id)
      );
      setSearchResults(filtered);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setSearching(false);
    }
  };

  const handleInvite = async (userId: string) => {
    setLoadingAction(userId);
    try {
      await api.post(`/playlists/${playlistId}/collaborative/invite`, { userId });
      queryClient.invalidateQueries({ queryKey: ['playlist', playlistId] });
      // Reset search
      setSearchQuery('');
      setSearchResults([]);
    } catch (err) {
      console.error('Invite failed:', err);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleKick = async (userId: string) => {
    setLoadingAction(userId);
    try {
      await api.delete(`/playlists/${playlistId}/collaborative/kick/${userId}`);
      queryClient.invalidateQueries({ queryKey: ['playlist', playlistId] });
    } catch (err) {
      console.error('Kick failed:', err);
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      {/* Brutalist Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Noise overlay */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay z-0 bg-noise" />

      <div className="relative w-full max-w-[540px] bg-black border border-[#1db954]/30 shadow-[0_0_50px_-12px_rgba(29,185,84,0.15)] overflow-hidden animate-in fade-in zoom-in-95 duration-300 isolate group/modal">

        {/* Animated Corner Markers */}
        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-[#1db954] opacity-50 group-hover/modal:w-12 group-hover/modal:h-12 transition-all duration-500" />
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-[#1db954] opacity-50 group-hover/modal:w-12 group-hover/modal:h-12 transition-all duration-500" />

        {/* Scanline Effect */}
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] z-50" />

        <div className="flex items-start justify-between p-8 pb-6 border-b border-white/5 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-[#1db954] animate-pulse" />
              <span className="text-[8px] font-black uppercase tracking-[0.4em] text-[#1db954]">Protocol_Active</span>
            </div>
            <h2 className="text-2xl font-black uppercase tracking-tighter italic text-white">Collaborator_Registry</h2>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:border-[#1db954] hover:bg-[#1db954]/10 transition-all group"
          >
            <X size={20} className="group-hover:rotate-90 transition-transform duration-300" />
          </button>
        </div>

        <div className="p-8 space-y-8 relative z-10">
          {/* Search Box (Only for Owner) */}
          {isOwner && (
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Query_Entity</p>
                {searching && <Loader2 size={12} className="animate-spin text-[#1db954]" />}
              </div>
              <form onSubmit={handleSearch} className="relative group">
                <div className="absolute inset-y-0 left-0 w-12 flex items-center justify-center border-r border-white/10 group-focus-within:border-[#1db954] transition-colors">
                  <Search size={16} className="text-white/40 group-focus-within:text-[#1db954] transition-colors" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="INPUT_ALIAS_OR_ID..."
                  className="w-full bg-white/[0.02] border border-white/10 py-4 pl-16 pr-4 text-xs font-black tracking-widest text-white focus:border-[#1db954] outline-none transition-all placeholder:text-white/20 uppercase"
                />
              </form>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="mt-4 max-h-[160px] overflow-y-auto custom-scrollbar bg-black border border-[#1db954]/20 divide-y divide-white/5">
                  {searchResults.map((u: any) => (
                    <div key={u.id} className="flex items-center justify-between p-4 hover:bg-[#1db954]/5 transition-colors group/result">
                      <div className="flex items-center gap-4 overflow-hidden">
                        <div className="relative">
                          <img src={u.avatarUrl || 'https://www.gravatar.com/avatar/?d=mp'} className="w-10 h-10 object-cover grayscale group-hover/result:grayscale-0 transition-all duration-300 border border-white/10" alt="" />
                          <div className="absolute inset-0 bg-[#1db954]/20 opacity-0 group-hover/result:opacity-100 transition-opacity" />
                        </div>
                        <div className="overflow-hidden">
                          <span className="block text-xs font-black uppercase tracking-widest truncate">{u.name}</span>
                          <span className="block text-[8px] font-mono text-white/40 truncate">ID: {u.id.split('-')[0]}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleInvite(u.id)}
                        disabled={loadingAction === u.id}
                        className="w-10 h-10 border border-[#1db954]/30 flex items-center justify-center text-[#1db954] hover:bg-[#1db954] hover:text-black transition-all active:scale-95 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-[#1db954]"
                      >
                        {loadingAction === u.id ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Current Collaborators List */}
          <div className="space-y-4">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 flex items-center gap-2">
              <span className="w-full h-[1px] bg-white/10" />
              <span className="shrink-0">Authorized_Entities</span>
              <span className="w-full h-[1px] bg-white/10" />
            </p>

            <div className="space-y-2 max-h-[280px] overflow-y-auto custom-scrollbar pr-2">
              {/* Always show Owner first */}
              <div className="flex items-center justify-between p-3 border border-white/5 bg-white/[0.02] hover:border-white/20 transition-all group/item">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <img src={collaborators[0]?.playlist?.owner?.avatarUrl || 'https://www.gravatar.com/avatar/?d=mp'} className="w-12 h-12 object-cover border border-[#1db954]/30" alt="" />
                    <div className="absolute -bottom-2 -right-2 bg-[#1db954] text-black w-5 h-5 flex items-center justify-center text-[10px] font-black shadow-lg">
                      O
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-black uppercase tracking-widest text-[#1db954]">OWNER_NODE</p>
                    <p className="text-[9px] font-mono text-white/40 uppercase tracking-widest">Sys_Admin</p>
                  </div>
                </div>
              </div>

              {collaborators.map((collab) => (
                <div key={collab.id} className="flex items-center justify-between p-3 border border-white/5 bg-black hover:border-white/20 transition-all group/item">
                  <div className="flex items-center gap-4 overflow-hidden">
                    <div className="relative">
                      <img
                        src={collab.user.avatarUrl || 'https://www.gravatar.com/avatar/?d=mp'}
                        className={cn(
                          "w-12 h-12 object-cover transition-all duration-300",
                          collab.status === 'KICKED' ? "opacity-30 grayscale border border-red-500/30" : "grayscale group-hover/item:grayscale-0 border border-white/10"
                        )}
                        alt=""
                      />
                    </div>
                    <div className="overflow-hidden">
                      <p className={cn(
                        "text-xs font-black uppercase tracking-widest truncate",
                        collab.status === 'KICKED' ? "text-red-500/50 line-through" : "text-white"
                      )}>
                        {collab.user.name}
                      </p>
                      <p className="text-[9px] font-mono uppercase tracking-widest mt-1">
                        {collab.status === 'ACTIVE'
                          ? <span className="text-[#1db954]">Status: ACTIVE</span>
                          : <span className="text-red-500/50">Status: REVOKED</span>
                        }
                      </p>
                    </div>
                  </div>

                  {isOwner && collab.status === 'ACTIVE' && (
                    <button
                      onClick={() => handleKick(collab.user.id)}
                      disabled={loadingAction === collab.user.id}
                      className="opacity-0 group-hover/item:opacity-100 w-10 h-10 border border-red-500/30 flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-black transition-all active:scale-95 disabled:opacity-30"
                      title="Revoke Access"
                    >
                      {loadingAction === collab.user.id ? <Loader2 size={16} className="animate-spin" /> : <UserMinus size={16} />}
                    </button>
                  )}

                  {isOwner && collab.status === 'KICKED' && (
                    <button
                      onClick={() => handleInvite(collab.user.id)}
                      disabled={loadingAction === collab.user.id}
                      className="opacity-0 group-hover/item:opacity-100 w-10 h-10 border border-[#1db954]/30 flex items-center justify-center text-[#1db954] hover:bg-[#1db954] hover:text-black transition-all active:scale-95 disabled:opacity-30"
                      title="Re-authorize"
                    >
                      {loadingAction === collab.user.id ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
                    </button>
                  )}
                </div>
              ))}

              {collaborators.length === 0 && (
                <div className="py-12 border border-dashed border-white/10 flex items-center justify-center">
                  <p className="text-[10px] font-mono text-white/30 uppercase tracking-[0.2em]">No_Entities_Found</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-4 bg-white/[0.02] border-t border-white/5 relative z-10 flex justify-between items-center">
          <p className="text-[8px] font-mono text-[#1db954]/60 uppercase tracking-[0.2em] leading-relaxed max-w-[80%]">
            * Warning: Authorized entities have WRITE access to playlist_matrix. Modifications are permanently logged.
          </p>
          <div className="w-2 h-2 bg-[#1db954] animate-ping opacity-50" />
        </div>
      </div>
    </div>
  );
};
