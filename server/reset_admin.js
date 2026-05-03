const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function reset() {
  const hash = await bcrypt.hash('admin12345', 10);
  await prisma.user.update({
    where: { email: 'admin@empay.com' },
    data: { passwordHash: hash }
  });
  console.log('Password for admin@empay.com reset to "admin12345"');
  await prisma.$disconnect();
}

reset().catch(console.error);
