import { Search, X, Clock, Database, Activity } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { useRecentSearch } from '../../hooks/useRecentSearch';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export const SearchInput = () => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any>(null);
  const [showPopup, setShowPopup] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const { recentSearches, addItem, removeItem, clearAll } = useRecentSearch();

  const isSearchPage = location.pathname === '/search';

  const handleClear = () => {
    setQuery('');
    setSuggestions(null);
    setShowPopup(false);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  useEffect(() => {
    if (!isSearchPage) {
      setQuery('');
      setSuggestions(null);
      setShowPopup(false);
    }
  }, [isSearchPage]);

  // Handle Fetching Suggestions
  useEffect(() => {
    const handler = setTimeout(async () => {
      if (query.trim() !== '') {
        try {
          const res = await api.get(`/search?q=${encodeURIComponent(query)}`) as any;
          setSuggestions(res.data);
          setShowPopup(true);
        } catch (error) {
          console.error(error);
        }
      } else {
        setSuggestions(null);
        if (inputRef.current === document.activeElement) {
          setShowPopup(true);
        }
      }
    }, 300);
    return () => clearTimeout(handler);
  }, [query]);

  const handleSearch = (searchTerm: string) => {
    const trimmed = searchTerm.trim();
    if (!trimmed) return;

    const searchParams = new URLSearchParams(location.search);
    searchParams.set('q', trimmed);
    navigate({ search: searchParams.toString() }, { replace: true });

    addItem({
      id: `query-${trimmed}`,
      type: 'query',
      title: trimmed,
    });

    setShowPopup(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch(query);
    }
  };

  const highlightText = (text: string, highlight: string) => {
    if (!highlight.trim()) return text;
    const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) =>
          part.toLowerCase() === highlight.toLowerCase() ? (
            <span key={i} className="text-[#1db954] font-black">{part}</span>
          ) : (
            <span key={i} className="text-white/40">{part}</span>
          )
        )}
      </span>
    );
  };

  if (!isSearchPage) {
    return null;
  }

  return (
    <div className="relative group selection:bg-[#1db954] selection:text-black w-full min-w-[480px] max-w-[480px]">
      <div className={cn(
        "flex h-12 w-full items-center bg-[#050505] px-4 border transition-all duration-500",
        showPopup ? "border-[#1db954]" : "border-white/10 hover:border-white/30"
      )}>
        <Search className={cn("h-4 w-4 transition-colors", showPopup ? "text-[#1db954]" : "text-white/20")} />
        <input
          ref={inputRef}
          type="text"
          placeholder="ENTER_QUERY_SIGNAL..."
          className="h-full w-full bg-transparent px-4 text-xs font-black uppercase tracking-widest text-white placeholder-white/20 outline-none"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowPopup(true)}
          onBlur={() => setTimeout(() => setShowPopup(false), 200)}
        />
        <div className="flex items-center gap-2">
           {query && (
             <button onClick={handleClear} className="text-white/20 hover:text-white transition-colors">
               <X className="h-4 w-4" />
             </button>
           )}
           <div className={cn("w-1.5 h-1.5 rounded-full transition-colors", showPopup ? "bg-[#1db954] animate-pulse" : "bg-white/10")} />
        </div>
      </div>

      {/* Suggestion & Recent Search Popup */}
      <AnimatePresence>
        {showPopup && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute top-[calc(100%+8px)] left-0 w-full bg-[#050505] border border-white/10 shadow-[0_30px_60px_rgba(0,0,0,0.8)] z-50 p-0 overflow-hidden backdrop-blur-md"
          >
            {/* Case 1: Recent Searches */}
            {!query.trim() && (
              <div className="flex flex-col">
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-white/[0.02]">
                  <div className="flex items-center gap-3">
                     <Clock size={12} className="text-[#1db954]" />
                     <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">Recent_History_Buffer</span>
                  </div>
                  {recentSearches.length > 0 && (
                    <button onClick={(e) => { e.preventDefault(); clearAll(); }} className="text-[9px] font-black uppercase tracking-widest text-white/20 hover:text-[#1db954] transition-colors">WIPE_ALL</button>
                  )}
                </div>
                <div className="max-h-[400px] overflow-y-auto no-scrollbar">
                  {recentSearches.length === 0 ? (
                    <div className="px-6 py-10 text-center">
                       <p className="text-[9px] font-black uppercase tracking-[0.5em] text-white/10 italic">Empty_Search_History</p>
                    </div>
                  ) : (
                    recentSearches.map((item) => (
                      <div 
                        key={`${item.type}-\s*${item.id}`} 
                        className="group flex items-center gap-4 px-6 py-4 border-b border-white/5 hover:bg-white transition-all cursor-pointer relative"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          if (item.type === 'query') {
                            setQuery(item.title);
                            handleSearch(item.title);
                          } else {
                            navigate(`/${item.type}/${item.id}`);
                            setShowPopup(false);
                          }
                        }}
                      >
                        <div className="w-8 h-8 border border-white/10 overflow-hidden flex-shrink-0 flex items-center justify-center bg-white/[0.02] group-hover:bg-black/5">
                          {item.type === 'query' ? (
                            <Search className="h-4 w-4 text-white/20 group-hover:text-[#1db954] transition-colors" />
                          ) : (
                            <img src={item.coverUrl} className={cn("w-full h-full object-cover grayscale group-hover:grayscale-0", item.type === 'artist' && "rounded-full")} alt="" />
                          )}
                        </div>
                        <div className="flex-1 flex flex-col min-w-0">
                          <span className="text-[13px] font-black uppercase tracking-tighter truncate group-hover:text-black">{item.title}</span>
                          <span className={cn(
                            "text-[8px] font-black uppercase tracking-widest text-white/20 transition-colors",
                            item.type === 'query' ? "group-hover:text-[#1db954]" : "group-hover:text-black/40"
                          )}>
                            {item.type.toUpperCase()}_UNIT
                          </span>
                        </div>
                        <button
                          onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); removeItem(item.id, item.type); }}
                          className="opacity-0 group-hover:opacity-100 p-1 text-black/20 hover:text-black transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Case 2: Autocomplete Suggestions */}
            {query.trim() && suggestions && (
              <div className="flex flex-col">
                 <div className="px-6 py-3 border-b border-white/5 flex items-center gap-3">
                    <Activity size={12} className="text-[#1db954]" />
                    <span className="text-[9px] font-black uppercase tracking-[0.4em] text-white/40">Real-time_Suggestion_Manifest</span>
                 </div>
                 <div className="max-h-[500px] overflow-y-auto no-scrollbar">
                    {/* Artists */}
                    {suggestions.artists?.slice(0, 3).map((artist: any) => (
                      <div 
                        key={`artist-${artist.id}`}
                        onMouseDown={(e) => { e.preventDefault(); navigate(`/artist/${artist.id}`); setShowPopup(false); }}
                        className="flex items-center gap-4 px-6 py-4 hover:bg-white transition-all cursor-pointer group border-b border-white/5"
                      >
                        <div className="w-10 h-10 rounded-full border border-white/10 overflow-hidden group-hover:border-black/10">
                           <img src={artist.avatarUrl} className="w-full h-full object-cover grayscale group-hover:grayscale-0" alt="" />
                        </div>
                        <div className="flex flex-col">
                           <span className="text-[14px] font-black uppercase tracking-tighter group-hover:text-black">{highlightText(artist.stageName, query)}</span>
                           <span className="text-[8px] font-black uppercase tracking-widest text-[#1db954] group-hover:text-black/40">Architect_Entity</span>
                        </div>
                      </div>
                    ))}
                    {/* Songs */}
                    {suggestions.songs?.slice(0, 8).map((song: any) => (
                      <div 
                        key={`song-${song.id}`}
                        onMouseDown={(e) => { e.preventDefault(); navigate(`/track/${song.id}`); setShowPopup(false); }}
                        className="flex items-center gap-4 px-6 py-4 hover:bg-white transition-all cursor-pointer group border-b border-white/5"
                      >
                        <div className="w-10 h-10 border border-white/10 overflow-hidden group-hover:border-black/10">
                           <img src={song.coverUrl} className="w-full h-full object-cover grayscale group-hover:grayscale-0" alt="" />
                        </div>
                        <div className="flex flex-col min-w-0">
                           <span className="text-[14px] font-black uppercase tracking-tighter truncate group-hover:text-black">{highlightText(song.title, query)}</span>
                           <span className="text-[8px] font-black uppercase tracking-widest text-white/20 group-hover:text-black/40">{song.artistName} // Transmission_Unit</span>
                        </div>
                      </div>
                    ))}
                 </div>
              </div>
            )}

            {/* Footer info */}
            <div className="px-6 py-3 border-t border-white/5 bg-white/[0.01] flex justify-between items-center">
               <span className="text-[7px] font-black uppercase tracking-widest text-white/10">Industrial_Discovery_Engine_v4</span>
               <Database size={10} className="text-white/5" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
