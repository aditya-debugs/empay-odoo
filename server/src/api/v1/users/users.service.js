const prisma = require('../../../config/prisma');
const { hashPassword } = require('../../../utils/password');
const { generateLoginId, generateTempPassword } = require('../../../utils/loginId');

// Flatten User + (optional) Employee into a single shape the frontend can use uniformly.
function shapeUser(u) {
  if (!u) return null;
  const e = u.employee;
  const [first, ...rest] = (u.name || '').split(' ');
  return {
    id: u.id,
    email: u.email,
    loginId: u.loginId,
    name: u.name,
    role: u.role,
    companyName: u.companyName,
    isActive: u.isActive,
    mustChangePassword: u.mustChangePassword,
    createdAt: u.createdAt,
    updatedAt: u.updatedAt,
    // Convenience fields — flatten employee profile when present
    firstName:      e?.firstName      ?? first ?? '',
    lastName:       e?.lastName       ?? rest.join(' ') ?? '',
    gender:         e?.gender         ?? null,
    dob:            e?.dob            ?? null,
    personalEmail:  e?.personalEmail  ?? null,
    personalPhone:  e?.personalPhone  ?? null,
    department:     e?.department     ?? (u.role === 'ADMIN' ? '—' : null),
    position:       e?.position       ?? (u.role === 'ADMIN' ? 'Administrator' : null),
    joinDate:       e?.joinDate       ?? u.createdAt,
    employmentType: e?.employmentType ?? null,
    employeeStatus: e?.status         ?? null,
    avatarUrl:      e?.avatarUrl      ?? null,
    basicSalary:      e?.basicSalary      ?? null,
    hra:              e?.hra              ?? null,
    conveyance:       e?.conveyance       ?? null,
    specialAllowance: e?.specialAllowance ?? null,
    otherAllowance:   e?.otherAllowance   ?? null,
    pfEnabled:        e?.pfEnabled        ?? null,
    pfPercent:        e?.pfPercent        ?? null,
    professionalTax:  e?.professionalTax  ?? null,
    bankName:      e?.bankName      ?? null,
    bankBranch:    e?.bankBranch    ?? null,
    bankAccountNo: e?.bankAccountNo ?? null,
    bankIfsc:      e?.bankIfsc      ?? null,
    employeeId:    e?.id            ?? null,
  };
}

async function listUsers({ role, excludeAdmin } = {}) {
  const where = {};
  if (role) where.role = role;
  if (excludeAdmin) where.role = { not: 'ADMIN' };

  const users = await prisma.user.findMany({
    where,
    include: { employee: true },
    orderBy: { createdAt: 'desc' },
  });
  return users.map(shapeUser);
}

async function getUser(id) {
  const user = await prisma.user.findUnique({
    where: { id },
    include: { employee: true },
  });
  return shapeUser(user);
}

async function createUser(input, creatorId) {
  // Pull company name from the creator (the admin doing the create)
  const creator = await prisma.user.findUnique({ where: { id: creatorId } });
  const companyName = creator?.companyName || 'EmPay';

  // Reject duplicate work email up-front for a clean 409
  const existing = await prisma.user.findUnique({ where: { email: input.workEmail } });
  if (existing) {
    const err = new Error('A user with that work email already exists');
    err.status = 409;
    throw err;
  }

  // Generate auth artifacts
  const loginId = await generateLoginId({
    companyName,
    firstName: input.firstName,
    lastName: input.lastName,
    joinDate: input.joinDate,
  });
  const tempPassword = generateTempPassword();
  const passwordHash = await hashPassword(tempPassword);

  // Create User + Employee in one transaction
  const created = await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: {
        email: input.workEmail,
        loginId,
        passwordHash,
        name: `${input.firstName} ${input.lastName}`.trim(),
        role: input.role,
        companyName,
        phone: input.personalPhone || null,
        mustChangePassword: true,
        isActive: true,
      },
    });

    let employee = null;
    if (newUser.role !== 'ADMIN') {
      employee = await tx.employee.create({
        data: {
        userId: newUser.id,
        firstName: input.firstName,
        lastName: input.lastName,
        gender: input.gender || null,
        dob: input.dob ? new Date(input.dob) : null,
        personalEmail: input.personalEmail || null,
        personalPhone: input.personalPhone || null,
        phone: input.personalPhone || null,
        department: input.department,
        position: input.position,
        joinDate: new Date(input.joinDate),
        employmentType: input.employmentType || 'FULL_TIME',
        basicSalary: input.basicSalary || 0,
        hra: input.hra ?? null,
        conveyance: input.conveyance ?? null,
        specialAllowance: input.specialAllowance ?? null,
        otherAllowance: input.otherAllowance ?? null,
        pfEnabled: input.pfEnabled ?? true,
        pfPercent: input.pfPercent ?? null,
        professionalTax: input.professionalTax ?? null,
        bankName: input.bankName || null,
        bankBranch: input.bankBranch || null,
        bankAccountNo: input.bankAccountNo || null,
        bankIfsc: input.bankIfsc || null,
        }
      });
      // Add default leave allocations
      const year = new Date().getFullYear();
      const defaultAllocations = [
        { type: 'PAID_LEAVE',   totalDays: 20 },
        { type: 'SICK_LEAVE',   totalDays: 10 },
        { type: 'CASUAL_LEAVE', totalDays: 8  },
      ];

      await Promise.all(defaultAllocations.map(alloc => 
        tx.leaveAllocation.create({
          data: {
            employeeId: employee.id,
            type: alloc.type,
            year: year,
            totalDays: alloc.totalDays,
          }
        })
      ));
    }

    return tx.user.findUnique({
      where: { id: newUser.id },
      include: { employee: true },
    });
  });

  return {
    user: shapeUser(created),
    loginId,
    tempPassword, // returned ONCE — admin shares this with the new employee
  };
}

async function changeRole(id, role) {
  const updated = await prisma.user.update({
    where: { id },
    data: { role },
    include: { employee: true },
  });
  return shapeUser(updated);
}

async function setActive(id, isActive) {
  const updated = await prisma.user.update({
    where: { id },
    data: { isActive },
    include: { employee: true },
  });
  return shapeUser(updated);
}

async function deleteUser(id) {
  // Cascade deletes Employee via the schema relation
  await prisma.user.delete({ where: { id } });
}

async function resetPassword(id) {
  const tempPassword = generateTempPassword();
  const passwordHash = await hashPassword(tempPassword);
  await prisma.user.update({
    where: { id },
    data: { passwordHash, mustChangePassword: true },
  });
  return { tempPassword };
}

module.exports = {
  listUsers, getUser, createUser, changeRole, setActive, deleteUser, resetPassword,
};
