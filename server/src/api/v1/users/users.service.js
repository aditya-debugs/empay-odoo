const prisma = require('../../../config/prisma');
const { hashPassword } = require('../../../utils/password');

async function createUser(creatorId, data) {
  const {
    email, password, name, role,
    firstName, lastName, phone, department, position,
    joinDate, dob, basicSalary,
    bankName, bankAccountNo, bankIfsc
  } = data;

  // Check if email already exists
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    const err = new Error('Email already in use');
    err.status = 409;
    throw err;
  }

  // Get company name from creator
  const creator = await prisma.user.findUnique({ where: { id: creatorId } });
  const companyName = creator ? creator.companyName : 'EmPay';

  // Generate Login ID: [Prefix][Initials][Year][Serial]
  // Prefix: First 2 letters of company
  // Initials: First letter of First Name and Last Name
  // Year: Last 2 digits of join year
  // Serial: Count of employees + 1
  const prefix = (companyName || 'EP').substring(0, 2).toUpperCase();
  const initials = ((firstName || 'E')[0] + (lastName || 'X')[0]).toUpperCase();
  const year = new Date(joinDate || new Date()).getFullYear().toString().slice(-2);
  const count = await prisma.employee.count();
  const serial = (count + 1).toString().padStart(4, '0');
  const loginId = `${prefix}${initials}${year}${serial}`;

  const passwordHash = await hashPassword(password);

  // Create User and Employee in a transaction
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email,
        loginId,
        passwordHash,
        name: name || `${firstName} ${lastName}`,
        role: role || 'EMPLOYEE',
        companyName: companyName,
        phone,
        mustChangePassword: true,
      }
    });

    let employee = null;
    if (user.role !== 'ADMIN') {
      employee = await tx.employee.create({
        data: {
          userId: user.id,
          firstName,
          lastName,
          phone,
          department,
          position,
          joinDate: new Date(joinDate || new Date()),
          dob: dob ? new Date(dob) : null,
          basicSalary: basicSalary || 0,
          bankName,
          bankAccountNo,
          bankIfsc,
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

    return { user, employee };
  });
}

async function listUsers(filters = {}) {
  const { role, isActive } = filters;
  return prisma.user.findMany({
    where: {
      role: role ? role : undefined,
      isActive: isActive !== undefined ? isActive : undefined,
    },
    select: {
      id: true,
      email: true,
      loginId: true,
      name: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' }
  });
}

module.exports = { createUser, listUsers };
