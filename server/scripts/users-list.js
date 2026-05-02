// Quick view of who's in the DB. Run: npm run users:list
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  const users = await prisma.user.findMany({
    select: {
      email: true, loginId: true, name: true, role: true,
      isActive: true, mustChangePassword: true, createdAt: true,
    },
    orderBy: { createdAt: 'asc' },
  });
  if (users.length === 0) {
    console.log('No users in DB.');
    console.log('Restart the server (`npm run dev`) and a default admin will be created.');
  } else {
    console.table(users.map((u) => ({
      email: u.email,
      loginId: u.loginId || '—',
      name: u.name,
      role: u.role,
      active: u.isActive ? '✓' : '✗',
      mustReset: u.mustChangePassword ? '!' : '',
      createdAt: u.createdAt.toISOString().slice(0, 16).replace('T', ' '),
    })));
    console.log(`Total: ${users.length}`);
  }
  await prisma.$disconnect();
})();
