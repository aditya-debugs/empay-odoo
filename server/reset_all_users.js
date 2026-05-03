const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function resetAll() {
  const hash = await bcrypt.hash('admin12345', 10);
  const users = await prisma.user.findMany();
  for (const user of users) {
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: hash, isActive: true }
    });
  }
  console.log(`Reset ${users.length} users' passwords to "admin12345" and set them to active.`);
  await prisma.$disconnect();
}

resetAll().catch(console.error);
