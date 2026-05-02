const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('admin12345', 10);
  await prisma.user.update({
    where: { email: 'admin@empay.com' },
    data: { passwordHash }
  });
  console.log('Password reset for admin@empay.com to admin12345');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
