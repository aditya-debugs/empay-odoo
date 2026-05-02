import { Routes, Route, Navigate } from 'react-router-dom';
import { ComingSoon } from '../../features/ui';
import AdminDashboard from './pages/AdminDashboard';
import EmployeesPage from './pages/EmployeesPage';
import CreateEmployeePage from './pages/CreateEmployeePage';
import EmployeeProfilePage from './pages/EmployeeProfilePage';
import LeaveApprovalPage from './pages/LeaveApprovalPage';
import AttendanceDirectoryPage from './pages/AttendanceDirectoryPage';
import UsersPage from './pages/UsersPage';
import PayrollPage from './pages/PayrollPage';
import PayrunPreviewPage from './pages/PayrunPreviewPage';
import PayrunDetailPage from './pages/PayrunDetailPage';
import PayslipViewerPage from './pages/PayslipViewerPage';
import SettingsPage from './pages/SettingsPage';
import PayslipDisputesPage from './pages/PayslipDisputesPage';
import ReportsPage from './pages/ReportsPage';

export default function AdminRoutes() {
  return (
    <Routes>
      <Route index element={<Navigate to="dashboard" replace />} />
      <Route path="dashboard"        element={<AdminDashboard />} />

      {/* Users & Roles — admin can create users with any role */}
      <Route path="users"            element={<UsersPage />} />
      <Route path="users/new"        element={<CreateEmployeePage mode="user" />} />
      <Route path="users/:id"        element={<EmployeeProfilePage />} />

      {/* Employees directory — create restricted to Employee role */}
      <Route path="employees"        element={<EmployeesPage />} />
      <Route path="employees/new"    element={<CreateEmployeePage mode="employee" />} />
      <Route path="employees/:id"    element={<EmployeeProfilePage />} />

      <Route path="attendance" element={<AttendanceDirectoryPage />} />
      <Route path="leaves"     element={<LeaveApprovalPage />} />
      
      {/* Payroll */}
      <Route path="payroll"                  element={<PayrollPage />} />
      <Route path="payroll/disputes"         element={<PayslipDisputesPage />} />
      <Route path="payroll/preview"          element={<PayrunPreviewPage />} />
      <Route path="payroll/payslip/:id"      element={<PayslipViewerPage />} />
      <Route path="payroll/:year/:month"     element={<PayrunDetailPage />} />

      {/* Settings */}
      <Route path="settings"         element={<SettingsPage />} />

      {/* Reports */}
      <Route path="reports"          element={<ReportsPage />} />

      <Route path="*"          element={<Navigate to="dashboard" replace />} />
    </Routes>
  );
}
