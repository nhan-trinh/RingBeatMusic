import { useEffect } from 'react';
import { useNotificationStore, Notification } from '../../stores/notification.store';
import { Bell, Check, Trash2, X as XIcon, AlertTriangle, Lock, Music } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/vi';
import { cn } from '../../lib/utils';

dayjs.extend(relativeTime);
dayjs.locale('vi');

export const NotificationPopover = () => {
  const navigate = useNavigate();
  const { 
    notifications = [], 
    unreadCount, 
    fetchNotifications, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification,
    loading 
  } = useNotificationStore();

  useEffect(() => {
    fetchNotifications();
  }, []);

  const safeNotifications = notifications || [];

  return (
    <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl bg-[#282828] shadow-2xl ring-1 ring-white/10 z-[60] overflow-hidden flex flex-col max-h-[500px] animate-in fade-in zoom-in-95 duration-200">
      {/* Header */}
      <div className="p-4 border-b border-white/5 flex items-center justify-between bg-[#282828]">
        <h3 className="font-bold text-lg">Thông báo</h3>
        {unreadCount > 0 && (
          <button 
            onClick={() => markAllAsRead()}
            className="text-xs text-[#B3B3B3] hover:text-white transition-colors"
          >
            Đánh dấu tất cả đã đọc
          </button>
        )}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar min-h-[100px]">
        {loading && safeNotifications.length === 0 ? (
          <div className="p-10 flex flex-col items-center justify-center text-[#B3B3B3] gap-2">
            <div className="w-8 h-8 border-2 border-[#1DB954] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm">Đang tải...</p>
          </div>
        ) : safeNotifications.length === 0 ? (
          <div className="p-10 flex flex-col items-center justify-center text-[#B3B3B3] gap-3 text-center">
            <div className="bg-[#121212] p-4 rounded-full">
              <Bell className="w-8 h-8 opacity-20" />
            </div>
            <div>
              <p className="font-bold text-white">Chưa có thông báo nào</p>
              <p className="text-sm">Các cập nhật mới nhất sẽ hiện ở đây.</p>
            </div>
          </div>
        ) : (
          <div className="py-2">
            {safeNotifications.map((n) => (
              <NotificationItem 
                key={n._id || Math.random().toString()} 
                notification={n} 
                onClick={() => {
                  if (!n.isRead) markAsRead(n._id);
                  handleNotificationClick(n, navigate);
                }}
                onDelete={(e) => {
                  e.stopPropagation();
                  deleteNotification(n._id);
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-white/5 bg-[#181818] flex justify-center">
         <p className="text-xs text-[#B3B3B3]">Gần đây</p>
      </div>
    </div>
  );
};

const NotificationItem = ({ 
  notification: n, 
  onClick,
  onDelete
}: { 
  notification: Notification, 
  onClick: () => void,
  onDelete: (e: React.MouseEvent) => void 
}) => {
  return (
    <div 
      onClick={onClick}
      className={cn(
        "px-4 py-3 flex gap-3 hover:bg-white/5 cursor-pointer transition-all relative group",
        !n.isRead && "bg-white/[0.02]"
      )}
    >
      {/* Icon/Type Indicator */}
      <div className="flex-shrink-0 mt-1">
        <div className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center",
          n.type.includes('APPROVED') ? "bg-green-500/10 text-green-500" :
          n.type.includes('REJECTED') || n.type.includes('BANNED') ? "bg-red-500/10 text-red-500" :
          n.type.includes('STRIKE') ? "bg-yellow-500/10 text-yellow-500" :
          "bg-blue-500/10 text-blue-500"
        )}>
          {getTypeIcon(n.type)}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className={cn("text-sm font-bold truncate", !n.isRead ? "text-white" : "text-[#B3B3B3]")}>
            {n.title}
          </p>
          <div className="flex items-center gap-2">
            {!n.isRead && <div className="w-2 h-2 rounded-full bg-[#1DB954] shrink-0" />}
            <button 
              onClick={onDelete}
              className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-white/10 rounded-full text-[#B3B3B3] hover:text-red-500 transition-all ml-1"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
        <p className="text-xs text-[#B3B3B3] line-clamp-2 mt-0.5 leading-relaxed">
          {n.body}
        </p>
        <p className="text-[10px] text-[#5e5e5e] mt-2">
          {dayjs(n.createdAt).fromNow()}
        </p>
      </div>
    </div>
  );
};

const handleNotificationClick = (n: Notification, navigate: any) => {
  const { type, data } = n;
  
  if (type === 'NEW_RELEASE' || type === 'CONTENT_APPROVED') {
    if (data?.songId) {
      // Vì trang song/:id là placeholder, ta hướng user tới Artist page để nghe
      if (data.artistId) {
        navigate(`/track/${data.songId}`);
      } else {
        navigate(`/track/${data.songId}`);
      }
    }
  } else if (type === 'ARTIST_VERIFIED') {
    if (data?.artistId) navigate(`/artist/${data.artistId}`);
  } else if (type === 'STRIKE_ISSUED' || type === 'ACCOUNT_BANNED') {
    // Navigate to settings or profile if needed
  }
};

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'CONTENT_APPROVED': return <Check className="w-5 h-5" />;
    case 'CONTENT_REJECTED': return <XIcon className="w-5 h-5" />;
    case 'STRIKE_ISSUED': return <AlertTriangle className="w-5 h-5" />;
    case 'ACCOUNT_BANNED': return <Lock className="w-4 h-4" />;
    case 'NEW_RELEASE': return <Music className="w-5 h-5" />;
    default: return <Bell className="w-5 h-5" />;
  }
};
