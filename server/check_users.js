const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const users = await prisma.user.findMany();
  console.log('--- USERS IN DB ---');
  users.forEach(u => {
    console.log(`- ${u.email} (${u.role}) ID: ${u.id} LoginID: ${u.loginId}`);
  });
  await prisma.$disconnect();
}

check();
