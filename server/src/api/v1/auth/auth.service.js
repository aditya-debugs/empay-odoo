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

async function registerAdmin({ email, password, name }) {
  if (await adminExists()) {
    const err = new Error('An admin already exists. Self-signup is locked.');
    err.status = 409;
    throw err;
  }
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    const err = new Error('Email already in use');
    err.status = 409;
    throw err;
  }
  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: { email, passwordHash, name, role: 'ADMIN' },
    select: PUBLIC_USER_FIELDS,
  });
  return { user, token: issueToken(user) };
}

async function login({ identifier, password }) {
  const user = await prisma.user.findFirst({
    where: { OR: [{ email: identifier }, { loginId: identifier }] },
  });
  if (!user || !user.isActive) {
    const err = new Error('Invalid credentials');
    err.status = 401;
    throw err;
  }
  const ok = await comparePassword(password, user.passwordHash);
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
  return prisma.user.findUnique({ where: { id: userId }, select: PUBLIC_USER_FIELDS });
}

module.exports = { adminExists, registerAdmin, login, getMe };
