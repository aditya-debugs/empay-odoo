const usersService = require('../users/users.service');
const prisma = require('../../../config/prisma');

async function listEmployees({ search = '', role, limit = 50, offset = 0 } = {}) {
  const where = {
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
    include: { user: { select: { id: true, name: true, email: true, role: true, loginId: true } } },
    take: limit,
    skip: offset,
    orderBy: { createdAt: 'desc' }
  });

  const total = await prisma.employee.count({ where });

  // Flatten for frontend
  const flat = employees.map(e => ({
    id: e.user.id,
    employeeId: e.id,
    firstName: e.firstName,
    lastName: e.lastName,
    name: e.user.name,
    email: e.user.email,
    loginId: e.user.loginId,
    role: e.user.role,
    position: e.position,
    department: e.department,
    attendanceStatus: e.status // per mockup
  }));

  return { employees: flat, total, limit, offset };
}

exports.listEmployees = listEmployees;

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
      pan:           data.pan           ?? user.employee.pan,
      aadhaar:       data.aadhaar       ?? user.employee.aadhaar,
      // Career & Bio
      skills:        data.skills        ?? user.employee.skills,
      certificates:  data.certificates  ?? user.employee.certificates,
      aboutMe:       data.aboutMe       ?? user.employee.aboutMe,
      resumeUrl:     data.resumeUrl     ?? user.employee.resumeUrl,
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

exports.adminUpdateEmployee = async (id, data) => {
  const user = await prisma.user.findUnique({
    where: { id },
    include: { employee: true },
  });
  if (!user) {
    const err = new Error('User not found');
    err.status = 404;
    throw err;
  }

  return prisma.$transaction(async (tx) => {
    // Update User part
    await tx.user.update({
      where: { id },
      data: {
        email: data.email ?? user.email,
        name:  data.name  ?? user.name,
        role:  data.role  ?? user.role, // Only if allowed by controller
        phone: data.phone ?? user.phone,
        isActive: data.isActive ?? user.isActive,
      }
    });

    // Update Employee part
    if (user.employee) {
      await tx.employee.update({
        where: { id: user.employee.id },
        data: {
          firstName:      data.firstName      ?? user.employee.firstName,
          lastName:       data.lastName       ?? user.employee.lastName,
          gender:         data.gender         ?? user.employee.gender,
          department:     data.department     ?? user.employee.department,
          position:       data.position       ?? user.employee.position,
          status:         data.status         ?? user.employee.status,
          employmentType: data.employmentType ?? user.employee.employmentType,
          joinDate:       data.joinDate ? new Date(data.joinDate) : user.employee.joinDate,
          avatarUrl:      data.avatarUrl      ?? user.employee.avatarUrl,
          // Salary fields — HR cannot touch these, we should filter them in controller 
          // but for safety we only update if provided and we trust the controller for permissions.
          basicSalary:    data.basicSalary    ?? user.employee.basicSalary,
          hra:            data.hra            ?? user.employee.hra,
          conveyance:     data.conveyance     ?? user.employee.conveyance,
          specialAllowance: data.specialAllowance ?? user.employee.specialAllowance,
          otherAllowance: data.otherAllowance ?? user.employee.otherAllowance,
        }
      });
    }

    return usersService.getUser(id);
  });
};

