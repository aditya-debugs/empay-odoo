const attendanceService = require('./src/api/v1/attendance/attendance.service.js');
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const p = new PrismaClient();

async function test() {
  try {
    const user = await p.user.findFirst({ where: { email: 'john@empay.com' } });
    await attendanceService.getAttendanceHistory(user.id);
    fs.writeFileSync('test3.txt', 'success me\n');
  } catch (e) {
    fs.writeFileSync('test3.txt', e.stack);
  }
}

test().finally(() => p.$disconnect());
