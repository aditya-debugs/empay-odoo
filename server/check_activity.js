const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: {
      email: true,
      role: true,
      isActive: true,
      loginId: true
    }
  });
  console.log('--- USERS IN DB ---');
  users.forEach(u => {
    console.log(`- ${u.email} (${u.role}) | Active: ${u.isActive} | ID: ${u.loginId}`);
  });
  await prisma.$disconnect();
}

main();
