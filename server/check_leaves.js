const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.leave.findMany({
  select: { id: true, reason: true, attachmentUrl: true, createdAt: true },
  orderBy: { createdAt: 'desc' }
}).then(l => console.log('Current Leaves:', l)).finally(() => prisma.$disconnect());
