const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

const PASSWORD = 'admin123';
const COMPANY_NAME = 'EmPay Corp';

// Mirrors the exact logic from server/src/utils/loginId.js
function getCompanyPrefix(name) {
  const words = (name || '').trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return 'XX';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase().padEnd(2, 'X');
  return (words[0][0] + words[1][0]).toUpperCase();
}

function generateLoginId(companyName, firstName, lastName, joinDate, serial) {
  const co = getCompanyPrefix(companyName);
  const initials = (
    (firstName.slice(0, 2) || 'XX') + (lastName.slice(0, 2) || 'XX')
  ).toUpperCase();
  const year = new Date(joinDate).getFullYear();
  return `${co}${initials}${year}${String(serial).padStart(4, '0')}`;
}

const EMPLOYEES = [
  {
    email: 'john.smith@empay.com', name: 'John Smith',
    firstName: 'John', lastName: 'Smith',
    department: 'Engineering', position: 'Senior Software Engineer',
    gender: 'MALE', dob: new Date('1990-03-15'),
    personalEmail: 'john.personal@gmail.com', personalPhone: '9876543210',
    phone: '9876543210',
    employmentType: 'FULL_TIME', joinDate: new Date('2021-06-01'),
    basicSalary: 85000, hra: 34000, conveyance: 1600, specialAllowance: 12000, otherAllowance: 5000,
    pfEnabled: true, pfPercent: 12, professionalTax: 200,
    pan: 'ABCPJ1234D', aadhaar: '1234 5678 9012',
    bankName: 'HDFC Bank', bankBranch: 'Andheri West', bankAccountNo: '50100123456789', bankIfsc: 'HDFC0001234',
    aboutMe: 'Passionate engineer with 6+ years in full-stack development.',
    skills: ['React', 'Node.js', 'PostgreSQL', 'Docker'],
  },
  {
    email: 'alice.johnson@empay.com', name: 'Alice Johnson',
    firstName: 'Alice', lastName: 'Johnson',
    department: 'Product', position: 'Product Manager',
    gender: 'FEMALE', dob: new Date('1988-07-22'),
    personalEmail: 'alice.j@gmail.com', personalPhone: '9988776655',
    phone: '9988776655',
    employmentType: 'FULL_TIME', joinDate: new Date('2020-03-15'),
    basicSalary: 95000, hra: 38000, conveyance: 1600, specialAllowance: 15000, otherAllowance: 8000,
    pfEnabled: true, pfPercent: 12, professionalTax: 200,
    pan: 'BCDPK2345E', aadhaar: '2345 6789 0123',
    bankName: 'ICICI Bank', bankBranch: 'Bandra', bankAccountNo: '000305123456', bankIfsc: 'ICIC0000305',
    aboutMe: 'Strategic product thinker with a passion for user-centric design.',
    skills: ['Product Strategy', 'Agile', 'Figma', 'Data Analysis'],
  },
  {
    email: 'bob.williams@empay.com', name: 'Bob Williams',
    firstName: 'Bob', lastName: 'Williams',
    department: 'Engineering', position: 'Backend Engineer',
    gender: 'MALE', dob: new Date('1993-11-05'),
    personalEmail: 'bobw@yahoo.com', personalPhone: '9123456780',
    phone: '9123456780',
    employmentType: 'FULL_TIME', joinDate: new Date('2022-01-10'),
    basicSalary: 70000, hra: 28000, conveyance: 1600, specialAllowance: 9000, otherAllowance: 3000,
    pfEnabled: true, pfPercent: 12, professionalTax: 200,
    pan: 'CDEPL3456F', aadhaar: '3456 7890 1234',
    bankName: 'SBI', bankBranch: 'Powai', bankAccountNo: '31234567890', bankIfsc: 'SBIN0001234',
    aboutMe: 'Backend specialist focused on scalable microservices.',
    skills: ['Java', 'Spring Boot', 'Kafka', 'Redis'],
  },
  {
    email: 'carol.davis@empay.com', name: 'Carol Davis',
    firstName: 'Carol', lastName: 'Davis',
    department: 'HR', position: 'HR Business Partner',
    gender: 'FEMALE', dob: new Date('1991-05-18'),
    personalEmail: 'carol.d@gmail.com', personalPhone: '9234567891',
    phone: '9234567891',
    employmentType: 'FULL_TIME', joinDate: new Date('2019-08-20'),
    basicSalary: 65000, hra: 26000, conveyance: 1600, specialAllowance: 8000, otherAllowance: 2500,
    pfEnabled: true, pfPercent: 12, professionalTax: 200,
    pan: 'DEFPM4567G', aadhaar: '4567 8901 2345',
    bankName: 'Axis Bank', bankBranch: 'Goregaon', bankAccountNo: '915010012345678', bankIfsc: 'UTIB0001234',
    aboutMe: 'HR professional specializing in talent management and culture building.',
    skills: ['Recruitment', 'Employee Relations', 'HRMS', 'Training & Development'],
  },
  {
    email: 'david.martinez@empay.com', name: 'David Martinez',
    firstName: 'David', lastName: 'Martinez',
    department: 'Finance', position: 'Financial Analyst',
    gender: 'MALE', dob: new Date('1987-09-30'),
    personalEmail: 'david.m@outlook.com', personalPhone: '9345678902',
    phone: '9345678902',
    employmentType: 'FULL_TIME', joinDate: new Date('2018-04-05'),
    basicSalary: 75000, hra: 30000, conveyance: 1600, specialAllowance: 10000, otherAllowance: 4000,
    pfEnabled: true, pfPercent: 12, professionalTax: 200,
    pan: 'EFGPN5678H', aadhaar: '5678 9012 3456',
    bankName: 'Kotak Mahindra Bank', bankBranch: 'Malad', bankAccountNo: '1234567890123', bankIfsc: 'KKBK0001234',
    aboutMe: 'Finance analyst with expertise in budgeting, forecasting and compliance.',
    skills: ['Financial Modeling', 'Excel', 'SAP', 'Tally'],
  },
  {
    email: 'emily.brown@empay.com', name: 'Emily Brown',
    firstName: 'Emily', lastName: 'Brown',
    department: 'Design', position: 'UX Designer',
    gender: 'FEMALE', dob: new Date('1994-02-14'),
    personalEmail: 'emilybrown@gmail.com', personalPhone: '9456789013',
    phone: '9456789013',
    employmentType: 'FULL_TIME', joinDate: new Date('2022-07-18'),
    basicSalary: 68000, hra: 27200, conveyance: 1600, specialAllowance: 8500, otherAllowance: 2000,
    pfEnabled: true, pfPercent: 12, professionalTax: 200,
    pan: 'FGHPO6789I', aadhaar: '6789 0123 4567',
    bankName: 'HDFC Bank', bankBranch: 'Juhu', bankAccountNo: '50100987654321', bankIfsc: 'HDFC0009876',
    aboutMe: 'Creative UX designer passionate about intuitive and accessible digital experiences.',
    skills: ['Figma', 'User Research', 'Prototyping', 'Design Systems'],
  },
  {
    email: 'frank.wilson@empay.com', name: 'Frank Wilson',
    firstName: 'Frank', lastName: 'Wilson',
    department: 'Sales', position: 'Sales Executive',
    gender: 'MALE', dob: new Date('1992-08-25'),
    personalEmail: 'frankwilson@yahoo.com', personalPhone: '9567890124',
    phone: '9567890124',
    employmentType: 'FULL_TIME', joinDate: new Date('2021-11-01'),
    basicSalary: 55000, hra: 22000, conveyance: 1600, specialAllowance: 7000, otherAllowance: 3000,
    pfEnabled: true, pfPercent: 12, professionalTax: 200,
    pan: 'GHIPP7890J', aadhaar: '7890 1234 5678',
    bankName: 'SBI', bankBranch: 'Borivali', bankAccountNo: '41234567890', bankIfsc: 'SBIN0005678',
    aboutMe: 'Results-driven sales professional with strong client relationship skills.',
    skills: ['CRM', 'Negotiation', 'Lead Generation', 'Salesforce'],
  },
  {
    email: 'grace.lee@empay.com', name: 'Grace Lee',
    firstName: 'Grace', lastName: 'Lee',
    department: 'Engineering', position: 'Frontend Developer',
    gender: 'FEMALE', dob: new Date('1996-01-10'),
    personalEmail: 'graceylee@gmail.com', personalPhone: '9678901235',
    phone: '9678901235',
    employmentType: 'FULL_TIME', joinDate: new Date('2023-02-20'),
    basicSalary: 60000, hra: 24000, conveyance: 1600, specialAllowance: 7500, otherAllowance: 2000,
    pfEnabled: true, pfPercent: 12, professionalTax: 200,
    pan: 'HIJPQ8901K', aadhaar: '8901 2345 6789',
    bankName: 'ICICI Bank', bankBranch: 'Versova', bankAccountNo: '000305654321', bankIfsc: 'ICIC0000654',
    aboutMe: 'Frontend developer who loves building elegant UI with modern frameworks.',
    skills: ['React', 'TypeScript', 'Tailwind CSS', 'Next.js'],
  },
  {
    email: 'henry.taylor@empay.com', name: 'Henry Taylor',
    firstName: 'Henry', lastName: 'Taylor',
    department: 'DevOps', position: 'DevOps Engineer',
    gender: 'MALE', dob: new Date('1989-06-03'),
    personalEmail: 'henryt@outlook.com', personalPhone: '9789012346',
    phone: '9789012346',
    employmentType: 'FULL_TIME', joinDate: new Date('2020-09-01'),
    basicSalary: 90000, hra: 36000, conveyance: 1600, specialAllowance: 13000, otherAllowance: 5000,
    pfEnabled: true, pfPercent: 12, professionalTax: 200,
    pan: 'IJKPR9012L', aadhaar: '9012 3456 7890',
    bankName: 'Axis Bank', bankBranch: 'Santacruz', bankAccountNo: '915010087654321', bankIfsc: 'UTIB0005678',
    aboutMe: 'Cloud and DevOps engineer specializing in CI/CD and infrastructure automation.',
    skills: ['AWS', 'Kubernetes', 'Docker', 'Terraform', 'Jenkins'],
  },
  {
    email: 'isabel.anderson@empay.com', name: 'Isabel Anderson',
    firstName: 'Isabel', lastName: 'Anderson',
    department: 'Marketing', position: 'Marketing Manager',
    gender: 'FEMALE', dob: new Date('1986-12-07'),
    personalEmail: 'isabelann@gmail.com', personalPhone: '9890123457',
    phone: '9890123457',
    employmentType: 'FULL_TIME', joinDate: new Date('2017-05-15'),
    basicSalary: 88000, hra: 35200, conveyance: 1600, specialAllowance: 12500, otherAllowance: 6000,
    pfEnabled: true, pfPercent: 12, professionalTax: 200,
    pan: 'JKLPS0123M', aadhaar: '0123 4567 8901',
    bankName: 'Kotak Mahindra Bank', bankBranch: 'Andheri East', bankAccountNo: '9876543210123', bankIfsc: 'KKBK0005678',
    aboutMe: 'Marketing leader with 10+ years of experience in brand strategy and digital campaigns.',
    skills: ['Digital Marketing', 'SEO', 'Content Strategy', 'Google Analytics'],
  },
  {
    email: 'james.thomas@empay.com', name: 'James Thomas',
    firstName: 'James', lastName: 'Thomas',
    department: 'Engineering', position: 'QA Engineer',
    gender: 'MALE', dob: new Date('1995-04-28'),
    personalEmail: 'jamest@yahoo.com', personalPhone: '9901234568',
    phone: '9901234568',
    employmentType: 'FULL_TIME', joinDate: new Date('2022-04-11'),
    basicSalary: 58000, hra: 23200, conveyance: 1600, specialAllowance: 7200, otherAllowance: 1800,
    pfEnabled: true, pfPercent: 12, professionalTax: 200,
    pan: 'KLMPT1234N', aadhaar: '1234 5678 9013',
    bankName: 'SBI', bankBranch: 'Thane', bankAccountNo: '51234567890', bankIfsc: 'SBIN0009012',
    aboutMe: 'QA engineer passionate about software quality and automated testing.',
    skills: ['Selenium', 'Jest', 'Cypress', 'Postman', 'JIRA'],
  },
  {
    email: 'karen.white@empay.com', name: 'Karen White',
    firstName: 'Karen', lastName: 'White',
    department: 'Finance', position: 'Accountant',
    gender: 'FEMALE', dob: new Date('1990-10-16'),
    personalEmail: 'karenw@gmail.com', personalPhone: '9012345679',
    phone: '9012345679',
    employmentType: 'FULL_TIME', joinDate: new Date('2019-12-02'),
    basicSalary: 62000, hra: 24800, conveyance: 1600, specialAllowance: 7800, otherAllowance: 2200,
    pfEnabled: true, pfPercent: 12, professionalTax: 200,
    pan: 'LMNPU2345O', aadhaar: '2345 6789 0124',
    bankName: 'HDFC Bank', bankBranch: 'Mulund', bankAccountNo: '50100111222333', bankIfsc: 'HDFC0004567',
    aboutMe: 'Certified accountant with expertise in GST, TDS and financial reporting.',
    skills: ['Tally', 'GST Filing', 'TDS', 'Zoho Books'],
  },
  {
    email: 'liam.harris@empay.com', name: 'Liam Harris',
    firstName: 'Liam', lastName: 'Harris',
    department: 'Sales', position: 'Sales Manager',
    gender: 'MALE', dob: new Date('1985-07-09'),
    personalEmail: 'liamharris@outlook.com', personalPhone: '9123450680',
    phone: '9123450680',
    employmentType: 'FULL_TIME', joinDate: new Date('2016-03-08'),
    basicSalary: 92000, hra: 36800, conveyance: 1600, specialAllowance: 14000, otherAllowance: 7000,
    pfEnabled: true, pfPercent: 12, professionalTax: 200,
    pan: 'MNOPV3456P', aadhaar: '3456 7890 1235',
    bankName: 'ICICI Bank', bankBranch: 'Dadar', bankAccountNo: '000305765432', bankIfsc: 'ICIC0000765',
    aboutMe: 'Sales manager with a proven track record of exceeding quarterly targets.',
    skills: ['Team Management', 'Sales Strategy', 'HubSpot', 'Key Account Management'],
  },
  {
    email: 'mia.jackson@empay.com', name: 'Mia Jackson',
    firstName: 'Mia', lastName: 'Jackson',
    department: 'Design', position: 'Graphic Designer',
    gender: 'FEMALE', dob: new Date('1997-03-21'),
    personalEmail: 'miaj@gmail.com', personalPhone: '9234561791',
    phone: '9234561791',
    employmentType: 'FULL_TIME', joinDate: new Date('2023-08-14'),
    basicSalary: 52000, hra: 20800, conveyance: 1600, specialAllowance: 6500, otherAllowance: 1500,
    pfEnabled: true, pfPercent: 12, professionalTax: 200,
    pan: 'NOPQW4567Q', aadhaar: '4567 8901 2346',
    bankName: 'Axis Bank', bankBranch: 'Kandivali', bankAccountNo: '915010034567890', bankIfsc: 'UTIB0009012',
    aboutMe: 'Visual storyteller with a knack for brand identity and motion graphics.',
    skills: ['Adobe Illustrator', 'Photoshop', 'After Effects', 'Canva'],
  },
  {
    email: 'noah.martin@empay.com', name: 'Noah Martin',
    firstName: 'Noah', lastName: 'Martin',
    department: 'Engineering', position: 'Data Engineer',
    gender: 'MALE', dob: new Date('1991-11-30'),
    personalEmail: 'noahm@yahoo.com', personalPhone: '9345672802',
    phone: '9345672802',
    employmentType: 'FULL_TIME', joinDate: new Date('2021-02-22'),
    basicSalary: 80000, hra: 32000, conveyance: 1600, specialAllowance: 11000, otherAllowance: 4500,
    pfEnabled: true, pfPercent: 12, professionalTax: 200,
    pan: 'OPQRX5678R', aadhaar: '5678 9012 3457',
    bankName: 'Kotak Mahindra Bank', bankBranch: 'Chembur', bankAccountNo: '1234567890456', bankIfsc: 'KKBK0009012',
    aboutMe: 'Data engineer building pipelines that power business intelligence at scale.',
    skills: ['Python', 'Spark', 'Airflow', 'BigQuery', 'dbt'],
  },
];

