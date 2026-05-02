// Constants + login-ID helper used by Admin pages.
// (Mock data has been removed — pages now load from /api/v1/users and /api/v1/employees.)

export const DEPARTMENTS = ['Engineering', 'Sales', 'Operations', 'HR', 'Finance', 'Marketing'];

export const ALL_ROLES = [
  { value: 'EMPLOYEE',         label: 'Employee' },
  { value: 'HR_OFFICER',       label: 'HR Officer' },
  { value: 'PAYROLL_OFFICER',  label: 'Payroll Officer' },
  { value: 'ADMIN',            label: 'Administrator' },
];

export const EMPLOYEE_ONLY_ROLE = [{ value: 'EMPLOYEE', label: 'Employee' }];

export const EMPLOYMENT_TYPES = [
  { value: 'FULL_TIME', label: 'Full-time' },
  { value: 'PART_TIME', label: 'Part-time' },
  { value: 'CONTRACT',  label: 'Contract' },
];

// Login-ID preview helper — mirrors the backend generator but uses a placeholder
// serial since the real serial is assigned at save time (server-side count).
export function getCompanyPrefix(name) {
  const words = (name || '').trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return 'XX';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase().padEnd(2, 'X');
  return (words[0][0] + words[1][0]).toUpperCase();
}

export function previewLoginId({ companyName = 'EmPay', firstName = '', lastName = '', joinDate = new Date() }) {
  const co = getCompanyPrefix(companyName);
  const initials = (
    (firstName.slice(0, 2) || '__') + (lastName.slice(0, 2) || '__')
  ).toUpperCase();
  const year = new Date(joinDate).getFullYear();
  return `${co}${initials}${year}????`;
}
