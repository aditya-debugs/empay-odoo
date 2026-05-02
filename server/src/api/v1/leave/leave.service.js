const prisma = require('../../../config/prisma');

async function applyLeave(userId, data) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { employee: true }
  });

  if (!user || !user.employee) {
    const err = new Error('Employee record not found');
    err.status = 404;
    throw err;
  }

  const startDate = new Date(data.startDate);
  const endDate = new Date(data.endDate);
  const daysDiff = (endDate - startDate) / (1000 * 60 * 60 * 24) + 1;

  // Check leave allocation
  const allocation = await prisma.leaveAllocation.findUnique({
    where: {
      employeeId_type_year: {
        employeeId: user.employee.id,
        type: data.type,
        year: new Date().getFullYear()
      }
    }
  });

  if (!allocation || allocation.usedDays + daysDiff > allocation.totalDays) {
    const err = new Error('Insufficient leave balance');
    err.status = 400;
    throw err;
  }

  const leave = await prisma.leave.create({
    data: {
      employeeId: user.employee.id,
      type: data.type,
      startDate,
      endDate,
      days: daysDiff,
      reason: data.reason,
      status: 'PENDING'
    }
  });

  return leave;
}

async function getLeaveHistory(userId, limit = 50, offset = 0) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { employee: true }
  });

  if (!user || !user.employee) {
    const err = new Error('Employee record not found');
    err.status = 404;
    throw err;
  }

  const leaves = await prisma.leave.findMany({
    where: { employeeId: user.employee.id },
    include: { approvedBy: { select: { name: true } } },
    take: limit,
    skip: offset,
    orderBy: { createdAt: 'desc' }
  });

  const total = await prisma.leave.count({
    where: { employeeId: user.employee.id }
  });

  return { leaves, total, limit, offset };
}

async function getLeaveBalance(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { employee: true }
  });

  if (!user || !user.employee) {
    const err = new Error('Employee record not found');
    err.status = 404;
    throw err;
  }

  const balances = await prisma.leaveAllocation.findMany({
    where: {
      employeeId: user.employee.id,
      year: new Date().getFullYear()
    }
  });

  return balances;
}

module.exports = { applyLeave, getLeaveHistory, getLeaveBalance };

