import { Rocket } from 'lucide-react';

export function ComingSoon({ title, hint }) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-6 py-24 text-center animate-fade-in">
      <div className="relative">
        <div className="absolute inset-0 rounded-2xl bg-brand-50 blur-xl opacity-60" />
        <div className="relative rounded-2xl bg-brand-50 border border-brand-100 p-4">
          <Rocket className="h-8 w-8 text-brand-400" />
        </div>
      </div>
      <h2 className="mt-5 text-lg font-semibold tracking-tight text-ink">{title || 'Coming Soon'}</h2>
      <p className="mt-2 max-w-sm text-sm text-ink-muted leading-relaxed">
        {hint || 'This page is currently being built. Check back soon.'}
      </p>
    </div>
  );
}

export default ComingSoon;
