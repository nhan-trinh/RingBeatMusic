
import { Home, Search, Library, Plus } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const Sidebar = ({ className }: { className?: string }) => {
  const location = useLocation();

  const navItems = [
    { label: 'Trang chủ', path: '/', icon: Home },
    { label: 'Tìm kiếm', path: '/search', icon: Search },
  ];

  return (
    <nav className={twMerge('flex flex-col gap-2 h-full', className)}>
      {/* Top Nav Box */}
      <div className="bg-[#121212] rounded-lg p-4 flex flex-col gap-4">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={clsx(
                "flex items-center gap-4 text-sm font-bold transition-colors",
                isActive ? "text-white" : "text-[#B3B3B3] hover:text-white"
              )}
            >
              <item.icon className="h-6 w-6" strokeWidth={isActive ? 2.5 : 2} />
              {item.label}
            </Link>
          );
        })}
      </div>

      {/* Library Box */}
      <div className="bg-[#121212] rounded-lg flex-1 flex flex-col overflow-hidden">
        <div className="p-4 flex items-center justify-between text-[#B3B3B3] font-bold shadow-sm">
          <Link to="/library" className="flex items-center gap-4 hover:text-white transition-colors duration-200">
            <Library className="h-6 w-6" />
            Thư viện
          </Link>
          <button className="hover:text-white transition-colors rounded-full p-1 hover:bg-[#282828]">
            <Plus className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-2">
          <div className="p-4 bg-[#242424] rounded-lg mt-2 mb-4 text-sm">
            <p className="font-bold text-white mb-2">Tạo playlist đầu tiên của bạn</p>
            <p className="text-[#B3B3B3] mb-4">Rất dễ, chúng tôi sẽ giúp bạn</p>
            <button className="bg-white text-black font-bold px-4 py-1.5 rounded-full hover:scale-105 transition-transform text-sm">
              Tạo danh sách phát
            </button>
          </div>
          
          <div className="p-4 bg-[#242424] rounded-lg text-sm">
            <p className="font-bold text-white mb-2">Hãy cùng tìm vài podcast theo dõi</p>
            <p className="text-[#B3B3B3] mb-4">Chúng tôi sẽ cập nhật các tập mới cho bạn</p>
            <button className="bg-white text-black font-bold px-4 py-1.5 rounded-full hover:scale-105 transition-transform text-sm">
              Duyệt xem podcast
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};
