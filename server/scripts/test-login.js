const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function testLogin() {
  const email = 'admin@empay.com';
  const password = 'admin12345';
  
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.log('User not found');
    return;
  }
  
  const ok = await bcrypt.compare(password, user.passwordHash);
  console.log(`Login test for ${email}: ${ok ? 'SUCCESS' : 'FAILED'}`);
  console.log('DB Hash starts with:', user.passwordHash.substring(0, 10));
}

testLogin()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
