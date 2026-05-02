const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('employee12345', 10);
  await prisma.user.update({
    where: { email: 'employee@empay.com' },
    data: { passwordHash }
  });
  console.log('Password reset for employee@empay.com to employee12345');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
