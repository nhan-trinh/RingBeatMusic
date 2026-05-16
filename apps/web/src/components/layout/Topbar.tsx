import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, User, Bell, LogOut, ShieldAlert, Mic2, Settings, Menu, Users, Cpu, Activity, Zap } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/auth.store';
import { useNotificationStore } from '../../stores/notification.store';
import { useUIStore } from '../../stores/ui.store';
import { cn } from '../../lib/utils';
import { SearchInput } from '../search/SearchInput';
import { NotificationPopover } from '../notification/NotificationPopover';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../lib/api';

export const Topbar = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { unreadCount } = useNotificationStore();
  const { toggleSidebar, isFriendActivityVisible, toggleFriendActivity } = useUIStore();
  const [showMenu, setShowMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  
  const notificationRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scrollContainer = document.getElementById('main-scroll');
    if (!scrollContainer) return;

    const handleScroll = () => {
      setIsScrolled(scrollContainer.scrollTop > 10);
    };

    scrollContainer.addEventListener('scroll', handleScroll);
    return () => scrollContainer.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className={cn(
      "sticky top-0 z-40 flex h-20 items-center justify-between flex-shrink-0 px-6 transition-all duration-500",
      isScrolled ? "bg-black border-b border-white/10" : "bg-transparent border-b border-transparent"
    )}>
      {/* ── Texture Overlay ── */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none mix-blend-overlay z-0 bg-noise" />

      {/* ── LEFT: NAVIGATION CONTROLS ── */}
      <div className="flex gap-4 items-center relative z-10">
        <button 
          onClick={toggleSidebar}
          className="flex h-10 w-10 items-center justify-center border border-white/10 text-white/40 hover:text-white hover:bg-[#1db954] hover:border-[#1db954] transition-all group"
          title="Toggle_Manifest_Navigation"
        >
          <Menu className="h-4 w-4" />
        </button>
        
        <div className="flex gap-1">
          <button 
            onClick={() => navigate(-1)}
            className="flex h-10 w-10 items-center justify-center border border-white/10 text-white/40 hover:text-black hover:bg-white transition-all"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button 
            onClick={() => navigate(1)}
            className="flex h-10 w-10 items-center justify-center border border-white/10 text-white/40 hover:text-black hover:bg-white transition-all"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* ── CENTER: SEARCH INTERFACE ── */}
      <div className="flex-1 flex justify-center px-8 relative z-10">
        <div className="w-full max-w-xl">
           <SearchInput />
        </div>
      </div>

      {/* ── RIGHT: SYSTEM CONTROLS ── */}
      <div className="flex items-center gap-6 relative z-10">
        {!user ? (
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/register')}
              className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 hover:text-white transition-all"
            >
              Initialize_Register
            </button>
            <button 
              onClick={() => navigate('/login')}
              className="px-6 py-2.5 border border-white bg-white text-black text-[10px] font-black uppercase tracking-[0.3em] hover:bg-black hover:text-white transition-all"
            >
              Auth_Protocol_Login
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-5">
            {/* Session Metadata */}
            <div className="hidden xl:flex flex-col items-end mr-2">
               <div className="flex items-center gap-2">
                  <Activity size={10} className="text-[#1db954]" />
                  <span className="text-[8px] font-black uppercase tracking-[0.3em] text-[#1db954]">Signal: Stable_v4.0</span>
               </div>
               <span className="text-[7px] font-black uppercase tracking-widest text-white/20 mt-0.5">{new Date().toLocaleTimeString()} // ID_{user.id.slice(0,4)}</span>
            </div>

            {/* Friend Activity */}
            <button 
              onClick={toggleFriendActivity}
              className={cn(
                "relative flex h-10 w-10 items-center justify-center border transition-all",
                isFriendActivityVisible 
                  ? "border-[#1db954] bg-[#1db954]/10 text-[#1db954]" 
                  : "border-white/10 text-white/40 hover:text-black hover:bg-white hover:border-white"
              )}
              title="Collective_Rhythm_Log"
            >
              <Users size={16} />
            </button>

            {/* Notification System */}
            <div className="relative flex items-center h-full" ref={notificationRef}>
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className={cn(
                  "relative flex h-10 w-10 items-center justify-center border transition-all",
                  showNotifications || unreadCount > 0
                    ? "border-white text-white" 
                    : "border-white/10 text-white/40 hover:text-black hover:bg-white hover:border-white"
                )}
              >
                <Bell size={16} />
                {unreadCount > 0 && (
                  <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center bg-[#1DB954] text-black text-[11px] font-black shadow-none border border-black animate-pulse">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 15 }}
                    transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                    className="absolute top-[calc(100%+12px)] right-0 z-50"
                  >
                    <NotificationPopover />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* User Terminal Interface */}
            <div className="relative flex items-center h-full" ref={menuRef}>
              <button 
                onClick={() => setShowMenu(!showMenu)}
                className={cn(
                  "flex items-center gap-3 pl-2 pr-4 py-1.5 border transition-all group bg-[#050505]",
                  showMenu ? "border-white" : "border-white/10 hover:border-white/40"
                )}
              >
                <div className="h-8 w-8 overflow-hidden grayscale group-hover:grayscale-0 transition-all border border-white/10">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full bg-white/5 flex items-center justify-center">
                       <User size={14} className="text-white/20" />
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-start text-left">
                   <span className="text-[11px] font-black uppercase tracking-tighter leading-none mb-1 text-white">{user.name}</span>
                   <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 bg-[#1db954] rounded-full" />
                      <span className="text-[7px] font-black uppercase tracking-[0.3em] leading-none text-white/30">User_Verified</span>
                   </div>
                </div>
              </button>
              
              <AnimatePresence>
                {showMenu && (
                  <motion.div 
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 15 }}
                    transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                    className="absolute top-[calc(100%+12px)] right-0 w-64 bg-[#050505] border-2 border-white/20 shadow-[20px_20px_60px_rgba(0,0,0,0.8)] z-50 overflow-hidden isolate"
                  >
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay z-0 bg-noise" />
                    
                    <div className="px-5 py-5 border-b border-white/10 bg-white/[0.03] relative z-10">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-2 h-[1px] bg-[#1db954]" />
                        <span className="text-[8px] font-black uppercase tracking-[0.4em] text-[#1db954]">Access_Override_Control</span>
                      </div>
                      <p className="text-[14px] font-black text-white uppercase tracking-tighter truncate leading-none mb-1">{user.name}</p>
                      <p className="text-[9px] font-black text-white/20 tracking-widest truncate uppercase italic">{user.email}</p>
                    </div>
                    
                    <div className="flex flex-col py-2 relative z-10">
                      <MenuLink to="/profile" icon={<User size={14} />} label="Extract_Profile" index="PF" onClick={() => setShowMenu(false)} />
                      <MenuLink to="/settings" icon={<Settings size={14} />} label="System_Config" index="ST" onClick={() => setShowMenu(false)} />
                      
                      {(user.role === 'ADMIN' || user.role === 'MODERATOR') && (
                        <MenuLink 
                           to="/admin" 
                           icon={<ShieldAlert size={14} />} 
                           label="Admin_Terminal" 
                           index="AD"
                           onClick={() => setShowMenu(false)} 
                           colorClass="text-red-500 hover:bg-red-500 hover:text-white" 
                        />
                      )}

                      {(user.role === 'ADMIN' || user.role === 'ARTIST') && (
                        <MenuLink 
                           to="/artist-dashboard" 
                           icon={<Mic2 size={14} />} 
                           label="Creator_Manifest" 
                           index="CM"
                           onClick={() => setShowMenu(false)} 
                           colorClass="text-[#1DB954] hover:bg-[#1DB954] hover:text-black border-b border-white/10" 
                        />
                      )}

                      <button
                        className="w-full text-left flex items-center justify-between px-5 py-4 group hover:bg-white transition-all mt-2"
                        onClick={async () => { 
                          try {
                            await api.post('/auth/logout');
                          } catch (e) {
                            console.error('Logout API failed', e);
                          }
                          logout(); 
                          setShowMenu(false); 
                          navigate('/login'); 
                        }}
                      >
                        <div className="flex items-center gap-4">
                           <LogOut size={14} className="text-white/30 group-hover:text-black" /> 
                           <span className="text-[11px] font-black uppercase tracking-[0.2em] text-white group-hover:text-black">Purge_Session</span>
                        </div>
                        <Cpu size={10} className="text-white/10 group-hover:text-black/40" />
                      </button>
                    </div>

                    <div className="px-5 py-2 border-t border-white/5 bg-white/[0.01] flex justify-between relative z-10">
                       <span className="text-[7px] font-black uppercase tracking-widest text-white/10">Archive_v4.0.1</span>
                       <Zap size={8} className="text-white/10" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

const MenuLink = ({ to, icon, label, index, onClick, colorClass }: { to: string, icon: React.ReactNode, label: string, index: string, onClick: () => void, colorClass?: string }) => (
  <Link
    to={to}
    className={cn(
      "w-full text-left flex items-center justify-between px-5 py-4 group transition-all border-l-2 border-transparent",
      colorClass ? colorClass : "hover:bg-white hover:text-black text-white hover:border-black"
    )}
    onClick={onClick}
  >
    <div className="flex items-center gap-4">
       <span className={cn("transition-colors", colorClass ? "text-inherit" : "text-white/30 group-hover:text-inherit")}>{icon}</span> 
       <span className="text-[11px] font-black uppercase tracking-widest leading-none">{label}</span>
    </div>
    <div className="flex items-center gap-2">
       <span className="text-[8px] font-black italic opacity-20 group-hover:opacity-100">{index}</span>
       <ChevronRight size={10} className="opacity-0 group-hover:opacity-40 transition-all -translate-x-2 group-hover:translate-x-0" />
    </div>
  </Link>
);
