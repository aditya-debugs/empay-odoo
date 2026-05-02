const prisma = require('../../../config/prisma');

async function listEmployees({ search = '', role, limit = 50, offset = 0 } = {}) {
  const where = {
    status: 'ACTIVE',
    user: role ? { role } : undefined,
    OR: search ? [
      { user: { name: { contains: search, mode: 'insensitive' } } },
      { user: { email: { contains: search, mode: 'insensitive' } } },
      { firstName: { contains: search, mode: 'insensitive' } },
      { lastName: { contains: search, mode: 'insensitive' } }
    ] : undefined
  };

  const employees = await prisma.employee.findMany({
    where,
    include: { user: { select: { id: true, name: true, email: true, role: true } } },
    take: limit,
    skip: offset,
    orderBy: { createdAt: 'desc' }
  });

  const total = await prisma.employee.count({ where });

  return { employees, total, limit, offset };
}

async function getEmployeeProfile(employeeId) {
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    include: { user: { select: { id: true, name: true, email: true, role: true } } }
  });

  if (!employee) {
    const err = new Error('Employee not found');
    err.status = 404;
    throw err;
  }

  return employee;
}

async function updateOwnProfile(userId, data) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { employee: true }
  });

  if (!user || !user.employee) {
    const err = new Error('Employee record not found');
    err.status = 404;
    throw err;
  }

  const updated = await prisma.employee.update({
    where: { id: user.employee.id },
    data: {
      firstName: data.firstName || user.employee.firstName,
      lastName: data.lastName || user.employee.lastName,
      phone: data.phone || user.employee.phone,
      dob: data.dob || user.employee.dob
    },
    include: { user: { select: { id: true, name: true, email: true } } }
  });

  return updated;
}

async function updateBankDetails(userId, data) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { employee: true }
  });

  if (!user || !user.employee) {
    const err = new Error('Employee record not found');
    err.status = 404;
    throw err;
  }

  const updated = await prisma.employee.update({
    where: { id: user.employee.id },
    data: {
      bankName: data.bankName,
      bankAccountNo: data.bankAccountNo,
      bankIfsc: data.bankIfsc
    }
  });

  return updated;
}

module.exports = { listEmployees, getEmployeeProfile, updateOwnProfile, updateBankDetails };

