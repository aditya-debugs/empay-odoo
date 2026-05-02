const prisma = require('../../../config/prisma');
const { hashPassword, comparePassword } = require('../../../utils/password');
const { signToken } = require('../../../utils/jwt');

const PUBLIC_USER_FIELDS = {
  id: true,
  email: true,
  loginId: true,
  name: true,
  role: true,
  mustChangePassword: true,
  isActive: true,
};

function issueToken(user) {
  return signToken({ sub: user.id, role: user.role });
}

async function adminExists() {
  const count = await prisma.user.count({ where: { role: 'ADMIN' } });
  return count > 0;
}

async function registerAdmin({ email, password, name, companyName, phone }) {
  // First-admin lock removed per project owner's request — multiple admins
  // can be created from the public signup page. Email uniqueness still enforced.
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    const err = new Error('Email already in use');
    err.status = 409;
    throw err;
  }
  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: { email, passwordHash, name, companyName, phone, role: 'ADMIN' },
    select: PUBLIC_USER_FIELDS,
  });
  return { user, token: issueToken(user) };
}

async function login({ identifier, password }) {
  const cleanIdentifier = typeof identifier === 'string' ? identifier.trim() : identifier;
  console.log(`[AUTH] Login attempt for: "${cleanIdentifier}" (Type: ${typeof cleanIdentifier})`);
  
  // Try case-insensitive search
  let user = await prisma.user.findFirst({
    where: { 
      OR: [
        { email: { equals: cleanIdentifier, mode: 'insensitive' } }, 
        { loginId: { equals: cleanIdentifier, mode: 'insensitive' } }
      ] 
    },
  });

  if (!user) {
    console.log(`[AUTH] No user found for "${cleanIdentifier}"`);
    const err = new Error('Invalid credentials');
    err.status = 401;
    throw err;
  }

  if (!user.isActive) {
    console.log(`[AUTH] User "${user.email}" found but is INACTIVE`);
    const err = new Error('Invalid credentials');
    err.status = 401;
    throw err;
  }

  const ok = await comparePassword(password, user.passwordHash);
  console.log(`[AUTH] Password check for ${user.email}: ${ok ? 'SUCCESS' : 'FAILED'}`);
  
  if (!ok) {
    const err = new Error('Invalid credentials');
    err.status = 401;
    throw err;
  }
  const safe = { ...user };
  delete safe.passwordHash;
  return { user: safe, token: issueToken(user) };
}

async function getMe(userId) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: { ...PUBLIC_USER_FIELDS, employee: true },
  });
}

async function changePassword(userId, { currentPassword, newPassword }) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('User not found');

  const ok = await comparePassword(currentPassword, user.passwordHash);
  if (!ok) {
    const err = new Error('Incorrect current password');
    err.status = 400;
    throw err;
  }

  const passwordHash = await hashPassword(newPassword);
  return prisma.user.update({
    where: { id: userId },
    data: { passwordHash, mustChangePassword: false },
    select: PUBLIC_USER_FIELDS
  });
}

module.exports = { adminExists, registerAdmin, login, getMe, changePassword };
