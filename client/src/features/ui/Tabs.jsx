import { cn } from './cn';

export function Tabs({ tabs, activeKey, onChange, className }) {
  return (
    <div className={cn('flex gap-0.5 border-b border-border', className)}>
      {tabs.map((t) => (
        <button
          key={t.key}
          type="button"
          onClick={() => onChange(t.key)}
          className={cn(
            '-mb-px border-b-2 px-4 py-2.5 text-sm font-medium transition-all duration-150',
            activeKey === t.key
              ? 'border-brand-500 text-brand-600'
              : 'border-transparent text-ink-muted hover:text-ink hover:border-border-strong',
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

export default Tabs;
