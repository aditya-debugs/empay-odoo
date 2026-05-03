import { forwardRef, useId } from 'react';
import { cn } from './cn';

export const Input = forwardRef(function Input(
  { label, error, hint, leftIcon, rightIcon, className, id, ...rest },
  ref,
) {
  const generatedId = useId();
  const inputId = id || generatedId;

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-[13px] font-medium text-ink-muted">
          {label}
        </label>
      )}
      <div
        className={cn(
          'flex items-center gap-2 rounded-lg border bg-white px-3 transition-all duration-150',
          'focus-within:border-brand-400 focus-within:ring-2 focus-within:ring-brand-500/15 focus-within:shadow-[0_0_0_3px_rgba(15,76,58,0.08)]',
          error ? 'border-danger-500 focus-within:ring-danger-500/15' : 'border-border-strong hover:border-border-strong/80',
        )}
      >
        {leftIcon && <span className="shrink-0 text-ink-soft">{leftIcon}</span>}
        {rest.multiline ? (
          <textarea
            ref={ref}
            id={inputId}
            className={cn(
              'min-h-[90px] w-full bg-transparent py-2.5 text-sm text-ink placeholder:text-ink-soft',
              'focus:outline-none focus:ring-0 resize-none',
              className,
            )}
            {...(({ multiline, ...r }) => r)(rest)}
          />
        ) : (
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'h-10 w-full bg-transparent text-sm text-ink placeholder:text-ink-soft',
              'focus:outline-none',
              className,
            )}
            {...rest}
          />
        )}
        {rightIcon && <span className="shrink-0 text-ink-soft">{rightIcon}</span>}
      </div>
      {error ? (
        <span className="flex items-center gap-1 text-xs text-danger-500">{error}</span>
      ) : hint ? (
        <span className="text-xs text-ink-soft">{hint}</span>
      ) : null}
    </div>
  );
});

export default Input;
