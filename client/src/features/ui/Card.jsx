import { cn } from './cn';

export function Card({ className, padded = true, children, ...rest }) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-border bg-surface-card shadow-[0_1px_2px_rgba(15,76,58,0.04)]',
        padded && 'p-5',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, action, className }) {
  return (
    <div className={cn('flex items-start justify-between gap-4', className)}>
      <div>
        {title && <h3 className="text-base font-semibold text-ink">{title}</h3>}
        {subtitle && <p className="mt-0.5 text-sm text-ink-muted">{subtitle}</p>}
      </div>
      {action && <div className="flex items-center gap-2">{action}</div>}
    </div>
  );
}

export default Card;
