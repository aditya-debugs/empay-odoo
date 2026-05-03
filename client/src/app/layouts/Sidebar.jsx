import { NavLink } from 'react-router-dom';
import { Logo } from '../../features/ui';
import { cn } from '../../features/ui/cn';
import { navConfig, roleLabels } from '../navigation';

export default function Sidebar({ role }) {
  const items = navConfig[role] || [];

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col" style={{ background: 'linear-gradient(180deg, #0F4C3A 0%, #0A3228 100%)' }}>
      {/* Logo area */}
      <div className="px-5 pt-6 pb-4">
        <div className="flex items-center gap-3 px-1">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm border border-white/15 shadow-inner">
            <span className="text-base font-black text-white leading-none">E</span>
          </div>
          <div>
            <div className="text-[15px] font-bold text-white tracking-tight leading-none">EmPay</div>
            <div className="text-[10px] font-semibold uppercase tracking-widest text-white/40 mt-0.5">
              {roleLabels[role]}
            </div>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="mx-5 mb-3 h-px bg-white/8" />

      {/* Nav section label */}
      <div className="px-6 mb-2">
        <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-white/30">Navigation</span>
      </div>

      {/* Nav items */}
      <nav className="flex-1 space-y-0.5 px-3 overflow-y-auto no-scrollbar">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-white/12 text-white shadow-sm'
                  : 'text-white/60 hover:bg-white/7 hover:text-white/90',
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r-full bg-accent-400" />
                )}
                <div className={cn(
                  'flex h-7 w-7 items-center justify-center rounded-lg transition-all',
                  isActive ? 'bg-accent-500/20 text-accent-300' : 'text-white/50 group-hover:text-white/80'
                )}>
                  <Icon className="h-[15px] w-[15px]" />
                </div>
                <span className="font-medium leading-none">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="mx-5 mt-2 mb-5 rounded-xl bg-white/5 border border-white/8 px-4 py-3">
        <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Version</div>
        <div className="text-xs font-semibold text-white/50 mt-0.5">EmPay v0.1.0</div>
      </div>
    </aside>
  );
}
