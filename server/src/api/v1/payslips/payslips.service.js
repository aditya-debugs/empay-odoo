const prisma = require('../../../config/prisma');

// ─────────────────────────────────────────────────────────────
// Employee-side (own payslips only)
// ─────────────────────────────────────────────────────────────

async function getEmployeePayslips(userId, limit = 50, offset = 0) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { employee: true },
  });
  if (!user || !user.employee) {
    const err = new Error('Employee record not found');
    err.status = 404;
    throw err;
  }

  const payslips = await prisma.payslip.findMany({
    where: { employeeId: user.employee.id },
    take: limit, skip: offset,
    orderBy: [{ year: 'desc' }, { month: 'desc' }],
  });
  const total = await prisma.payslip.count({ where: { employeeId: user.employee.id } });
  return { payslips, total, limit, offset };
}

async function getOwnPayslip(userId, payslipId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { employee: true },
  });
  if (!user || !user.employee) {
    const err = new Error('Employee record not found');
    err.status = 404;
    throw err;
  }
  const payslip = await prisma.payslip.findUnique({
    where: { id: payslipId },
    include: {
      employee: { include: { user: { select: { name: true, email: true } } } },
      createdBy: { select: { name: true } },
    },
  });
  if (!payslip || payslip.employeeId !== user.employee.id) {
    const err = new Error('Payslip not found');
    err.status = 404;
    throw err;
  }
  return payslip;
}

// ─────────────────────────────────────────────────────────────
// Admin / Payroll Officer
// ─────────────────────────────────────────────────────────────

async function listAll({ year, month, employeeId, search } = {}) {
  const where = {};
  if (year)       where.year       = Number(year);
  if (month)      where.month      = Number(month);
  if (employeeId) where.employeeId = employeeId;
  if (search) {
    where.employee = {
      OR: [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName:  { contains: search, mode: 'insensitive' } },
      ],
    };
  }

  const payslips = await prisma.payslip.findMany({
    where,
    include: { employee: { include: { user: { select: { name: true, email: true } } } } },
    orderBy: [{ year: 'desc' }, { month: 'desc' }, { employee: { firstName: 'asc' } }],
  });
  return payslips;
}

async function getById(payslipId) {
  return prisma.payslip.findUnique({
    where: { id: payslipId },
    include: {
      employee: { include: { user: { select: { name: true, email: true } } } },
      createdBy: { select: { name: true } },
    },
  });
}

async function getDraft(employeeId, month) {
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    include: { user: { select: { name: true, email: true } } },
  });
  if (!employee) {
    const err = new Error('Employee not found');
    err.status = 404;
    throw err;
  }

  const [year, monthNum] = month.split('-').map(Number);

  return {
    employeeId,
    month: monthNum,
    year,
    status: 'DRAFT',
    employee,
    paidDays: 0,
    lopDays: 0,
    basicSalary: 0,
    grossSalary: 0,
    totalDeductions: 0,
    netSalary: 0,
    earnings: [],
    deductions: []
  };
}

async function validate(id, userId) {
  return prisma.payslip.update({
    where: { id },
    data: { 
      status: 'GENERATED',
      createdById: userId
    }
  });
}

async function cancel(id) {
  return prisma.payslip.update({
    where: { id },
    data: { status: 'CANCELLED' }
  });
}

module.exports = { getEmployeePayslips, getOwnPayslip, listAll, getById, getDraft, validate, cancel };
