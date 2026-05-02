import { Bell, LogOut } from 'lucide-react';
import { Avatar } from '../../features/ui';
import { useAuth } from '../../features/auth/AuthContext';
import { roleLabels } from '../navigation';

export default function TopBar() {
  const { user, logout } = useAuth();

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-white px-6">
      <div />
      <div className="flex items-center gap-4">
        <button
          type="button"
          className="rounded-full p-2 text-ink-muted transition-colors hover:bg-surface-muted"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 border-l border-border pl-4">
          <Avatar name={user?.name} size="sm" />
          <div className="hidden text-right sm:block">
            <div className="text-sm font-medium text-ink">{user?.name}</div>
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
