const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function testLogin(email, password) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.log(`User ${email} not found`);
    return;
  }
  const ok = await bcrypt.compare(password, user.passwordHash);
  console.log(`Login test for ${email} with password "${password}": ${ok ? 'SUCCESS' : 'FAILURE'}`);
  await prisma.$disconnect();
}

testLogin('admin@empay.com', 'Password@123');
testLogin('employee@empay.com', 'Password@123');
