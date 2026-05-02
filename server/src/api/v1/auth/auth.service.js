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
    data: { email, passwordHash, name, companyName, phone, role: 'ADMIN', isActive: false },
    select: PUBLIC_USER_FIELDS,
  });

  // Generate verification token (expires in 24 hours)
  const jwt = require('jsonwebtoken');
  const env = require('../../../config/env');
  const token = jwt.sign({ sub: user.id, purpose: 'verify_email' }, env.jwt.secret, { expiresIn: '24h' });

  // Send email
  const { sendEmail } = require('../../../utils/email');
  const verifyUrl = `${process.env.CLIENT_URL || 'http://localhost:5174'}/verify-email?token=${token}`;
  
  const html = `
    <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
      <div style="background-color: #4f46e5; color: white; padding: 24px; text-align: center;">
        <h1 style="margin: 0; font-size: 24px;">Verify your email</h1>
      </div>
      <div style="padding: 24px; background-color: #ffffff;">
        <p>Hi ${user.name},</p>
        <p>Thanks for creating an account on EmPay HRMS. Please verify your email address to activate your admin account.</p>
        
        <div style="text-align: center; margin-top: 32px;">
          <a href="${verifyUrl}" style="background-color: #4f46e5; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; display: inline-block;">Verify Email</a>
        </div>
        <p style="margin-top: 32px; color: #6b7280; font-size: 14px;">Or copy and paste this link: <br/><a href="${verifyUrl}">${verifyUrl}</a></p>
      </div>
    </div>
  `;
  
  sendEmail({ to: user.email, subject: 'Verify your EmPay Account', html }).catch(console.error);

  // We do not issue an auth token yet because the account is inactive
  return { user, message: 'Verification email sent' };
}

async function verifyEmail(token) {
  const jwt = require('jsonwebtoken');
  const env = require('../../../config/env');
  try {
    const decoded = jwt.verify(token, env.jwt.secret);
    if (decoded.purpose !== 'verify_email') throw new Error('Invalid token purpose');
    
    await prisma.user.update({
      where: { id: decoded.sub },
      data: { isActive: true }
    });
    return { success: true };
  } catch (err) {
    const error = new Error('Invalid or expired verification link');
    error.status = 400;
    throw error;
  }
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

module.exports = { adminExists, registerAdmin, login, getMe, changePassword, verifyEmail };
