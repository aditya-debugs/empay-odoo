const attendanceService = require('./src/api/v1/attendance/attendance.service.js');
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const p = new PrismaClient();

async function test() {
  let out = '';
  try {
    const user = await p.user.findFirst({ where: { email: 'employee@empay.com' } });
    await attendanceService.getAttendanceHistory(user.id);
    out += 'success me\n';
  } catch (e) {
    out += 'GET ERR: ' + e.stack + '\n';
  }
  try {
    const user = await p.user.findFirst({ where: { email: 'employee@empay.com' } });
    await attendanceService.checkIn(user.id);
    out += 'success checkin\n';
  } catch (e) {
    out += 'POST ERR: ' + e.stack + '\n';
  }
  fs.writeFileSync('err_out.txt', out);
}

test().finally(() => p.$disconnect());
