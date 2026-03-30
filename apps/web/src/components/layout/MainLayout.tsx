
import { Sidebar } from '../layout/Sidebar';
import { Topbar } from '../layout/Topbar';
import { PlayerBar } from '../layout/PlayerBar';
import { Outlet } from 'react-router-dom';

export const MainLayout = () => {
  return (
    <div className="flex h-screen w-full flex-col bg-[#000000] overflow-hidden text-white">
      {/* Top Section: Sidebar + Main Content */}
      <div className="flex flex-1 overflow-hidden p-2 gap-2 pb-0">
        <Sidebar className="w-[300px] shrink-0" />

        <main className="relative flex flex-1 flex-col overflow-hidden rounded-lg bg-[#121212]">
          <Topbar />
          <div className="flex-1 overflow-y-auto w-full">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Bottom Section: Player Bar */}
      <div className="h-[90px] w-full shrink-0 flex items-center bg-black px-4">
        <PlayerBar />
      </div>
    </div>
  );
};
