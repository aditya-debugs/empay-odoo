import { Logo } from '../../features/ui';

export function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-brand-500 px-4 py-10">
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-brand-700 opacity-50 blur-3xl" />
      <div className="pointer-events-none absolute -right-40 bottom-0 h-[28rem] w-[28rem] rounded-full bg-brand-400 opacity-25 blur-3xl" />

      <div className="relative z-10 w-full max-w-md">
        <div className="mb-6 flex justify-center">
          <Logo mono size="lg" />
        </div>

        <div className="rounded-3xl bg-white p-8 shadow-xl shadow-brand-900/20">
          {title && <h1 className="text-2xl font-semibold tracking-tight text-ink">{title}</h1>}
          {subtitle && <p className="mt-1.5 text-sm text-ink-muted">{subtitle}</p>}
          <div className={title || subtitle ? 'mt-6' : ''}>{children}</div>
        </div>

        {footer && <div className="mt-6 text-center text-sm text-brand-100">{footer}</div>}
      </div>
    </div>
  );
}

export default AuthLayout;
