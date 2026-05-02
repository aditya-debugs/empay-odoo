const prisma = require('../../../config/prisma');

exports.getAttendanceReport = async ({ startDate, endDate, department }) => {
  const where = {};
  if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date.gte = new Date(startDate);
    if (endDate) where.date.lte = new Date(endDate);
  }
  if (department) {
    where.employee = { department };
  }

  const attendance = await prisma.attendance.findMany({
    where,
    include: {
      employee: {
        select: {
          firstName: true,
          lastName: true,
          department: true,
          user: { select: { name: true, loginId: true } }
        }
      }
    },
    orderBy: [{ date: 'desc' }, { employeeId: 'asc' }]
  });

  return attendance;
};

exports.getLeaveReport = async ({ startDate, endDate, department }) => {
  const where = {};
  if (startDate || endDate) {
    where.startDate = {};
    if (startDate) where.startDate.gte = new Date(startDate);
    if (endDate) where.startDate.lte = new Date(endDate); // Not perfect range overlap, but simple
  }
  if (department) {
    where.employee = { department };
  }

  const leaves = await prisma.leave.findMany({
    where,
    include: {
      employee: {
        select: {
          firstName: true,
          lastName: true,
          department: true,
          user: { select: { name: true, loginId: true } }
        }
      }
    },
    orderBy: { startDate: 'desc' }
  });

  return leaves;
};

exports.getPayrollReport = async ({ year, month, department }) => {
  const where = {};
  if (year) where.year = parseInt(year, 10);
  if (month) where.month = parseInt(month, 10);
  if (department) {
    where.employee = { department };
  }

  const payslips = await prisma.payslip.findMany({
    where,
    include: {
      employee: {
        select: {
          firstName: true,
          lastName: true,
          department: true,
          user: { select: { name: true, loginId: true } }
        }
      }
    },
    orderBy: [{ year: 'desc' }, { month: 'desc' }]
  });

  return payslips;
};

exports.getHeadcountReport = async () => {
  // Simple summary of active employees by department
  const employees = await prisma.employee.groupBy({
    by: ['department', 'status'],
    _count: { id: true }
  });
  return employees;
};
