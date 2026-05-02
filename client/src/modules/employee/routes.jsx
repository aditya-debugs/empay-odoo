import { Routes, Route, Navigate } from 'react-router-dom';
import { ComingSoon } from '../../features/ui';
import EmployeeDashboard from './pages/EmployeeDashboard';

export default function EmployeeRoutes() {
  return (
    <Routes>
      <Route index element={<Navigate to="dashboard" replace />} />
      <Route path="dashboard"  element={<EmployeeDashboard />} />
      <Route path="profile"    element={<ComingSoon title="My Profile" hint="Resume, private info, security, avatar upload, bank details." />} />
      <Route path="directory"  element={<ComingSoon title="Employee Directory" hint="Read-only directory cards + search." />} />
      <Route path="attendance" element={<ComingSoon title="My Attendance" hint="Check-in/out, attendance history, extra hours." />} />
      <Route path="leaves"     element={<ComingSoon title="Time Off" hint="Apply for leave, balances, request history." />} />
      <Route path="payslips"   element={<ComingSoon title="Payslips" hint="Listing, PDF download, raise dispute." />} />
      <Route path="*"          element={<Navigate to="dashboard" replace />} />
    </Routes>
  );
}
