const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('admin12345', 10);
  const email = 'admin@empay.local';
  
  await prisma.user.upsert({
    where: { email },
    update: { passwordHash },
    create: {
      email,
      passwordHash,
      name: 'Bootstrap Admin',
      role: 'ADMIN',
      isActive: true,
      mustChangePassword: false
    }
  });
  console.log('User admin@empay.local is ready with password admin12345');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
