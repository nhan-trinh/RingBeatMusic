import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { Users, Music, PlayCircle, DollarSign, Award } from 'lucide-react';

export const AdminOverviewPage = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [overviewRes, artistsRes] = await Promise.all([
          api.get('/admin/analytics/overview'),
          api.get('/admin/analytics/top-artists')
        ]);
        setData({
          overview: overviewRes.data,
          topArtists: artistsRes.data
        });
      } catch (error) {
        console.error('Failed to load admin analytics:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-[#b3b3b3]">Loading overview data...</div>;
  }

  if (!data) return <div className="p-8 text-center text-[#e22134]">Failed to load data.</div>;

  const { overview, topArtists } = data;

  const stats = [
    { label: 'Total Users', value: overview.totalUsers, icon: Users, color: 'bg-blue-500' },
    { label: 'Premium Users', value: overview.premiumUsers, icon: Award, color: 'bg-[#1DB954]' },
    { label: 'Total Songs (Public)', value: overview.totalSongs, icon: Music, color: 'bg-purple-500' },
    { label: 'Total Streams', value: overview.totalPlays, icon: PlayCircle, color: 'bg-pink-500' },
    { label: 'Revenue (VND)', value: new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(overview.totalRevenue), icon: DollarSign, color: 'bg-yellow-500' },
  ];

  return (
    <div className="space-y-10 pb-20">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">System Overview</h2>
        <p className="text-zinc-500 text-sm mt-1">Phân tích số liệu hoạt động của hệ thống RingBeat.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="bg-zinc-900/50 p-6 rounded-xl border border-zinc-800 flex flex-col justify-between h-32 hover:border-zinc-700 transition-all group">
            <div className="flex justify-between items-start">
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">{stat.label}</p>
              <stat.icon size={18} className="text-zinc-500 group-hover:text-[#1db954] transition-colors" />
            </div>
            <div>
              <p className="text-2xl font-bold tracking-tight text-zinc-100">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Award size={20} className="text-[#1db954]" /> Top Artists by Activity
          </h3>
          <button className="text-xs font-medium text-[#1db954] hover:underline">View All Artists</button>
        </div>
        
        <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 overflow-hidden backdrop-blur-sm">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/80">
                <th className="px-6 py-4 font-semibold text-zinc-400">Stage Name</th>
                <th className="px-6 py-4 font-semibold text-zinc-400 text-center">Status</th>
                <th className="px-6 py-4 font-semibold text-zinc-400 text-right">Uploaded</th>
                <th className="px-6 py-4 font-semibold text-zinc-400 text-right">Followers</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {topArtists.map((artist: any) => (
                <tr key={artist.id} className="hover:bg-zinc-800/40 transition-colors group">
                  <td className="px-6 py-4">
                    <span className="font-bold text-zinc-200 group-hover:text-[#1db954] transition-colors">{artist.stageName}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {artist.isVerified ? (
                       <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">Verified</span>
                    ) : (
                       <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-800 text-zinc-500 border border-zinc-700">Standard</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right tabular-nums text-zinc-400">{artist._count.songs}</td>
                  <td className="px-6 py-4 text-right tabular-nums text-zinc-400">{artist._count.followedBy}</td>
                </tr>
              ))}
              {topArtists.length === 0 && (
                <tr><td colSpan={4} className="px-6 py-12 text-center text-zinc-500">Chưa có dữ liệu nghệ sĩ.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
