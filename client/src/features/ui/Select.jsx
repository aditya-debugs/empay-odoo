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
        <label htmlFor={selectId} className="text-sm font-medium text-ink">
          {label}
        </label>
      )}
      <select
        ref={ref}
        id={selectId}
        className={cn(
          'h-11 w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-ink',
          'focus:border-brand-500 focus:ring-2 focus:ring-brand-400/30 focus:outline-none transition-colors',
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
