const usersService = require('../users/users.service');
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

exports.getEmployee = async (id) => usersService.getUser(id);

// ─────────────────────────────────────────────────────────────
// Self-service updates (Employee module — employee updates their own profile)
// ─────────────────────────────────────────────────────────────

exports.updateOwnProfile = async (userId, data) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { employee: true },
  });
  if (!user || !user.employee) {
    const err = new Error('Employee record not found for this user');
    err.status = 404;
    throw err;
  }
  await prisma.employee.update({
    where: { id: user.employee.id },
    data: {
      firstName:     data.firstName     ?? user.employee.firstName,
      lastName:      data.lastName      ?? user.employee.lastName,
      phone:         data.phone         ?? user.employee.phone,
      personalEmail: data.personalEmail ?? user.employee.personalEmail,
      personalPhone: data.personalPhone ?? user.employee.personalPhone,
      dob:           data.dob ? new Date(data.dob) : user.employee.dob,
    },
  });
  return usersService.getUser(userId);
};

exports.updateBankDetails = async (userId, data) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { employee: true },
  });
  if (!user || !user.employee) {
    const err = new Error('Employee record not found for this user');
    err.status = 404;
    throw err;
  }
  await prisma.employee.update({
    where: { id: user.employee.id },
    data: {
      bankName:      data.bankName,
      bankBranch:    data.bankBranch,
      bankAccountNo: data.bankAccountNo,
      bankIfsc:      data.bankIfsc,
    },
  });
  return usersService.getUser(userId);
};
