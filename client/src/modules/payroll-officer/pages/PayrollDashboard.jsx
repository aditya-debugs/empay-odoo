import { useAuth } from '../../../features/auth/AuthContext';

export default function PayrollDashboard() {
  const { user } = useAuth();
  return (
    <div className="px-8 py-8">
      <h1 className="text-3xl font-semibold tracking-tight">Payroll Dashboard</h1>
      <p className="mt-1 text-sm text-ink-muted">Welcome, {user?.name}.</p>
      <p className="mt-4 text-sm text-ink-muted">
        Payroll stats, processed-vs-generated chart, and pending approvals will land here.
      </p>
    </div>
  );
}
