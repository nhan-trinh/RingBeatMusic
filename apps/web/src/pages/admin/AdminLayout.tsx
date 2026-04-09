import { NavLink, Outlet } from 'react-router-dom';
import { Home, ListMusic, Users, Settings, ShieldAlert, FileText, Info, LogOut } from 'lucide-react';
import { useAuthStore } from '../../stores/auth.store';

const navItems = [
  { to: '/admin', icon: Home, label: 'Overview', end: true },
  { to: '/admin/songs', icon: ListMusic, label: 'Pending Songs' },
  { to: '/admin/users', icon: Users, label: 'User Management' },
  { to: '/admin/reports', icon: ShieldAlert, label: 'Reports' },
  { to: '/admin/audit', icon: FileText, label: 'Audit Logs' },
  { to: '/admin/settings', icon: Settings, label: 'System Settings' },
];

export const AdminLayout = () => {
  const { user } = useAuthStore();

  return (
    <div className="flex h-screen w-full flex-col bg-[#000000] overflow-hidden text-white">
      {/* Top Header */}
      <div className="h-16 flex items-center justify-between px-6 bg-[#000000] shrink-0">
        <div className="flex items-center gap-3">
          <ShieldAlert className="text-[#e22134]" size={28} />
          <h1 className="text-xl font-bold tracking-tight">RingBeat Admin</h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm font-semibold max-w-[150px] truncate text-[#1DB954]">
            {user?.name}
          </span>
          <span className="text-[10px] bg-[#e22134] px-2 py-0.5 rounded uppercase font-bold tracking-widest text-[#fff]">
            {user?.role}
          </span>
          <NavLink to="/" className="text-sm text-[#b3b3b3] hover:text-white flex items-center gap-1.5 ml-4">
            <LogOut size={16} /> Exit
          </NavLink>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden p-2 gap-2 pb-2">
        {/* Sidebar */}
        <div className="w-[260px] bg-[#000000] p-4 flex flex-col shrink-0 overflow-y-auto">
          <div className="flex flex-col gap-1">
            <div className="text-[11px] font-bold text-[#b3b3b3] mb-2 px-2 uppercase tracking-[2px]">Core Module</div>
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-4 px-3 py-2.5 rounded-md font-semibold text-sm transition-colors ${isActive ? 'bg-[#282828] text-white' : 'text-[#b3b3b3] hover:text-white hover:bg-[#1a1a1a]'
                  }`
                }
              >
                <item.icon size={20} />
                {item.label}
              </NavLink>
            ))}
          </div>

          <div className="mt-auto px-4 py-6 text-xs text-[#b3b3b3] flex flex-col items-center text-center opacity-50">
            <Info size={24} className="mb-2" />
            <p>Admin Control Panel</p>
            <p>SuperProject v1.0</p>
          </div>
        </div>

        {/* Main View */}
        <main className="flex-1 bg-[#121212] rounded-lg overflow-y-auto relative isolate shadow-2xl">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
