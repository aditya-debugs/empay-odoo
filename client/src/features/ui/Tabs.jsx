import { cn } from './cn';

export function Tabs({ tabs, activeKey, onChange, className }) {
  return (
    <div className={cn('flex gap-1 border-b border-border', className)}>
      {tabs.map((t) => (
        <button
          key={t.key}
          type="button"
          onClick={() => onChange(t.key)}
          className={cn(
            '-mb-px border-b-2 px-4 py-3 text-sm font-medium transition-colors',
            activeKey === t.key
              ? 'border-brand-500 text-brand-700'
              : 'border-transparent text-ink-muted hover:text-ink',
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

export default Tabs;
