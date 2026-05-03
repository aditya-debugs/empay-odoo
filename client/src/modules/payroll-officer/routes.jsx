import { Routes, Route, Navigate } from 'react-router-dom';
import PayrollDashboard from './pages/PayrollDashboard';
import ProcessPayroll from './pages/ProcessPayroll';
import EmployeesList from './pages/EmployeesList';
import Payslips from './pages/Payslips';
import PayslipDetail from './pages/PayslipDetail';
import Disputes from './pages/Disputes';
import Reports from './pages/Reports';

export default function PayrollRoutes() {
  return (
    <Routes>
      <Route index element={<Navigate to="dashboard" replace />} />
      <Route path="dashboard" element={<PayrollDashboard />} />
      <Route path="process" element={<ProcessPayroll />} />
      <Route path="employees" element={<EmployeesList />} />
      <Route path="payslips" element={<Payslips />} />
      <Route path="payslip/:id" element={<PayslipDetail />} />
      <Route path="disputes" element={<Disputes />} />
      <Route path="reports" element={<Reports />} />
      <Route path="*" element={<Navigate to="dashboard" replace />} />
    </Routes>
  );
}



