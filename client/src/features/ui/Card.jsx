import { cn } from './cn';

export function Card({ className, padded = true, children, hover = false, ...rest }) {
  return (
    <div
      className={cn(
        'rounded-[14px] border border-border bg-surface-card',
        'shadow-[0_1px_3px_rgba(13,26,19,0.06),0_1px_2px_rgba(13,26,19,0.04)]',
        padded && 'p-5',
        hover && 'transition-all duration-200 hover:shadow-[0_4px_12px_rgba(13,26,19,0.09)] hover:-translate-y-0.5 cursor-pointer',
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
        {title && <h3 className="text-[15px] font-semibold text-ink leading-snug">{title}</h3>}
        {subtitle && <p className="mt-0.5 text-xs text-ink-muted">{subtitle}</p>}
      </div>
      {action && <div className="flex items-center gap-2">{action}</div>}
    </div>
  );
}

export default Card;
