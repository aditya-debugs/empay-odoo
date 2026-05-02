const prisma = require('../../../config/prisma');

async function getEmployeePayslips(userId, limit = 50, offset = 0) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { employee: true }
  });

  if (!user || !user.employee) {
    const err = new Error('Employee record not found');
    err.status = 404;
    throw err;
  }

  const payslips = await prisma.payslip.findMany({
    where: { employeeId: user.employee.id },
    take: limit,
    skip: offset,
    orderBy: { createdAt: 'desc' }
  });

  const total = await prisma.payslip.count({
    where: { employeeId: user.employee.id }
  });

  return { payslips, total, limit, offset };
}

async function getPayslipDetail(userId, payslipId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { employee: true }
  });

  if (!user || !user.employee) {
    const err = new Error('Employee record not found');
    err.status = 404;
    throw err;
  }

  const payslip = await prisma.payslip.findUnique({
    where: { id: payslipId },
    include: { employee: true, createdBy: { select: { name: true } } }
  });

  if (!payslip || payslip.employeeId !== user.employee.id) {
    const err = new Error('Payslip not found');
    err.status = 404;
    throw err;
  }

  return payslip;
}

module.exports = { getEmployeePayslips, getPayslipDetail };

