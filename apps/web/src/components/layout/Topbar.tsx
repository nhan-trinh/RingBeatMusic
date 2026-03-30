import { useState } from 'react';
import { ChevronLeft, ChevronRight, User, Bell, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/auth.store';

export const Topbar = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [showMenu, setShowMenu] = useState(false);

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between bg-transparent flex-shrink-0 px-4 transition-colors duration-300">
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
          <div className="relative">
            <div className="flex items-center gap-4">
              <button className="flex h-8 w-8 items-center justify-center rounded-full bg-black/70 text-[#B3B3B3] hover:text-white hover:bg-black">
                <Bell className="h-4 w-4" />
              </button>
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
            </div>
            
            {showMenu && (
              <div className="absolute right-0 mt-2 w-48 rounded-md bg-[#282828] shadow-lg ring-1 ring-black ring-opacity-5 z-50 py-1">
                <div className="px-4 py-3 border-b border-[#3E3E3E]">
                  <p className="text-sm font-bold text-white truncate">{user.name}</p>
                  <p className="text-xs text-[#B3B3B3] truncate">{user.email}</p>
                </div>
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
        )}
      </div>
    </header>
  );
};
