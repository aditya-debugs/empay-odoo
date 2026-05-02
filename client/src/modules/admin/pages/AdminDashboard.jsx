import { useAuth } from '../../../features/auth/AuthContext';

// Placeholder — Phase 3 implements the real dashboard with stat cards, panels, charts.
export default function AdminDashboard() {
  const { user } = useAuth();
  return (
    <div className="px-8 py-8">
      <h1 className="text-3xl font-semibold tracking-tight">Good morning,</h1>
      <p className="mt-1 text-3xl font-semibold tracking-tight text-brand-500">{user?.name}</p>
      <p className="mt-4 text-sm text-ink-muted">
        Admin dashboard — stat cards, attendance/leave/payroll analytics, and activity feed will land here in Phase 3.
      </p>
    </div>
  );
}
