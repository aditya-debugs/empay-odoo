const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.user.findMany().then(users => console.log(users)).finally(() => p.$disconnect());