const HR_USERS = [
  {
    email: 'sarah.hr@empay.com', name: 'Sarah HR',
    role: 'HR_OFFICER', phone: '9000000001', companyName: 'EmPay Corp',
  },
];

const PAYROLL_USERS = [
  {
    email: 'david.finance@empay.com', name: 'David Finance',
    role: 'PAYROLL_OFFICER', phone: '9000000002', companyName: 'EmPay Corp',
  },
];

function getWorkingDaysInMonth(year, month) {
  const days = [];
  const date = new Date(year, month - 1, 1);
  while (date.getMonth() === month - 1) {
    const dow = date.getDay();
    if (dow !== 0 && dow !== 6) days.push(new Date(date));
    date.setDate(date.getDate() + 1);
  }
  return days;
}

// Track serial numbers per join year across all employees
const yearSerials = {};

async function seedEmployee(emp, passwordHash) {
  const joinYear = new Date(emp.joinDate).getFullYear();
  yearSerials[joinYear] = (yearSerials[joinYear] || 0) + 1;
  const loginId = generateLoginId(COMPANY_NAME, emp.firstName, emp.lastName, emp.joinDate, yearSerials[joinYear]);

  const user = await prisma.user.create({
    data: {
      email: emp.email,
      loginId,
      passwordHash,
      name: emp.name,
      role: 'EMPLOYEE',
      companyName: COMPANY_NAME,
      phone: emp.phone,
      isActive: true,
      mustChangePassword: false,
    }
  });

  const employee = await prisma.employee.create({
    data: {
      userId: user.id,
      firstName: emp.firstName,
      lastName: emp.lastName,
      phone: emp.phone,
      personalEmail: emp.personalEmail,
      personalPhone: emp.personalPhone,
      gender: emp.gender,
      dob: emp.dob,
      department: emp.department,
      position: emp.position,
      joinDate: emp.joinDate,
      employmentType: emp.employmentType,
      status: 'ACTIVE',
      basicSalary: emp.basicSalary,
      hra: emp.hra,
      conveyance: emp.conveyance,
      specialAllowance: emp.specialAllowance,
      otherAllowance: emp.otherAllowance,
      pfEnabled: emp.pfEnabled,
      pfPercent: emp.pfPercent,
      professionalTax: emp.professionalTax,
      pan: emp.pan,
      aadhaar: emp.aadhaar,
      bankName: emp.bankName,
      bankBranch: emp.bankBranch,
      bankAccountNo: emp.bankAccountNo,
      bankIfsc: emp.bankIfsc,
      aboutMe: emp.aboutMe,
      skills: emp.skills,
    }
  });

  // Attendance — last 2 months of working days
  const now = new Date();
  for (let m = 0; m <= 1; m++) {
    const month = now.getMonth() + 1 - m;
    const year = month <= 0 ? now.getFullYear() - 1 : now.getFullYear();
    const adjustedMonth = month <= 0 ? month + 12 : month;
    const workingDays = getWorkingDaysInMonth(year, adjustedMonth);

    for (const day of workingDays) {
      if (day > now) continue;
      const rand = Math.random();
      let status, checkIn, checkOut, hoursWorked;

      if (rand < 0.85) {
        // Present
        status = 'PRESENT';
        const inHour = 8 + Math.floor(Math.random() * 2);
        const inMin = Math.floor(Math.random() * 30);
        checkIn = new Date(day); checkIn.setHours(inHour, inMin, 0, 0);
        checkOut = new Date(day); checkOut.setHours(inHour + 9, inMin, 0, 0);
        hoursWorked = parseFloat((checkOut - checkIn) / 3600000).toFixed(6);
      } else if (rand < 0.92) {
        status = 'ABSENT'; checkIn = null; checkOut = null; hoursWorked = 0;
      } else {
        status = 'HALF_DAY';
        checkIn = new Date(day); checkIn.setHours(9, 0, 0, 0);
        checkOut = new Date(day); checkOut.setHours(13, 0, 0, 0);
        hoursWorked = 4;
      }

      const attendance = await prisma.attendance.create({
        data: {
          employeeId: employee.id,
          date: day,
          checkIn,
          checkOut,
          hoursWorked: parseFloat(hoursWorked),
          status,
        }
      });

      // Seed attendance logs for PRESENT days
      if (status === 'PRESENT' && checkIn && checkOut) {
        await prisma.attendanceLog.createMany({
          data: [
            { attendanceId: attendance.id, type: 'IN', timestamp: checkIn },
            { attendanceId: attendance.id, type: 'OUT', timestamp: checkOut },
          ]
        });
      }
    }
  }

  // Leave Allocations
  const year = now.getFullYear();
  await prisma.leaveAllocation.createMany({
    data: [
      { employeeId: employee.id, type: 'PAID_LEAVE',    year, totalDays: 20, usedDays: Math.floor(Math.random() * 5) },
      { employeeId: employee.id, type: 'SICK_LEAVE',    year, totalDays: 10, usedDays: Math.floor(Math.random() * 3) },
      { employeeId: employee.id, type: 'CASUAL_LEAVE',  year, totalDays: 8,  usedDays: Math.floor(Math.random() * 2) },
    ]
  });

  return { user, employee };
}

