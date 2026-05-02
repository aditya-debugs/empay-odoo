import { Routes, Route, Navigate } from 'react-router-dom';
import EmployeeDashboard from './pages/EmployeeDashboard';
import MyProfilePage from './pages/MyProfilePage';
import EmployeeDirectoryPage from './pages/EmployeeDirectoryPage';
import AttendancePage from './pages/AttendancePage';
import LeavesPage from './pages/LeavesPage';
import PayslipsPage from './pages/PayslipsPage';

export default function EmployeeRoutes() {
  return (
    <Routes>
      <Route index element={<Navigate to="dashboard" replace />} />
      <Route path="dashboard"  element={<EmployeeDashboard />} />
      <Route path="profile"    element={<MyProfilePage />} />
      <Route path="directory"  element={<EmployeeDirectoryPage />} />
      <Route path="attendance" element={<AttendancePage />} />
      <Route path="leaves"     element={<LeavesPage />} />
      <Route path="payslips"   element={<PayslipsPage />} />
      <Route path="*"          element={<Navigate to="dashboard" replace />} />
    </Routes>
  );
}
