const prisma = require('../../../config/prisma');

async function checkIn(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { employee: true }
  });

  if (!user || !user.employee) {
    const err = new Error('Employee record not found');
    err.status = 404;
    throw err;
  }

  const today = new Date().toISOString().split('T')[0];
  const todayDate = new Date(today);

  return prisma.$transaction(async (tx) => {
    // 1. Ensure Attendance summary record exists for today
    const attendance = await tx.attendance.upsert({
      where: {
        employeeId_date: {
          employeeId: user.employee.id,
          date: todayDate
        }
      },
      create: {
        employeeId: user.employee.id,
        date: todayDate,
        status: 'PRESENT'
      },
      update: {
        status: 'PRESENT'
      }
    });

    // 2. Add the IN log
    await tx.attendanceLog.create({
      data: {
        attendanceId: attendance.id,
        type: 'IN',
        timestamp: new Date()
      }
    });

    // 3. Update the main record's last checkIn (for display)
    return tx.attendance.update({
      where: { id: attendance.id },
      data: { checkIn: new Date() },
      include: { logs: { orderBy: { timestamp: 'desc' } } }
    });
  });
}

async function checkOut(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { employee: true }
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
          date: todayDate
        }
      },
      include: { logs: { orderBy: { timestamp: 'desc' } } }
    });

    if (!attendance) {
      const err = new Error('No check-in found for today');
      err.status = 400;
      throw err;
    }

    // Add the OUT log
    await tx.attendanceLog.create({
      data: {
        attendanceId: attendance.id,
        type: 'OUT',
        timestamp: new Date()
      }
    });

    // Calculate total hours worked for the day (Sum of all IN-OUT pairs)
    const allLogs = await tx.attendanceLog.findMany({
      where: { attendanceId: attendance.id },
      orderBy: { timestamp: 'asc' }
    });

    let totalMs = 0;
    let lastIn = null;

    for (const log of allLogs) {
      if (log.type === 'IN') {
        lastIn = log.timestamp;
      } else if (log.type === 'OUT' && lastIn) {
        totalMs += (log.timestamp - lastIn);
        lastIn = null;
      }
    }

    const hoursWorked = totalMs / (1000 * 60 * 60);

    return tx.attendance.update({
      where: { id: attendance.id },
      data: {
        checkOut: new Date(),
        hoursWorked: parseFloat(hoursWorked.toFixed(4))
      },
      include: { logs: { orderBy: { timestamp: 'desc' } } }
    });
  });
}

async function getAttendanceHistory(userId, limit = 30, offset = 0) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { employee: true }
  });

  if (!user || !user.employee) {
    const err = new Error('Employee record not found');
    err.status = 404;
    throw err;
  }

  const records = await prisma.attendance.findMany({
    where: { employeeId: user.employee.id },
    include: { logs: { orderBy: { timestamp: 'desc' } } },
    take: limit,
    skip: offset,
    orderBy: { date: 'desc' }
  });

  const total = await prisma.attendance.count({
    where: { employeeId: user.employee.id }
  });

  return { records, total, limit, offset };
}

async function listAllAttendance({ date, search } = {}) {
  const targetDate = date ? new Date(date) : new Date();
  targetDate.setHours(0, 0, 0, 0);

  const where = {
    date: targetDate,
    employee: search ? {
      user: { name: { contains: search, mode: 'insensitive' } }
    } : undefined
  };

  const records = await prisma.attendance.findMany({
    where,
    include: { 
      employee: { 
        include: { user: { select: { name: true, email: true } } } 
      },
      logs: { orderBy: { timestamp: 'desc' } }
    },
    orderBy: { checkIn: 'desc' }
  });

  return { records };
}

module.exports = { checkIn, checkOut, getAttendanceHistory, listAllAttendance };
