
import { useNavigate } from 'react-router-dom';
import { Button } from 'primereact/button';
import { Bell } from 'lucide-react';

export function NotificationBell() {
  const navigate = useNavigate();

  const unreadCount = 3;

  return (
    <Button unstyled
      className="header-icon-btn relative !p-1.5 sm:!p-2.5"
      onClick={() => navigate('/notifications')}
      title="View Notifications"
    >
      <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600 dark:text-slate-300" />
      {unreadCount > 0 && (
        <span className="absolute top-0.5 right-0.5 sm:top-1 sm:right-1 min-w-[16px] h-[16px] sm:min-w-[18px] sm:h-[18px] bg-[#DC2626] rounded-full flex items-center justify-center text-white text-[9px] sm:text-[10px] font-bold px-1 shadow-sm">
          {unreadCount}
        </span>
      )}
    </Button>
  );
}
