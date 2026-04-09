import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, User, Bell, LogOut, ShieldAlert, Mic2 } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/auth.store';
import { useNotificationStore } from '../../stores/notification.store';
import { cn } from '../../lib/utils';
import { SearchInput } from '../search/SearchInput';
import { NotificationPopover } from '../notification/NotificationPopover';

export const Topbar = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { unreadCount } = useNotificationStore();
  const [showMenu, setShowMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  
  const notificationRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scrollContainer = document.getElementById('main-scroll');
    if (!scrollContainer) return;

    const handleScroll = () => {
      setIsScrolled(scrollContainer.scrollTop > 50);
    };

    scrollContainer.addEventListener('scroll', handleScroll);
    return () => scrollContainer.removeEventListener('scroll', handleScroll);
  }, []);

  // Đóng các menu khi click ra ngoài
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
      "sticky top-0 z-40 flex h-16 items-center justify-between flex-shrink-0 px-4 transition-colors duration-300",
      isScrolled ? "bg-black/80 backdrop-blur-md" : "bg-transparent"
    )}>
      <div className="flex gap-2">
        <button 
          onClick={() => navigate(-1)}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-black/70 text-white hover:bg-black"
        >
          <ChevronLeft className="h-5 w-5 pr-[1px]" />
        </button>
        <button 
          onClick={() => navigate(1)}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-black/70 text-white hover:bg-black"
        >
          <ChevronRight className="h-5 w-5 pl-[1px]" />
        </button>
      </div>

      <div className="flex flex-1 justify-center px-4">
        <SearchInput />
      </div>

      <div className="flex items-center gap-4">
        {!user ? (
          <>
            <button 
              onClick={() => navigate('/register')}
              className="font-bold text-[#B3B3B3] hover:text-white hover:scale-105 transition-all text-sm"
            >
              Đăng ký
            </button>
            <button 
              onClick={() => navigate('/login')}
              className="rounded-full bg-white px-8 py-3 text-sm font-bold text-black hover:scale-105 transition-all"
            >
              Đăng nhập
            </button>
          </>
        ) : (
          <div className="flex items-center gap-4">
            {/* Notification Bell */}
            <div className="relative" ref={notificationRef}>
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className={cn(
                  "relative flex h-8 w-8 items-center justify-center rounded-full bg-black/70 text-[#B3B3B3] hover:text-white hover:bg-black transition-all",
                  showNotifications && "text-white bg-black"
                )}
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#1DB954] text-[10px] font-bold text-white shadow-sm border border-black animate-in fade-in zoom-in duration-300">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <NotificationPopover />
              )}
            </div>

            {/* Profile Menu */}
            <div className="relative" ref={menuRef}>
              <button 
                onClick={() => setShowMenu(!showMenu)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[#282828] text-white hover:scale-105 transition-transform overflow-hidden border-2 border-transparent hover:border-white focus:outline-none"
              >
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  <User className="h-5 w-5" />
                )}
              </button>
              
              {showMenu && (
                <div className="absolute right-0 mt-2 w-48 rounded-md bg-[#282828] shadow-lg ring-1 ring-black ring-opacity-5 z-50 py-1 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-4 py-3 border-b border-[#3E3E3E]">
                    <p className="text-sm font-bold text-white truncate">{user.name}</p>
                    <p className="text-xs text-[#B3B3B3] truncate">{user.email}</p>
                  </div>
                  
                  {/* Admin / Mod Panel Link */}
                  {(user.role === 'ADMIN' || user.role === 'MODERATOR') && (
                    <Link
                      to="/admin"
                      className="w-full text-left flex items-center gap-2 px-4 py-3 text-sm text-white hover:bg-[#3E3E3E] transition-colors"
                      onClick={() => setShowMenu(false)}
                    >
                      <ShieldAlert className="h-4 w-4 text-[#e22134]" /> Admin Panel
                    </Link>
                  )}

                  {/* Artist Dashboard Link */}
                  {(user.role === 'ADMIN' || user.role === 'ARTIST') && (
                    <Link
                      to="/artist-dashboard"
                      className="w-full text-left flex items-center gap-2 px-4 py-3 text-sm text-white hover:bg-[#3E3E3E] transition-colors border-b border-[#3E3E3E]"
                      onClick={() => setShowMenu(false)}
                    >
                      <Mic2 className="h-4 w-4 text-[#1DB954]" /> Artist Dashboard
                    </Link>
                  )}

                  <button
                    className="w-full text-left flex items-center gap-2 px-4 py-3 text-sm text-white hover:bg-[#3E3E3E] transition-colors"
                    onClick={() => {
                      logout();
                      setShowMenu(false);
                      navigate('/login');
                    }}
                  >
                    <LogOut className="h-4 w-4" /> Đăng xuất
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
