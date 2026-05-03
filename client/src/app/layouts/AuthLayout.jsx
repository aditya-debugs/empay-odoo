export function AuthLayout({ children, footer }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden" style={{ background: 'linear-gradient(135deg, #0A3228 0%, #0F4C3A 45%, #0C4032 100%)' }}>
      {/* Decorative circles */}
      <div className="pointer-events-none absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-white opacity-[0.03]" />
      <div className="pointer-events-none absolute -right-32 -bottom-32 h-[400px] w-[400px] rounded-full bg-white opacity-[0.03] blur-3xl" />

      {/* Auth card */}
      <div className="relative z-10 w-full max-w-[400px] px-5 py-10">
        {/* Logo above card */}
        <div className="mb-7 flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 border border-white/20 shadow-inner">
            <span className="text-2xl font-black text-white leading-none">E</span>
          </div>
          <span className="text-2xl font-bold text-white tracking-tight">EmPay</span>
        </div>

        <div className="rounded-2xl bg-white p-8 shadow-[0_24px_48px_rgba(0,0,0,0.18)] border border-white/10">
          {children}
        </div>

        {footer && (
          <div className="mt-5 text-center text-sm text-white/50">{footer}</div>
        )}
      </div>
    </div>
  );
}

export default AuthLayout;
