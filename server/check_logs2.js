const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const p = new PrismaClient();

async function d() {
  const user = await p.user.findFirst({
    where: { email: 'employee@empay.com' },
    include: { employee: true }
  });
  const today = new Date().toISOString().split('T')[0];
  const attendance = await p.attendance.findFirst({
    where: { 
      employeeId: user.employee.id,
      date: new Date(today)
    },
    include: { logs: { orderBy: { timestamp: 'desc' } } }
  });
  fs.writeFileSync('db_dump.json', JSON.stringify(attendance, null, 2));
}

d()
  .catch(console.error)
  .finally(() => p.$disconnect());
