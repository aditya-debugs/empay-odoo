const prisma = require('../../../config/prisma');

async function checkIn(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { employee: true },
  });

  if (!user || !user.employee) {
    const err = new Error('Employee record not found');
    err.status = 404;
    throw err;
  }

  const today = new Date().toISOString().split('T')[0];
  const todayDate = new Date(today);

  return prisma.$transaction(async (tx) => {
    // Upsert the attendance summary record for today
    const attendance = await tx.attendance.upsert({
      where: {
        employeeId_date: {
          employeeId: user.employee.id,
          date: todayDate,
        },
      },
      create: {
        employeeId: user.employee.id,
        date: todayDate,
        status: 'PRESENT',
        checkIn: new Date(),
      },
      update: {
        status: 'PRESENT',
        checkIn: new Date(),
      },
    });

    // Add IN log entry
    await tx.attendanceLog.create({
      data: {
        attendanceId: attendance.id,
        type: 'IN',
        timestamp: new Date(),
      },
    });

    return tx.attendance.findUnique({
      where: { id: attendance.id },
      include: { logs: { orderBy: { timestamp: 'asc' } } },
    });
  });
}

async function checkOut(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { employee: true },
  });

  if (!user || !user.employee) {
    const err = new Error('Employee record not found');
    err.status = 404;
    throw err;
  }

  const today = new Date().toISOString().split('T')[0];
  const todayDate = new Date(today);

  return prisma.$transaction(async (tx) => {
    const attendance = await tx.attendance.findUnique({
      where: {
        employeeId_date: {
          employeeId: user.employee.id,
          date: todayDate,
        },
      },
      include: { logs: { orderBy: { timestamp: 'asc' } } },
    });

    if (!attendance) {
      const err = new Error('No check-in found for today. Please check in first.');
      err.status = 400;
      throw err;
    }

    // Ensure the last log is an IN (can't check out twice in a row)
    const lastLog = attendance.logs[attendance.logs.length - 1];
    if (lastLog && lastLog.type === 'OUT') {
      const err = new Error(
        'You are already checked out. Please check in again to start a new session.'
      );
      err.status = 400;
      throw err;
    }

    // Add OUT log
    const checkOutTime = new Date();
    await tx.attendanceLog.create({
      data: {
        attendanceId: attendance.id,
        type: 'OUT',
        timestamp: checkOutTime,
      },
    });

    // Recalculate total hours from all IN/OUT pairs
    const allLogs = [...attendance.logs, { type: 'OUT', timestamp: checkOutTime }];
    let totalMs = 0;
    let lastIn = null;

    for (const log of allLogs) {
      if (log.type === 'IN') {
        lastIn = new Date(log.timestamp).getTime();
      } else if (log.type === 'OUT' && lastIn !== null) {
        totalMs += new Date(log.timestamp).getTime() - lastIn;
        lastIn = null;
      }
    }

    const hoursWorked = totalMs / (1000 * 60 * 60);

    return tx.attendance.update({
      where: { id: attendance.id },
      data: {
        checkOut: checkOutTime,
        hoursWorked: parseFloat(hoursWorked.toFixed(6)),
      },
      include: { logs: { orderBy: { timestamp: 'asc' } } },
    });
  });
}

async function getAttendanceHistory(userId, limit = 30, offset = 0) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { employee: true },
  });

  if (!user || !user.employee) {
    const err = new Error('Employee record not found');
    err.status = 404;
    throw err;
  }

  const records = await prisma.attendance.findMany({
    where: { employeeId: user.employee.id },
    include: { logs: { orderBy: { timestamp: 'asc' } } },
    take: limit,
    skip: offset,
    orderBy: { date: 'desc' },
  });

  const total = await prisma.attendance.count({
    where: { employeeId: user.employee.id },
  });

  return { records, total, limit, offset };
}

async function listAllAttendance({ date, search } = {}) {
  const targetDate = date ? new Date(date) : new Date();
  targetDate.setHours(0, 0, 0, 0);

  const where = {
    date: targetDate,
    employee: search
      ? {
          user: { name: { contains: search, mode: 'insensitive' } },
        }
      : undefined,
  };

  const records = await prisma.attendance.findMany({
    where,
    include: {
      employee: {
        include: { user: { select: { name: true, email: true } } },
      },
      // 'logs' relation caused runtime errors for some generated clients —
      // avoid including the nested logs here to keep the list API stable.
      regularization: true,
    },
    orderBy: { checkIn: 'desc' },
  });

  return { records };
}

module.exports = { checkIn, checkOut, getAttendanceHistory, listAllAttendance };
