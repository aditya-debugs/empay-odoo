import { forwardRef, useId } from 'react';
import { cn } from './cn';

export const Select = forwardRef(function Select(
  { label, error, hint, className, id, options = [], ...rest },
  ref
) {
  const generatedId = useId();
  const selectId = id || generatedId;

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={selectId} className="text-[13px] font-medium text-ink-muted">
          {label}
        </label>
      )}
      <select
        ref={ref}
        id={selectId}
        className={cn(
          'h-10 w-full rounded-lg border bg-white px-3 py-2 text-sm text-ink appearance-none',
          'focus:border-brand-400 focus:ring-2 focus:ring-brand-500/15 focus:outline-none transition-all duration-150',
          'hover:border-border-strong/80',
          error ? 'border-danger-500' : 'border-border-strong',
          className
        )}
        {...rest}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <span className="text-xs text-danger-500">{error}</span>}
      {hint && <span className="text-xs text-ink-soft">{hint}</span>}
    </div>
  );
});
