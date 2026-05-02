import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Bell, LogOut, X, CheckCircle, Clock, Info } from 'lucide-react';
import { Avatar, Card } from '../../features/ui';
import { useAuth } from '../../features/auth/AuthContext';
import { roleLabels, navConfig } from '../navigation';

function useCurrentPageLabel(role, pathname) {
  const items = navConfig[role] || [];
  const match = items.find((i) => pathname.startsWith(i.to));
  return match?.label || 'Dashboard';
}

export default function TopBar() {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const pageLabel = useCurrentPageLabel(user?.role, pathname);

  const [showNotifications, setShowNotifications] = useState(false);
  const notifyRef = useRef(null);

  const [notifications, setNotifications] = useState([
    { id: 1, title: 'Check-in Successful', time: '9:00 AM', icon: <CheckCircle className="h-4 w-4 text-success-500" />, read: false },
    { id: 2, title: 'Leave Approved', time: 'Yesterday', icon: <CheckCircle className="h-4 w-4 text-brand-500" />, read: true },
  ]);

  useEffect(() => {
    // Live notification polling simulation (Trigger every 15s for demo)
    const interval = setInterval(() => {
      const newNotify = {
        id: Date.now(),
        title: 'Real-Time Sync Complete',
        time: 'Just Now',
        icon: <Info className="h-4 w-4 text-brand-600" />,
        read: false
      };
      setNotifications(prev => [newNotify, ...prev].slice(0, 5));
    }, 15000);

    function handleClickOutside(e) {
      if (notifyRef.current && !notifyRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      clearInterval(interval);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-6 border-b border-border bg-white px-6 z-[100]">
      <div className="flex flex-1 items-center gap-4">
        <h1 className="text-base font-bold text-ink">{pageLabel}</h1>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative" ref={notifyRef}>
          <button
            type="button"
            onClick={() => setShowNotifications(!showNotifications)}
            className={`relative rounded-full p-2.5 transition-all outline-none ${
              showNotifications ? 'bg-brand-50 text-brand-600 ring-2 ring-brand-100' : 'text-ink-muted hover:bg-surface-muted'
            }`}
          >
            <Bell className="h-5 w-5" />
            {notifications.some(n => !n.read) && (
              <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full border-2 border-white bg-danger-500 animate-pulse" />
            )}
          </button>

          {showNotifications && (
            <Card className="absolute right-0 mt-3 w-80 overflow-hidden shadow-2xl border-none z-[110] animate-in fade-in zoom-in-95 duration-200">
              <div className="border-b border-border bg-surface-muted/50 px-4 py-3 flex justify-between items-center">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-ink-soft">Notifications</h3>
                <span className="text-[9px] font-bold text-brand-600 bg-brand-50 px-1.5 py-0.5 rounded uppercase">Live Feed</span>
              </div>
              <div className="divide-y divide-border overflow-y-auto max-h-[400px] bg-white text-ink">
                {notifications.map((n) => (
                  <div 
                    key={n.id} 
                    className={`flex gap-3 px-4 py-3 hover:bg-surface-muted/30 transition-colors cursor-pointer ${!n.read ? 'bg-brand-50/10' : ''}`}
                    onClick={() => {
                        setNotifications(prev => prev.map(notif => notif.id === n.id ? {...notif, read: true} : notif));
                    }}
                  >
                    <div className="mt-0.5">{n.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className={`text-xs ${!n.read ? 'font-bold text-ink' : 'text-ink-soft'}`}>{n.title}</div>
                      <div className="mt-1 flex items-center gap-1 text-[10px] text-ink-soft font-medium">
                        <Clock className="h-2.5 w-2.5" /> {n.time}
                      </div>
                    </div>
                    {!n.read && <div className="mt-2 h-1.5 w-1.5 rounded-full bg-brand-500" />}
                  </div>
                ))}
                {notifications.length === 0 && (
                   <div className="py-10 text-center text-[10px] text-ink-soft italic">No new activity detected.</div>
                )}
              </div>
              <button className="w-full border-t border-border bg-surface-muted/30 py-3 text-center text-[10px] font-bold uppercase tracking-widest text-brand-600 hover:bg-brand-50 transition-colors">
                Clear All Notifications
              </button>
            </Card>
          )}
        </div>

        <div className="flex items-center gap-3 border-l border-border pl-4">
          <div className="hidden text-right md:block">
            <div className="text-sm font-bold leading-tight text-ink">{user?.name}</div>
            <div className="text-[10px] uppercase font-bold tracking-widest text-brand-500 mt-0.5">{roleLabels[user?.role]}</div>
          </div>
          <Avatar name={user?.name} size="sm" className="ring-2 ring-brand-100" />
          <button
            type="button"
            onClick={logout}
            className="ml-1 rounded-full p-2 text-ink-muted transition-colors hover:bg-danger-50 hover:text-danger-500"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
