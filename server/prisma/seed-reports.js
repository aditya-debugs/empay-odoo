const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seed() {
  console.log('🌱 Seeding report data...');

  // 1. Get or create a Payroll Officer user
  let officer = await prisma.user.findFirst({ where: { role: 'PAYROLL_OFFICER' } });
  if (!officer) {
    officer = await prisma.user.create({
      data: {
        email: 'officer@empay.com',
        name: 'Payroll Officer',
        passwordHash: '$2a$10$abcdefghijklmnopqrstuv', // Fake hash
        role: 'PAYROLL_OFFICER',
        loginId: 'OFFICER01'
      }
    });
  }

  // 2. Create sample employees
  const depts = ['Engineering', 'Sales', 'HR', 'Marketing'];
  const employees = [];
  for (let i = 0; i < 5; i++) {
    const emp = await prisma.employee.upsert({
      where: { userId: `user-emp-${i}` }, // Not a real UUID but just for uniqueness check if using uuid default
      update: {},
      create: {
        firstName: ['Amit', 'Priya', 'Raj', 'Sonia', 'Vikram'][i],
        lastName: ['Sharma', 'Patel', 'Singh', 'Verma', 'Gupta'][i],
        department: depts[i % depts.length],
        joinDate: new Date('2025-01-01'),
        basicSalary: 50000 + (i * 10000),
        status: 'ACTIVE',
        bankAccountNo: `1234567890${i}`,
        aadhaar: `12341234123${i}`,
        user: {
          create: {
            email: `emp${i}@example.com`,
            name: `Employee ${i}`,
            passwordHash: '$2a$10$abcdefghijklmnopqrstuv',
            role: 'EMPLOYEE',
            loginId: `EMP00${i}`
          }
        }
      }
    });
    employees.push(emp);
  }

  // 3. Create payslips for April and May 2026
  const months = [4, 5];
  for (const m of months) {
    for (const emp of employees) {
      const basic = Number(emp.basicSalary);
      const gross = basic * 1.5;
      const pf = basic * 0.12;
      const pt = 200;
      const ded = pf + pt;
      const net = gross - ded;

      await prisma.payslip.upsert({
        where: {
          employeeId_month_year_version: {
            employeeId: emp.id,
            month: m,
            year: 2026,
            version: 1
          }
        },
        update: {},
        create: {
          employeeId: emp.id,
          month: m,
          year: 2026,
          version: 1,
          basicSalary: basic,
          grossSalary: gross,
          totalDeductions: ded,
          netSalary: net,
          status: 'GENERATED',
          earnings: [
            { label: 'Basic Salary', amount: basic },
            { label: 'HRA', amount: basic * 0.4 }
          ],
          deductions: [
            { label: 'PF Employee', amount: pf },
            { label: 'Professional Tax', amount: pt }
          ]
        }
      });
    }
  }

  console.log('✅ Seeding complete. 5 employees and 10 payslips created/verified.');
  process.exit(0);
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