async function main() {
  console.log('--- Cleaning up existing data ---');
  await prisma.payslipDispute.deleteMany();
  await prisma.payslip.deleteMany();
  await prisma.attendanceLog.deleteMany();
  await prisma.attendanceRegularization.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.leaveAllocation.deleteMany();
  await prisma.leave.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.user.deleteMany();
  await prisma.orgSettings.deleteMany();

  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  // ── Admin ──
  console.log('--- Seeding Admin ---');
  await prisma.user.create({
    data: {
      email: 'admin@empay.com',
      loginId: 'EMAD20150001',
      passwordHash,
      name: 'Super Admin',
      role: 'ADMIN',
      companyName: COMPANY_NAME,
      phone: '9000000000',
      isActive: true,
      mustChangePassword: false,
    }
  });

  // ── HR Officers ──
  console.log('--- Seeding HR Officers ---');
  const hrPayrollUsers = [
    { ...HR_USERS[0],      loginId: 'EMSA20180001' },
    { ...PAYROLL_USERS[0], loginId: 'EMDF20180002' },
  ];
  for (const u of hrPayrollUsers) {
    await prisma.user.create({
      data: {
        email: u.email, loginId: u.loginId, passwordHash,
        name: u.name, role: u.role,
        companyName: COMPANY_NAME, phone: u.phone,
        isActive: true, mustChangePassword: false,
      }
    });
  }

  // ── Employees ──
  console.log('--- Seeding Employees ---');
  // Sort by joinDate so serials are assigned chronologically (oldest first)
  const sorted = [...EMPLOYEES].sort((a, b) => new Date(a.joinDate) - new Date(b.joinDate));
  for (let i = 0; i < sorted.length; i++) {
    const emp = sorted[i];
    const joinYear = new Date(emp.joinDate).getFullYear();
    const nextSerial = (yearSerials[joinYear] || 0) + 1;
    const loginId = generateLoginId(COMPANY_NAME, emp.firstName, emp.lastName, emp.joinDate, nextSerial);
    process.stdout.write(`  [${i + 1}/${sorted.length}] ${emp.name} → ${loginId}...`);
    await seedEmployee(emp, passwordHash);
    console.log(' done');
  }

  // ── OrgSettings ──
  console.log('--- Seeding OrgSettings ---');
  await prisma.orgSettings.create({
    data: {
      companyName: 'EmPay Corp',
      companyAddress: '404, Tech Park, Andheri East, Mumbai - 400069',
      cin: 'U72900MH2015PTC123456',
      isMetro: true,
      metroHraPercent: 50,
      nonMetroHraPercent: 40,
      conveyanceDefault: 1600,
      medicalDefault: 1250,
      pfEnabled: true,
      pfBasicThreshold: 15000,
      pfEmployeePercent: 12,
      pfEmployerPercent: 12,
      esicEnabled: true,
      esicGrossThreshold: 21000,
      esicEmployeePercent: 0.75,
      esicEmployerPercent: 3.25,
      profTaxState: 'MAHARASHTRA',
      payDay: 28,
      workingDaysPerMonth: 26,
      workingDaysPerWeek: 5,
      fullDayMinHours: 8,
      halfDayMinHours: 4,
      graceMinutes: 15,
    }
  });

  console.log('\n--- Seeding Complete! ---');
  console.log(`All users password: ${PASSWORD}`);
  console.log('Admin:            admin@empay.com');
  console.log('HR Officer:       sarah.hr@empay.com');
  console.log('Payroll Officer:  david.finance@empay.com');
  console.log(`Employees:        john.smith@empay.com ... (${EMPLOYEES.length} total)`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
