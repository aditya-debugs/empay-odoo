const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const dir = await prisma.$queryRaw`SHOW data_directory;`;
  const port = await prisma.$queryRaw`SHOW port;`;
  const ver = await prisma.$queryRaw`SHOW server_version;`;
  console.log('PostgreSQL Server Info Used By Prisma:');
  console.log('Directory:', dir[0]);
  console.log('Port:', port[0]);
  console.log('Version:', ver[0]);
}
main().finally(() => prisma.$disconnect());
