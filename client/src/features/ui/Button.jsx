import { cn } from './cn';

const variants = {
  primary:   'bg-brand-500 text-white hover:bg-brand-600 active:bg-brand-700 disabled:bg-brand-300',
  secondary: 'bg-surface-muted text-ink hover:bg-border disabled:text-ink-soft',
  ghost:     'bg-transparent text-ink hover:bg-surface-muted disabled:text-ink-soft',
  outline:   'bg-white border border-border-strong text-ink hover:bg-surface-muted',
  danger:    'bg-danger-500 text-white hover:bg-danger-700',
};

const sizes = {
  sm: 'h-8  px-3 text-xs',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
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
        'inline-flex items-center justify-center gap-2 rounded-full font-medium',
        'transition-all duration-200 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/60',
        'disabled:cursor-not-allowed disabled:active:scale-100',
        variants[variant],
        sizes[size],
        className,
      )}
      {...rest}
    >
      {loading ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : (
        leftIcon
      )}
      {children}
      {!loading && rightIcon}
    </button>
  );
}

export default Button;
