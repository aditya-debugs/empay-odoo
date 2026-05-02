import { Routes, Route, Navigate } from 'react-router-dom';
import { ComingSoon } from '../../features/ui';
import AdminDashboard from './pages/AdminDashboard';

// Admin-specific routes. Add new pages as you build them.
export default function AdminRoutes() {
  return (
    <Routes>
      <Route index element={<Navigate to="dashboard" replace />} />
      <Route path="dashboard"  element={<AdminDashboard />} />
      <Route path="users"      element={<ComingSoon title="Users & Roles" hint="User creation, role management, deactivation." />} />
      <Route path="employees"  element={<ComingSoon title="Employees" hint="Directory, search, filters, profile pages." />} />
      <Route path="attendance" element={<ComingSoon title="Attendance" hint="Daily / weekly / monthly views, manual override." />} />
      <Route path="leaves"     element={<ComingSoon title="Time Off" hint="Approval queue, policies, balance allocation." />} />
      <Route path="payroll"    element={<ComingSoon title="Payroll Override" hint="Reopen, bonus injection, dispute queue." />} />
      <Route path="reports"    element={<ComingSoon title="Reports" hint="Attendance, leave, payroll, headcount with exports." />} />
      <Route path="settings"   element={<ComingSoon title="Settings" hint="Company, attendance, payroll, leave, holidays." />} />
      <Route path="*"          element={<Navigate to="dashboard" replace />} />
    </Routes>
  );
}
