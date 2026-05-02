import { cn } from './cn';

export function Logo({ size = 'md', mono = false, className }) {
  const dim = size === 'lg' ? 'h-10 w-10' : size === 'sm' ? 'h-7 w-7' : 'h-8 w-8';
  const text = size === 'lg' ? 'text-xl' : size === 'sm' ? 'text-sm' : 'text-base';

  return (
    <div className={cn('inline-flex items-center gap-2', className)}>
      <div
        className={cn(
          'inline-flex items-center justify-center rounded-lg font-bold',
          mono ? 'bg-white text-brand-500' : 'bg-brand-500 text-white',
          dim,
        )}
      >
        E
      </div>
      <span className={cn('font-semibold tracking-tight', text, mono ? 'text-white' : 'text-ink')}>
        EmPay
      </span>
    </div>
  );
}

export default Logo;
