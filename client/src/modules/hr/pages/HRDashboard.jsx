import { useAuth } from '../../../features/auth/AuthContext';

export default function HRDashboard() {
  const { user } = useAuth();
  return (
    <div className="px-8 py-8">
      <h1 className="text-3xl font-semibold tracking-tight">HR Dashboard</h1>
      <p className="mt-1 text-sm text-ink-muted">Welcome, {user?.name}.</p>
      <p className="mt-4 text-sm text-ink-muted">
        Attendance summary, pending leaves, and new joiners widgets will land here.
      </p>
    </div>
  );
}
