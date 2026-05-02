import { useLocation } from 'react-router-dom';
import { Bell, LogOut, Search } from 'lucide-react';
import { Avatar } from '../../features/ui';
import { useAuth } from '../../features/auth/AuthContext';
import { roleLabels, navConfig } from '../navigation';

// Resolve the current route's label from the role's nav config so the
// top bar tracks where the user is.
function useCurrentPageLabel(role, pathname) {
  const items = navConfig[role] || [];
  const match = items.find((i) => pathname.startsWith(i.to));
  return match?.label || 'Dashboard';
}

export default function TopBar() {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  const pageLabel = useCurrentPageLabel(user?.role, pathname);

  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-6 border-b border-border bg-white px-6">
      {/* Left — current page + global search */}
      <div className="flex flex-1 items-center gap-4">
        <h1 className="hidden text-base font-semibold text-ink md:block">{pageLabel}</h1>
        <div className="hidden flex-1 max-w-md items-center gap-2 rounded-full border border-border bg-surface-muted px-3.5 md:flex">
          <Search className="h-4 w-4 text-ink-muted" />
          <input
            type="search"
            placeholder="Search employees, requests, payslips…"
            className="h-9 w-full bg-transparent text-sm text-ink placeholder:text-ink-soft focus:outline-none"
          />
        </div>
      </div>

      {/* Right — notifications + profile */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="relative rounded-full p-2 text-ink-muted transition-colors hover:bg-surface-muted"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-danger-500" />
        </button>

        <div className="flex items-center gap-3 border-l border-border pl-3">
          <Avatar name={user?.name} src={user?.employee?.avatarUrl ? import.meta.env.VITE_API_URL.replace('/api/v1', '') + user.employee.avatarUrl : null} size="sm" />
          <div className="hidden text-right sm:block">
            <div className="text-sm font-medium leading-tight text-ink">{user?.name}</div>
            <div className="text-xs text-ink-muted">{roleLabels[user?.role]}</div>
          </div>
          <button
            type="button"
            onClick={logout}
            className="rounded-full p-2 text-ink-muted transition-colors hover:bg-surface-muted hover:text-danger-500"
            aria-label="Sign out"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
