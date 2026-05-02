const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany();
  console.log('USERS:', JSON.stringify(users, null, 2));
  const employees = await prisma.employee.findMany();
  console.log('EMPLOYEES:', JSON.stringify(employees, null, 2));
  process.exit(0);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
