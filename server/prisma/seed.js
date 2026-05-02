const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

function getOdooId(firstName, lastName, year, serial) {
  const co = 'OI';
  const initials = (
    (firstName.slice(0, 2) || 'XX') + (lastName.slice(0, 2) || 'XX')
  ).toUpperCase();
  const ser = String(serial).padStart(4, '0');
  return `${co}${initials}${year}${ser}`;
}

async function main() {
  const DEFAULT_PASSWORD = 'admin123';
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);
  const companyName = 'Odoo India';
  const joinYear = 2023;

  console.log('--- Cleaning up existing data ---');
  try {
    await prisma.attendanceLog.deleteMany();
    await prisma.attendanceRegularization.deleteMany();
    await prisma.attendance.deleteMany();
    await prisma.leave.deleteMany();
    await prisma.leaveAllocation.deleteMany();
    await prisma.payslipDispute.deleteMany();
    await prisma.payslip.deleteMany();
    await prisma.employee.deleteMany();
    await prisma.user.deleteMany();
    await prisma.orgSettings.deleteMany();
  } catch (err) {
    console.log('Cleanup skipped (DB may be empty):', err.message);
  }

  console.log('--- Seeding Users ---');

  // 1. Admin
  await prisma.user.create({
    data: {
      email: 'admin@empay.com',
      loginId: getOdooId('Super', 'Admin', joinYear, 1),
      passwordHash,
      name: 'Super Admin',
      role: 'ADMIN',
      companyName,
      isActive: true,
    }
  });

  // 2. HR Staff
  const hrStaff = [
    { f: 'Sarah',   l: 'HR',        email: 'sarah@empay.com' },
    { f: 'Michael', l: 'Recruiter', email: 'michael@empay.com' },
    { f: 'Jessica', l: 'People',    email: 'jessica@empay.com' },
  ];

  for (let i = 0; i < hrStaff.length; i++) {
    await prisma.user.create({
      data: {
        email: hrStaff[i].email,
        loginId: getOdooId(hrStaff[i].f, hrStaff[i].l, joinYear, i + 1),
        passwordHash,
        name: `${hrStaff[i].f} ${hrStaff[i].l}`,
        role: 'HR_OFFICER',
        companyName,
        isActive: true,
      }
    });
  }

  // 3. Payroll Staff
  const payrollStaff = [
    { f: 'David', l: 'Finance',  email: 'david@empay.com' },
    { f: 'Emma',  l: 'Accounts', email: 'emma@empay.com' },
  ];

  for (let i = 0; i < payrollStaff.length; i++) {
    await prisma.user.create({
      data: {
        email: payrollStaff[i].email,
        loginId: getOdooId(payrollStaff[i].f, payrollStaff[i].l, joinYear, i + 1),
        passwordHash,
        name: `${payrollStaff[i].f} ${payrollStaff[i].l}`,
        role: 'PAYROLL_OFFICER',
        companyName,
        isActive: true,
      }
    });
  }

  // 4. Employees (15) with attendance + leave allocations
  const depts      = ['Engineering', 'Sales', 'Marketing', 'Operations', 'Finance'];
  const firstNames = ['John','Alice','Bob','Charlie','Diana','Edward','Fiona','George','Hannah','Ian','Julia','Kevin','Laura','Mark','Nancy'];
  const lastNames  = ['Smith','Johnson','Williams','Brown','Jones','Garcia','Miller','Davis','Rodriguez','Martinez','Hernandez','Lopez','Gonzalez','Wilson','Anderson'];

  for (let i = 0; i < 15; i++) {
    const fName  = firstNames[i];
    const lName  = lastNames[i];
    const email  = `${fName.toLowerCase()}@empay.com`;
    const loginId = getOdooId(fName, lName, joinYear, i + 1);

    const user = await prisma.user.create({
      data: {
        email,
        loginId,
        passwordHash,
        name: `${fName} ${lName}`,
        role: 'EMPLOYEE',
        companyName,
        isActive: true,
      }
    });

    const basic = 35000 + (i * 2000);
    const employee = await prisma.employee.create({
      data: {
        userId:           user.id,
        firstName:        fName,
        lastName:         lName,
        gender:           i % 2 === 0 ? 'MALE' : 'FEMALE',
        department:       depts[i % depts.length],
        position:         'Software Engineer',
        joinDate:         new Date('2023-01-15'),
        dob:              new Date('1992-08-12'),
        basicSalary:      basic,
        hra:              basic * 0.4,
        conveyance:       1600,
        specialAllowance: 5000,
        otherAllowance:   1000,
        pfEnabled:        true,
        professionalTax:  200,
        pan:              `ABCDE${2000 + i}P`,
        aadhaar:          `44443333222${i}`,
        bankName:         'ICICI Bank',
        bankAccountNo:    `000111222${i}33`,
        bankIfsc:         'ICIC00001',
      }
    });

    // Attendance: last 7 weekdays with IN/OUT logs
    const today = new Date();
    for (let j = 0; j < 7; j++) {
      const date = new Date(today);
      date.setDate(today.getDate() - j);
      date.setHours(0, 0, 0, 0);
      if (date.getDay() === 0) continue; // skip Sunday

      const checkIn  = new Date(date); checkIn.setHours(9, 0, 0, 0);
      const checkOut = new Date(date); checkOut.setHours(18, 0, 0, 0);

      const att = await prisma.attendance.create({
        data: {
          employeeId:  employee.id,
          date,
          checkIn,
          checkOut,
          hoursWorked: 9.0,
          status:      'PRESENT',
        }
      });

      // Create IN and OUT logs for each attendance record
      await prisma.attendanceLog.createMany({
        data: [
          { attendanceId: att.id, type: 'IN',  timestamp: checkIn },
          { attendanceId: att.id, type: 'OUT', timestamp: checkOut },
        ]
      });
    }

    // Leave allocations for current year
    const year = new Date().getFullYear();
    await prisma.leaveAllocation.createMany({
      data: [
        { employeeId: employee.id, type: 'PAID_LEAVE',   year, totalDays: 24 },
        { employeeId: employee.id, type: 'SICK_LEAVE',   year, totalDays: 12 },
        { employeeId: employee.id, type: 'CASUAL_LEAVE', year, totalDays: 8  },
      ]
    });
  }

  console.log('--- Seeding Complete! ---');
  console.log('All users password: admin123');
  console.log('Admin:   admin@empay.com');
  console.log('Employees: john@empay.com, alice@empay.com, bob@empay.com ... (15 total)');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
