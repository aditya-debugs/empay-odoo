import { Routes, Route, Navigate } from 'react-router-dom';
import { ComingSoon } from '../../features/ui';
import HRDashboard from './pages/HRDashboard';

export default function HRRoutes() {
  return (
    <Routes>
      <Route index element={<Navigate to="dashboard" replace />} />
      <Route path="dashboard"  element={<HRDashboard />} />
      <Route path="employees"  element={<ComingSoon title="Employee Management" hint="Create employees, edit, send credentials, upload photos." />} />
      <Route path="attendance" element={<ComingSoon title="Attendance" hint="Read-only attendance views and per-employee profiles." />} />
      <Route path="leaves"     element={<ComingSoon title="Time Off" hint="Shared leave queue, approve/reject, allocations." />} />
      <Route path="*"          element={<Navigate to="dashboard" replace />} />
    </Routes>
  );
}
