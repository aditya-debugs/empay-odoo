import { NavLink } from 'react-router-dom';
import { Logo } from '../../features/ui';
import { cn } from '../../features/ui/cn';
import { navConfig, roleLabels } from '../navigation';

export default function Sidebar({ role }) {
  const items = navConfig[role] || [];

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col bg-brand-500 text-brand-50">
      <div className="px-6 py-6">
        <Logo mono size="md" />
        <div className="mt-1 text-xs uppercase tracking-wider text-brand-200">
          {roleLabels[role]}
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors',
                isActive
                  ? 'bg-brand-700 text-white'
                  : 'text-brand-100 hover:bg-brand-600 hover:text-white',
              )
            }
          >
            <Icon className="h-4 w-4" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="px-6 py-4 text-xs text-brand-200">
        EmPay v0.1
      </div>
    </aside>
  );
}
