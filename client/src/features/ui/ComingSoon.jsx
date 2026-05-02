import { Clock } from 'lucide-react';

export function ComingSoon({ title, hint }) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-6 py-24 text-center">
      <div className="rounded-full bg-surface-muted p-3">
        <Clock className="h-6 w-6 text-brand-500" />
      </div>
      <h2 className="mt-4 text-xl font-semibold tracking-tight text-ink">{title}</h2>
      <p className="mt-1 max-w-md text-sm text-ink-muted">
        {hint || 'This page is scaffolded — the module owner will fill it in.'}
      </p>
    </div>
  );
}

export default ComingSoon;
