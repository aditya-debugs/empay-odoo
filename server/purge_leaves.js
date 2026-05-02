const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.leave.deleteMany().then(() => console.log('Cleaned db')).finally(() => prisma.$disconnect());
