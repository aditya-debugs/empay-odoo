const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function check() {
  try {
    const count = await p.payroll.count();
    console.log('Payroll count:', count);
    process.exit(0);
  } catch (err) {
    console.error('Prisma Payroll Error:', err.message);
    process.exit(1);
  }
}
check();
