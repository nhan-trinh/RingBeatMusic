import { useState } from 'react';
import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom';
import { 
  Home, 
  ListMusic, 
  Users, 
  Settings, 
  ShieldAlert, 
  FileText, 
  ChevronLeft,
  Menu,
  Bell,
  ExternalLink,
  LogOut
} from 'lucide-react';
import { useAuthStore } from '../../stores/auth.store';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { api } from '../../lib/api';

const navItems = [
  { to: '/admin', icon: Home, label: 'Overview', end: true },
  { to: '/admin/songs', icon: ListMusic, label: 'Pending Songs' },
  { to: '/admin/users', icon: Users, label: 'User Management' },
  { to: '/admin/reports', icon: ShieldAlert, label: 'Reports' },
  { to: '/admin/audit', icon: FileText, label: 'Audit Logs' },
  { to: '/admin/settings', icon: Settings, label: 'System Settings' },
];

export const AdminLayout = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="flex h-screen w-full bg-zinc-950 text-zinc-100 overflow-hidden font-sans">
      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: isCollapsed ? 80 : 260 }}
        className="h-full bg-zinc-950 border-r border-zinc-800 flex flex-col shrink-0 relative z-40"
      >
        {/* Logo Section */}
        <div className="h-16 flex items-center px-6 border-b border-zinc-800 shrink-0">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 bg-[#1db954] rounded-lg flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(29,185,84,0.3)]">
              <ShieldAlert size={18} className="text-black" />
            </div>
            {!isCollapsed && (
              <motion.span 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="font-bold text-lg tracking-tight whitespace-nowrap"
              >
                RingBeat <span className="text-[#1db954]">Admin</span>
              </motion.span>
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-6 px-3 space-y-1 custom-scrollbar">
          {!isCollapsed && (
            <p className="px-3 mb-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Main Menu</p>
          )}
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              title={isCollapsed ? item.label : ''}
              className={({ isActive }) => clsx(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 group relative",
                isActive 
                  ? "bg-zinc-800 text-white shadow-sm" 
                  : "text-zinc-400 hover:text-white hover:bg-zinc-900"
              )}
            >
              <item.icon size={18} className={clsx(
                "shrink-0 transition-colors",
                isCollapsed && "mx-auto"
              )} />
              {!isCollapsed && <span>{item.label}</span>}
              
              {/* Active Indicator Dot */}
              <NavLink to={item.to} end={item.end}>
                {({ isActive }) => isActive && (
                  <motion.div 
                    layoutId="active-pill"
                    className="absolute left-0 w-1 h-5 bg-[#1db954] rounded-r-full"
                  />
                )}
              </NavLink>
            </NavLink>
          ))}
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-zinc-800 space-y-2">
          <Link 
            to="/" 
            className="flex items-center gap-3 px-3 py-2 text-zinc-400 hover:text-white text-sm transition-colors rounded-lg hover:bg-zinc-900"
          >
            <ExternalLink size={18} className={isCollapsed ? "mx-auto" : ""} />
            {!isCollapsed && <span>View Website</span>}
          </Link>
          
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="w-full flex items-center gap-3 px-3 py-2 text-zinc-500 hover:text-white text-sm transition-colors rounded-lg hover:bg-zinc-800"
          >
            {isCollapsed ? <Menu size={18} className="mx-auto" /> : <ChevronLeft size={18} />}
            {!isCollapsed && <span>Collapse</span>}
          </button>
        </div>
      </motion.aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 border-b border-zinc-800 bg-zinc-950/50 backdrop-blur-md flex items-center justify-between px-8 shrink-0 z-30">
          <div className="flex items-center gap-4">
             {/* Dynamic Title based on current route would be here */}
             <div className="flex items-center gap-2 text-zinc-500 text-xs">
                <span>Dashboard</span>
                <span>/</span>
                <span className="text-zinc-200 font-medium">System Overview</span>
             </div>
          </div>

          <div className="flex items-center gap-6">
            <button className="text-zinc-400 hover:text-white transition-colors relative">
               <Bell size={20} />
               <span className="absolute -top-1 -right-1 w-2 h-2 bg-[#1db954] rounded-full border-2 border-zinc-950" />
            </button>

            <div className="h-8 w-[1px] bg-zinc-800" />

            {/* User Dropdown */}
            <div className="relative group">
              <button className="flex items-center gap-3 text-left">
                <div className="hidden sm:block">
                  <p className="text-sm font-bold leading-none">{user?.name}</p>
                  <p className="text-[10px] text-zinc-500 font-medium mt-1 uppercase tracking-tighter">{user?.role}</p>
                </div>
                <div className="w-9 h-9 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300 font-bold overflow-hidden hover:border-[#1db954] transition-colors">
                  {user?.avatarUrl ? <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" /> : user?.name?.charAt(0).toUpperCase()}
                </div>
              </button>

              <div className="absolute right-0 top-full mt-2 w-48 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 overflow-hidden z-50">
                <div className="p-2 space-y-1">
                  <Link to="/" className="w-full flex items-center gap-3 px-3 py-2 text-sm text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded-lg transition-colors">
                    <ExternalLink size={16} /> User App
                  </Link>
                  <button 
                    onClick={async () => {
                      try { await api.post('/auth/logout'); } catch(e) {}
                      logout();
                      navigate('/login');
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    <LogOut size={16} /> Logout
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* View Port */}
        <main className="flex-1 overflow-y-auto bg-zinc-950 p-8 custom-scrollbar">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
