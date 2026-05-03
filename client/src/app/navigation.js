import {
  LayoutDashboard,
  Users,
  User,
  Clock,
  CalendarDays,
  DollarSign,
  FileText,
  BarChart3,
  Settings,
  AlertCircle,
} from 'lucide-react';

// Single source of truth for sidebar nav items per role.
// Add an item here once and it appears for that role.
export const navConfig = {
  ADMIN: [
    { to: '/admin/dashboard',  label: 'Dashboard',     icon: LayoutDashboard },
    { to: '/admin/users',      label: 'Users & Roles', icon: Users },
    { to: '/admin/employees',  label: 'Employees',     icon: User },
    { to: '/admin/attendance', label: 'Attendance',    icon: Clock },
    { to: '/admin/leaves',     label: 'Time Off',      icon: CalendarDays },
    { to: '/admin/payroll',    label: 'Payroll',       icon: DollarSign },
    { to: '/admin/reports',    label: 'Reports',       icon: BarChart3 },
    { to: '/admin/settings',   label: 'Settings',      icon: Settings },
  ],
  HR_OFFICER: [
    { to: '/hr/dashboard',  label: 'Dashboard',  icon: LayoutDashboard },
    { to: '/hr/employees',  label: 'Employees',  icon: User },
    { to: '/hr/attendance', label: 'Attendance', icon: Clock },
    { to: '/hr/leaves',     label: 'Time Off',   icon: CalendarDays },
    { to: '/hr/disputes',   label: 'Disputes',   icon: AlertCircle },
  ],
  PAYROLL_OFFICER: [
    { to: '/payroll/dashboard', label: 'Dashboard',       icon: LayoutDashboard },
    { to: '/payroll/employees', label: 'Employees',       icon: User },
    { to: '/payroll/process',   label: 'Process Payroll', icon: DollarSign },
    { to: '/payroll/payslips',  label: 'Payslips',        icon: FileText },
    { to: '/payroll/disputes',  label: 'Disputes',        icon: AlertCircle },
    { to: '/payroll/reports',   label: 'Reports',         icon: BarChart3 },
  ],
  EMPLOYEE: [
    { to: '/employee/dashboard',  label: 'Dashboard',  icon: LayoutDashboard },
    { to: '/employee/profile',    label: 'My Profile', icon: User },
    { to: '/employee/directory',  label: 'Employees',  icon: Users },
    { to: '/employee/attendance', label: 'Attendance', icon: Clock },
    { to: '/employee/leaves',     label: 'Time Off',   icon: CalendarDays },
    { to: '/employee/payslips',   label: 'Payslips',   icon: FileText },
  ],
};

export const dashboardPathByRole = {
  ADMIN: '/admin/dashboard',
  HR_OFFICER: '/hr/dashboard',
  PAYROLL_OFFICER: '/payroll/dashboard',
  EMPLOYEE: '/employee/dashboard',
};

export const roleLabels = {
  ADMIN: 'Administrator',
  HR_OFFICER: 'HR Officer',
  PAYROLL_OFFICER: 'Payroll Officer',
  EMPLOYEE: 'Employee',
};
