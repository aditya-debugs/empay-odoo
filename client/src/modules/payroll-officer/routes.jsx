import { Routes, Route, Navigate } from 'react-router-dom';
import { ComingSoon } from '../../features/ui';
import PayrollDashboard from './pages/PayrollDashboard';

export default function PayrollRoutes() {
  return (
    <Routes>
      <Route index element={<Navigate to="dashboard" replace />} />
      <Route path="dashboard" element={<PayrollDashboard />} />
      <Route path="process"   element={<ComingSoon title="Process Payroll" hint="Month selector, preview table, breakdown modal, status tracker." />} />
      <Route path="payslips"  element={<ComingSoon title="Payslips" hint="Listing, viewer, PDF download, version viewer." />} />
      <Route path="disputes"  element={<ComingSoon title="Disputes" hint="Dispute queue, resolve / reissue / reject modals." />} />
      <Route path="reports"   element={<ComingSoon title="Reports" hint="Payroll, PF, prof. tax, YTD with CSV/PDF export." />} />
      <Route path="*"         element={<Navigate to="dashboard" replace />} />
    </Routes>
  );
}
