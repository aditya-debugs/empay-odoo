const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function create() {
  const hash = await bcrypt.hash('admin12345', 10);
  await prisma.user.upsert({
    where: { email: 'admin@empay.local' },
    update: { passwordHash: hash, isActive: true },
    create: {
      email: 'admin@empay.local',
      passwordHash: hash,
      name: 'Bootstrap Admin',
      role: 'ADMIN',
      companyName: 'EmPay',
      isActive: true,
      mustChangePassword: false
    }
  });
  console.log('User admin@empay.local ensured with password "admin12345"');
  await prisma.$disconnect();
}

create().catch(console.error);
