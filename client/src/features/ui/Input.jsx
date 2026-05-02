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
        <label htmlFor={inputId} className="text-sm font-medium text-ink">
          {label}
        </label>
      )}
      <div
        className={cn(
          'flex items-center gap-2 rounded-xl border bg-white px-3.5 transition-colors',
          'focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-400/30',
          error ? 'border-danger-500' : 'border-border-strong',
        )}
      >
        {leftIcon && <span className="text-ink-muted">{leftIcon}</span>}
        {rest.multiline ? (
          <textarea
            ref={ref}
            id={inputId}
            className={cn(
              'min-h-[100px] w-full bg-transparent py-2.5 text-sm text-ink placeholder:text-ink-soft',
              'focus:outline-none focus:ring-0',
              className,
            )}
            {...(({ multiline, ...r }) => r)(rest)}
          />
        ) : (
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'h-11 w-full bg-transparent text-sm text-ink placeholder:text-ink-soft',
              'focus:outline-none',
              className,
            )}
            {...rest}
          />
        )}
        {rightIcon && <span className="text-ink-muted">{rightIcon}</span>}
      </div>
      {error ? (
        <span className="text-xs text-danger-500">{error}</span>
      ) : hint ? (
        <span className="text-xs text-ink-soft">{hint}</span>
      ) : null}
    </div>
  );
});

export default Input;
