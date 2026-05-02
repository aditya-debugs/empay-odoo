import { useAuth } from '../../../features/auth/AuthContext';

export default function EmployeeDashboard() {
  const { user } = useAuth();
  return (
    <div className="px-8 py-8">
      <h1 className="text-3xl font-semibold tracking-tight">My Dashboard</h1>
      <p className="mt-1 text-sm text-ink-muted">Welcome, {user?.name}.</p>
      <p className="mt-4 text-sm text-ink-muted">
        Attendance summary, leave balance widgets, last payslip, and directory cards will land here.
      </p>
    </div>
  );
}
