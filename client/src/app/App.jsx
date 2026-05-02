import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '../features/auth/AuthContext';
import LoginPage from '../features/auth/LoginPage';
import SignupPage from '../modules/admin/auth/SignupPage';
import VerifyEmailPage from '../modules/admin/auth/VerifyEmailPage';
import AdminRoutes from '../modules/admin/routes';
import HRRoutes from '../modules/hr/routes';
import PayrollRoutes from '../modules/payroll-officer/routes';
import EmployeeRoutes from '../modules/employee/routes';
import StylePreview from './StylePreview';
import ProtectedRoute from './ProtectedRoute';
import AppLayout from './layouts/AppLayout';
import { dashboardPathByRole } from './navigation';

function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={dashboardPathByRole[user.role] || '/login'} replace />;
}

function ProtectedShell({ allowedRoles, children }) {
  return (
    <ProtectedRoute allowedRoles={allowedRoles}>
      <AppLayout>{children}</AppLayout>
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<RootRedirect />} />

          {/* Public auth routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/admin/signup" element={<SignupPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />

          {/* Role-protected sections */}
          <Route
            path="/admin/*"
            element={<ProtectedShell allowedRoles={['ADMIN']}><AdminRoutes /></ProtectedShell>}
          />
          <Route
            path="/hr/*"
            element={<ProtectedShell allowedRoles={['HR_OFFICER']}><HRRoutes /></ProtectedShell>}
          />
          <Route
            path="/payroll/*"
            element={<ProtectedShell allowedRoles={['PAYROLL_OFFICER']}><PayrollRoutes /></ProtectedShell>}
          />
          <Route
            path="/employee/*"
            element={<ProtectedShell allowedRoles={['EMPLOYEE']}><EmployeeRoutes /></ProtectedShell>}
          />

          {/* Dev */}
          <Route path="/_preview" element={<StylePreview />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
