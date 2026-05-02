const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const email = 'admin@empay.com';
  const existing = await prisma.user.findUnique({ where: { email } });
  
  if (!existing) {
    const passwordHash = await bcrypt.hash('Password@123', 10);
    await prisma.user.create({
      data: {
        email,
        passwordHash,
        name: 'Super Admin',
        role: 'ADMIN',
        companyName: 'EmPay Corp',
        phone: '1234567890',
        isActive: true,
        mustChangePassword: false
      }
    });
    console.log('Admin seeded: admin@empay.com / Password@123');
  } else {
    console.log('Admin already exists');
  }

  const empEmail = 'employee@empay.com';
  const existingEmp = await prisma.user.findUnique({ where: { email: empEmail } });
  if (!existingEmp) {
    const passwordHash = await bcrypt.hash('Password@123', 10);
    const user = await prisma.user.create({
      data: {
        email: empEmail,
        loginId: 'EMPL01',
        passwordHash,
        name: 'John Employee',
        role: 'EMPLOYEE',
        companyName: 'EmPay Corp',
        phone: '0987654321',
        isActive: true,
        mustChangePassword: false
      }
    });

    const employee = await prisma.employee.create({
      data: {
        userId: user.id,
        firstName: 'John',
        lastName: 'Employee',
        department: 'Engineering',
        position: 'Software Engineer',
        joinDate: new Date(),
        basicSalary: 50000,
        bankName: 'Global Bank',
        bankAccountNo: '1234567890',
        bankIfsc: 'GBANK001'
      }
    });

    // Seed Attendance for the last 5 days
    const today = new Date();
    for (let i = 0; i < 5; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      date.setHours(0, 0, 0, 0);

      await prisma.attendance.create({
        data: {
          employeeId: employee.id,
          date: date,
          checkIn: new Date(date.setHours(9, 0, 0)),
          checkOut: new Date(date.setHours(18, 0, 0)),
          hoursWorked: 9.0,
          status: 'PRESENT'
        }
      });
    }

    // Seed Leave Allocations
    const year = new Date().getFullYear();
    await prisma.leaveAllocation.createMany({
      data: [
        { employeeId: employee.id, type: 'PAID_LEAVE', year, totalDays: 20, usedDays: 0 },
        { employeeId: employee.id, type: 'SICK_LEAVE', year, totalDays: 10, usedDays: 2 },
        { employeeId: employee.id, type: 'CASUAL_LEAVE', year, totalDays: 8, usedDays: 0 },
      ]
    });

    console.log('Employee seeded: employee@empay.com / Password@123 (Login ID: EMPL01)');
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
