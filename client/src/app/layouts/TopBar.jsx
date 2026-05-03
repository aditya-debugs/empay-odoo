import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Bell, LogOut, CheckCircle, Clock, Info } from 'lucide-react';
import { Avatar } from '../../features/ui';
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
  const pageLabel = useCurrentPageLabel(user?.role, pathname);

  const [showNotifications, setShowNotifications] = useState(false);
  const notifyRef = useRef(null);

  const [notifications, setNotifications] = useState([
    { id: 1, title: 'Check-in Successful', desc: 'Your attendance was recorded at 9:00 AM', time: '9:00 AM', type: 'success', read: false },
    { id: 2, title: 'Leave Approved', desc: 'Your casual leave request was approved', time: 'Yesterday', type: 'brand', read: true },
    { id: 3, title: 'Payslip Ready', desc: 'Your April 2026 payslip is now available', time: '2d ago', type: 'info', read: true },
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    const interval = setInterval(() => {
      const newNotify = {
        id: Date.now(),
        title: 'System Sync Complete',
        desc: 'All employee data has been synchronized',
        time: 'Just now',
        type: 'info',
        read: false,
      };
      setNotifications(prev => [newNotify, ...prev].slice(0, 6));
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

  const typeStyles = {
    success: { dot: 'bg-success-500', icon: <CheckCircle className="h-3.5 w-3.5 text-success-500" />, bg: 'bg-success-50' },
    brand:   { dot: 'bg-accent-500',  icon: <CheckCircle className="h-3.5 w-3.5 text-accent-500" />,  bg: 'bg-accent-50' },
    info:    { dot: 'bg-info-500',    icon: <Info className="h-3.5 w-3.5 text-info-500" />,            bg: 'bg-info-50' },
  };

  return (
    <header className="flex h-[60px] shrink-0 items-center justify-between gap-4 border-b border-border bg-white/95 backdrop-blur-sm px-6 z-40 sticky top-0">
      {/* Left: Page label */}
      <div className="flex items-center gap-3">
        <h1 className="text-[15px] font-semibold text-ink tracking-tight">{pageLabel}</h1>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1.5">
        {/* Notification bell */}
        <div className="relative" ref={notifyRef}>
          <button
            type="button"
            onClick={() => setShowNotifications(!showNotifications)}
            className={`relative flex h-8 w-8 items-center justify-center rounded-lg transition-all outline-none ${
              showNotifications
                ? 'bg-brand-50 text-brand-600'
                : 'text-ink-muted hover:bg-surface-muted hover:text-ink'
            }`}
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute right-1.5 top-1.5 flex h-2 w-2 items-center justify-center rounded-full bg-danger-500 ring-2 ring-white">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-danger-500 opacity-50" />
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 rounded-xl border border-border bg-white shadow-[0_8px_30px_rgba(13,26,19,0.12)] z-50 overflow-hidden animate-scale-in">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-ink">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-danger-500 text-[9px] font-bold text-white">
                      {unreadCount}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setNotifications(prev => prev.map(n => ({ ...n, read: true })))}
                  className="text-[10px] font-semibold text-brand-500 hover:text-brand-700 transition-colors"
                >
                  Mark all read
                </button>
              </div>

              <div className="divide-y divide-border overflow-y-auto max-h-72">
                {notifications.map((n) => {
                  const style = typeStyles[n.type] || typeStyles.info;
                  return (
                    <div
                      key={n.id}
                      onClick={() => setNotifications(prev => prev.map(notif => notif.id === n.id ? { ...notif, read: true } : notif))}
                      className={`flex gap-3 px-4 py-3 hover:bg-surface-muted/40 transition-colors cursor-pointer ${!n.read ? 'bg-brand-50/30' : ''}`}
                    >
                      <div className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${style.bg}`}>
                        {style.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`text-xs leading-snug ${!n.read ? 'font-semibold text-ink' : 'font-medium text-ink-muted'}`}>{n.title}</div>
                        <div className="text-[11px] text-ink-soft mt-0.5 truncate">{n.desc}</div>
                        <div className="mt-1 flex items-center gap-1 text-[10px] text-ink-soft">
                          <Clock className="h-2.5 w-2.5" /> {n.time}
                        </div>
                      </div>
                      {!n.read && <div className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${style.dot}`} />}
                    </div>
                  );
                })}
                {notifications.length === 0 && (
                  <div className="py-10 text-center text-xs text-ink-soft">No notifications yet</div>
                )}
              </div>

              <div className="border-t border-border px-4 py-2.5 bg-surface-muted/30">
                <button
                  onClick={() => setNotifications([])}
                  className="w-full text-center text-[11px] font-semibold text-ink-soft hover:text-danger-500 transition-colors"
                >
                  Clear all notifications
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="mx-1 h-5 w-px bg-border" />

        {/* User profile */}
        <div className="flex items-center gap-2.5 pl-1">
          <Avatar name={user?.name} size="sm" className="ring-2 ring-brand-100/80 ring-offset-1" />
          <div className="hidden md:block leading-tight">
            <div className="text-[13px] font-semibold text-ink">{user?.name}</div>
            <div className="text-[10px] font-medium text-ink-soft">{roleLabels[user?.role]}</div>
          </div>
          <button
            type="button"
            onClick={logout}
            title="Sign out"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-ink-soft transition-colors hover:bg-danger-50 hover:text-danger-500"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
}
