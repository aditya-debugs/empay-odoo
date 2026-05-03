import { cn } from './cn';

const variants = {
  primary:   'bg-brand-500 text-white hover:bg-brand-600 active:bg-brand-700 shadow-[0_1px_2px_rgba(13,26,19,0.15)] disabled:bg-brand-300',
  secondary: 'bg-surface-muted text-ink hover:bg-surface-hover border border-border disabled:text-ink-soft',
  ghost:     'bg-transparent text-ink-muted hover:bg-surface-muted hover:text-ink disabled:text-ink-soft',
  outline:   'bg-white border border-border-strong text-ink hover:bg-surface-muted shadow-[0_1px_2px_rgba(13,26,19,0.05)]',
  danger:    'bg-danger-500 text-white hover:bg-danger-600 shadow-[0_1px_2px_rgba(224,49,49,0.2)]',
  success:   'bg-success-500 text-white hover:bg-success-600 shadow-[0_1px_2px_rgba(18,164,79,0.2)]',
};

const sizes = {
  xs: 'h-7  px-2.5 text-[11px] gap-1',
  sm: 'h-8  px-3   text-xs gap-1.5',
  md: 'h-9  px-4   text-sm gap-2',
  lg: 'h-11 px-5   text-sm gap-2',
  xl: 'h-12 px-6   text-base gap-2.5',
};

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  type = 'button',
  leftIcon,
  rightIcon,
  loading = false,
  disabled,
  children,
  ...rest
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center rounded-lg font-medium',
        'transition-all duration-150 active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/50 focus-visible:ring-offset-1',
        'disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100',
        variants[variant],
        sizes[size],
        className,
      )}
      {...rest}
    >
      {loading ? (
        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : (
        leftIcon
      )}
      {children}
      {!loading && rightIcon}
    </button>
  );
}

export default Button;
