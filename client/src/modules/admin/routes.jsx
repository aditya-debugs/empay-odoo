import { Routes, Route, Navigate } from 'react-router-dom';
import { ComingSoon } from '../../features/ui';
import AdminDashboard from './pages/AdminDashboard';
import EmployeesPage from './pages/EmployeesPage';
import CreateEmployeePage from './pages/CreateEmployeePage';
import EmployeeProfilePage from './pages/EmployeeProfilePage';
import UsersPage from './pages/UsersPage';

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

      <Route path="attendance" element={<ComingSoon title="Attendance" hint="Daily / weekly / monthly views, manual override." />} />
      <Route path="leaves"     element={<ComingSoon title="Time Off" hint="Approval queue, policies, balance allocation." />} />
      <Route path="payroll"    element={<ComingSoon title="Payroll Override" hint="Reopen, bonus injection, dispute queue." />} />
      <Route path="reports"    element={<ComingSoon title="Reports" hint="Attendance, leave, payroll, headcount with exports." />} />
      <Route path="settings"   element={<ComingSoon title="Settings" hint="Company, attendance, payroll, leave, holidays." />} />
      <Route path="*"          element={<Navigate to="dashboard" replace />} />
    </Routes>
  );
}
