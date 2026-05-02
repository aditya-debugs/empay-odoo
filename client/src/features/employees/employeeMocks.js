// Mock data for Phase 3 demo. Replace with /api/v1/employees once
// the backend slice is implemented.

export const DEPARTMENTS = ['Engineering', 'Sales', 'Operations', 'HR', 'Finance', 'Marketing'];
export const ROLES = [
  { value: 'EMPLOYEE',         label: 'Employee' },
  { value: 'HR_OFFICER',       label: 'HR Officer' },
  { value: 'PAYROLL_OFFICER',  label: 'Payroll Officer' },
];
export const EMPLOYMENT_TYPES = [
  { value: 'FULL_TIME', label: 'Full-time' },
  { value: 'PART_TIME', label: 'Part-time' },
  { value: 'CONTRACT',  label: 'Contract' },
];

export const employees = [
  {
    id: 'emp-001', loginId: 'EPSACH20240001',
    firstName: 'Sarah', lastName: 'Chen',
    workEmail: 'sarah.chen@empay.test', personalEmail: 'sarah@gmail.com',
    phone: '+91 98765 43210', gender: 'FEMALE', dob: '1995-04-12',
    department: 'Engineering', position: 'Senior Designer',
    role: 'EMPLOYEE', employmentType: 'FULL_TIME',
    joinDate: '2024-01-15',
    attendanceStatus: 'PRESENT',
    basicSalary: 80000, hra: 32000, conveyance: 1600, specialAllowance: 5000, otherAllowance: 0,
    pfEnabled: true, pfPercent: 12, professionalTax: 200,
    bankName: 'HDFC Bank', bankBranch: 'Koramangala', bankAccountNo: '50100123456789', bankIfsc: 'HDFC0001234',
  },
  {
    id: 'emp-002', loginId: 'EPMIJO20230015',
    firstName: 'Mike', lastName: 'Johnson',
    workEmail: 'mike.johnson@empay.test', personalEmail: 'mike@gmail.com',
    phone: '+91 98765 43211', gender: 'MALE', dob: '1992-09-03',
    department: 'Engineering', position: 'Backend Developer',
    role: 'EMPLOYEE', employmentType: 'FULL_TIME',
    joinDate: '2023-06-01',
    attendanceStatus: 'ON_LEAVE',
    basicSalary: 90000, hra: 36000, conveyance: 1600, specialAllowance: 6000, otherAllowance: 0,
    pfEnabled: true, pfPercent: 12, professionalTax: 200,
    bankName: 'ICICI Bank', bankBranch: 'Indiranagar', bankAccountNo: '12345678901234', bankIfsc: 'ICIC0001234',
  },
  {
    id: 'emp-003', loginId: 'EPPRPA20220003',
    firstName: 'Priya', lastName: 'Patel',
    workEmail: 'priya.patel@empay.test', personalEmail: 'priya@gmail.com',
    phone: '+91 98765 43212', gender: 'FEMALE', dob: '1990-12-20',
    department: 'HR', position: 'HR Specialist',
    role: 'HR_OFFICER', employmentType: 'FULL_TIME',
    joinDate: '2022-03-10',
    attendanceStatus: 'PRESENT',
    basicSalary: 75000, hra: 30000, conveyance: 1600, specialAllowance: 4000, otherAllowance: 0,
    pfEnabled: true, pfPercent: 12, professionalTax: 200,
    bankName: 'Axis Bank', bankBranch: 'MG Road', bankAccountNo: '98765432109876', bankIfsc: 'UTIB0001234',
  },
  {
    id: 'emp-004', loginId: 'EPALRI20240007',
    firstName: 'Alex', lastName: 'Rivera',
    workEmail: 'alex.rivera@empay.test', personalEmail: 'alex@gmail.com',
    phone: '+91 98765 43213', gender: 'MALE', dob: '1988-07-22',
    department: 'Sales', position: 'Sales Lead',
    role: 'EMPLOYEE', employmentType: 'FULL_TIME',
    joinDate: '2024-02-01',
    attendanceStatus: 'ABSENT',
    basicSalary: 85000, hra: 34000, conveyance: 1600, specialAllowance: 5500, otherAllowance: 0,
    pfEnabled: true, pfPercent: 12, professionalTax: 200,
    bankName: 'SBI', bankBranch: 'Whitefield', bankAccountNo: '11223344556677', bankIfsc: 'SBIN0001234',
  },
  {
    id: 'emp-005', loginId: 'EPJOSM20210001',
    firstName: 'John', lastName: 'Smith',
    workEmail: 'john.smith@empay.test', personalEmail: 'john@gmail.com',
    phone: '+91 98765 43214', gender: 'MALE', dob: '1985-03-15',
    department: 'Operations', position: 'Operations Manager',
    role: 'EMPLOYEE', employmentType: 'FULL_TIME',
    joinDate: '2021-08-20',
    attendanceStatus: 'PRESENT',
    basicSalary: 110000, hra: 44000, conveyance: 1600, specialAllowance: 8000, otherAllowance: 0,
    pfEnabled: true, pfPercent: 12, professionalTax: 200,
    bankName: 'HDFC Bank', bankBranch: 'HSR Layout', bankAccountNo: '88899900011122', bankIfsc: 'HDFC0001234',
  },
  {
    id: 'emp-006', loginId: 'EPEMWI20230009',
    firstName: 'Emily', lastName: 'Wilson',
    workEmail: 'emily.wilson@empay.test', personalEmail: 'emily@gmail.com',
    phone: '+91 98765 43215', gender: 'FEMALE', dob: '1993-11-08',
    department: 'Marketing', position: 'Marketing Specialist',
    role: 'EMPLOYEE', employmentType: 'FULL_TIME',
    joinDate: '2023-04-15',
    attendanceStatus: 'PRESENT',
    basicSalary: 70000, hra: 28000, conveyance: 1600, specialAllowance: 4500, otherAllowance: 0,
    pfEnabled: true, pfPercent: 12, professionalTax: 200,
    bankName: 'ICICI Bank', bankBranch: 'Brigade Road', bankAccountNo: '33344455566677', bankIfsc: 'ICIC0001234',
  },
  {
    id: 'emp-007', loginId: 'EPDALE20240012',
    firstName: 'David', lastName: 'Lee',
    workEmail: 'david.lee@empay.test', personalEmail: 'david@gmail.com',
    phone: '+91 98765 43216', gender: 'MALE', dob: '1991-05-30',
    department: 'Finance', position: 'Accountant',
    role: 'PAYROLL_OFFICER', employmentType: 'FULL_TIME',
    joinDate: '2024-06-01',
    attendanceStatus: 'ON_LEAVE',
    basicSalary: 95000, hra: 38000, conveyance: 1600, specialAllowance: 6500, otherAllowance: 0,
    pfEnabled: true, pfPercent: 12, professionalTax: 200,
    bankName: 'Axis Bank', bankBranch: 'JP Nagar', bankAccountNo: '44455566677788', bankIfsc: 'UTIB0001234',
  },
  {
    id: 'emp-008', loginId: 'EPLIWO20230020',
    firstName: 'Lisa', lastName: 'Wong',
    workEmail: 'lisa.wong@empay.test', personalEmail: 'lisa@gmail.com',
    phone: '+91 98765 43217', gender: 'FEMALE', dob: '1996-08-19',
    department: 'Engineering', position: 'Frontend Developer',
    role: 'EMPLOYEE', employmentType: 'CONTRACT',
    joinDate: '2023-09-12',
    attendanceStatus: 'PRESENT',
    basicSalary: 85000, hra: 34000, conveyance: 1600, specialAllowance: 5500, otherAllowance: 0,
    pfEnabled: false, pfPercent: 0, professionalTax: 200,
    bankName: 'Kotak Bank', bankBranch: 'Bellandur', bankAccountNo: '55566677788899', bankIfsc: 'KKBK0001234',
  },
];

export function findEmployee(id) {
  return employees.find((e) => e.id === id);
}

// Login ID generator: [Company prefix][First+last name initials][Year][Serial]
// Example for "EmPay" + "John Doe" + 2024 + serial 5 → "EPJODO20240005"
export function generateLoginId({ companyName = 'EmPay', firstName = '', lastName = '', joinDate = new Date(), serial = 1 }) {
  const co = (companyName || '')
    .split(/\s+/).filter(Boolean)
    .map((w) => w[0]?.toUpperCase() || '')
    .join('')
    .slice(0, 2)
    .padEnd(2, 'X');
  const initials = (
    (firstName.slice(0, 2) || 'XX') + (lastName.slice(0, 2) || 'XX')
  ).toUpperCase();
  const year = new Date(joinDate).getFullYear();
  const serialStr = String(serial).padStart(4, '0');
  return `${co}${initials}${year}${serialStr}`;
}
