const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const p = new PrismaClient();
p.user.findMany().then(u => fs.writeFileSync('user_db.json', JSON.stringify(u, null, 2))).finally(() => p.$disconnect());
