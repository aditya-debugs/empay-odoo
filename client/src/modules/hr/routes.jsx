import { Routes, Route, Navigate } from 'react-router-dom';
import HRDashboard from './pages/HRDashboard';
import EmployeeDirectory from './pages/EmployeeDirectory';
import CreateEmployeePage from './pages/CreateEmployeePage';
import EmployeeFormPage from './pages/EmployeeFormPage';
import HREmployeeProfilePage from './pages/HREmployeeProfilePage';
import HRAttendanceView from './pages/HRAttendanceView';
import HRLeaveQueue from './pages/HRLeaveQueue';
import HRDisputesPage from './pages/HRDisputesPage';

export default function HRRoutes() {
  return (
    <Routes>
      <Route index element={<Navigate to="dashboard" replace />} />
      <Route path="dashboard" element={<HRDashboard />} />

      {/* Employee Management */}
      <Route path="employees" element={<EmployeeDirectory />} />
      <Route path="employees/new" element={<CreateEmployeePage />} />
      <Route path="employees/:id" element={<HREmployeeProfilePage />} />

      {/* Attendance Monitor */}
      <Route path="attendance" element={<HRAttendanceView />} />

      {/* Leave Management */}
      <Route path="leaves"               element={<HRLeaveQueue />} />

      {/* Disputes */}
      <Route path="disputes"             element={<HRDisputesPage />} />
      
      <Route path="*"                    element={<Navigate to="dashboard" replace />} />
    </Routes>
  );
}



