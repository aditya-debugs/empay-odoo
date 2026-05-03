import { useMemo } from 'react';
import { cn } from './cn';

const sizes = {
  xs: 'h-6  w-6  text-[9px]',
  sm: 'h-7  w-7  text-[11px]',
  md: 'h-9  w-9  text-[13px]',
  lg: 'h-11 w-11 text-[15px]',
  xl: 'h-14 w-14 text-lg',
};

// Deterministic color assignment based on name
const colorSets = [
  'bg-brand-100 text-brand-700',
  'bg-accent-100 text-accent-600',
  'bg-info-50 text-info-600',
  'bg-warning-100 text-warning-600',
  'bg-success-100 text-success-700',
  'bg-danger-100 text-danger-700',
];

function initialsOf(name = '') {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function colorOf(name = '') {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colorSets[Math.abs(hash) % colorSets.length];
}

export function Avatar({ src, name = '', size = 'md', className }) {
  const initials = useMemo(() => initialsOf(name), [name]);
  const color = useMemo(() => colorOf(name), [name]);

  return (
    <div
      className={cn(
        'inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full',
        'font-semibold',
        color,
        sizes[size],
        className,
      )}
      aria-label={name}
    >
      {src ? (
        <img src={src} alt={name} className="h-full w-full object-cover" />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
}

export default Avatar;
