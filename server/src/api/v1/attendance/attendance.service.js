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
  // Always interpret the date as a local calendar date ("YYYY-MM-DD") to avoid UTC offset issues.
  const dateStr = date || new Date().toLocaleDateString('en-CA'); // "YYYY-MM-DD"
  const dayStart = new Date(`${dateStr}T00:00:00.000Z`);
  const dayEnd   = new Date(`${dateStr}T23:59:59.999Z`);

  // Fetch all active employees (optionally filtered by search)
  const employeeWhere = search
    ? { user: { name: { contains: search, mode: 'insensitive' } } }
    : {};

  // CASUAL_LEAVE is treated as absent (unplanned), all other approved leave types → ON_LEAVE
  const ON_LEAVE_TYPES = ['PAID_LEAVE', 'UNPAID_LEAVE', 'SICK_LEAVE', 'MATERNITY_LEAVE', 'PATERNITY_LEAVE'];

  const [allEmployees, attendanceRecords, leaveRecords] = await Promise.all([
    prisma.employee.findMany({
      where: employeeWhere,
      include: { user: { select: { id: true, name: true, email: true, loginId: true } } },
      orderBy: { firstName: 'asc' },
    }),
    prisma.attendance.findMany({
      where: {
        date: { gte: dayStart, lte: dayEnd },
        ...(search ? { employee: { user: { name: { contains: search, mode: 'insensitive' } } } } : {}),
      },
      include: {
        employee: { include: { user: { select: { name: true, email: true } } } },
        regularization: true,
      },
    }),
    prisma.leave.findMany({
      where: {
        status: 'APPROVED',
        startDate: { lte: dayEnd },
        endDate:   { gte: dayStart },
      },
      select: { employeeId: true, type: true },
    }),
  ]);

  const attendanceMap = {};
  for (const a of attendanceRecords) attendanceMap[a.employeeId] = a;

  // Build per-employee leave status: ON_LEAVE for formal leaves, ABSENT for casual
  const leaveStatusMap = {};
  for (const l of leaveRecords) {
    leaveStatusMap[l.employeeId] = ON_LEAVE_TYPES.includes(l.type) ? 'ON_LEAVE' : 'ABSENT';
  }

  // Build unified records for all employees
  const records = allEmployees.map(emp => {
    const leaveStatus = leaveStatusMap[emp.id]; // 'ON_LEAVE' | 'ABSENT' | undefined

    if (attendanceMap[emp.id]) {
      // Has an attendance record — override status if on formal leave
      const rec = attendanceMap[emp.id];
      return {
        ...rec,
        status: leaveStatus === 'ON_LEAVE' ? 'ON_LEAVE' : rec.status,
        leaveType: leaveRecords.find(l => l.employeeId === emp.id)?.type || null,
      };
    }

    // No attendance record for this date
    const status = leaveStatus || 'ABSENT';
    return {
      id: `virtual-${emp.id}-${dateStr}`,
      employeeId: emp.id,
      date: dayStart,
      status,
      checkIn: null,
      checkOut: null,
      hoursWorked: 0,
      employee: { ...emp, department: emp.department },
      regularization: null,
      leaveType: leaveRecords.find(l => l.employeeId === emp.id)?.type || null,
    };
  });

  // Sort: present first, then on_leave, then absent
  const order = { PRESENT: 0, REGULARIZED: 1, ON_LEAVE: 2, ABSENT: 3 };
  records.sort((a, b) => (order[a.status] ?? 9) - (order[b.status] ?? 9));

  return { records };
}

async function raiseRegularization(userId, { date, reason }) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { employee: true },
  });

  if (!user || !user.employee) {
    const err = new Error('Employee record not found');
    err.status = 404;
    throw err;
  }

  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);

  // Upsert attendance record for the date if it doesn't exist
  const attendance = await prisma.attendance.upsert({
    where: { employeeId_date: { employeeId: user.employee.id, date: targetDate } },
    create: { employeeId: user.employee.id, date: targetDate, status: 'ABSENT' },
    update: {},
  });

  // Create or update the regularization request
  return prisma.attendanceRegularization.upsert({
    where: { attendanceId: attendance.id },
    create: { attendanceId: attendance.id, reason, status: 'PENDING' },
    update: { reason, status: 'PENDING' },
  });
}

async function listRegularizationRequests() {
  return prisma.attendanceRegularization.findMany({
    include: {
      attendance: {
        include: {
          employee: {
            include: { user: { select: { name: true, loginId: true } } },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

async function reviewRegularization(id, reviewerId, { status }) {
  const allowed = ['APPROVED', 'REJECTED'];
  if (!allowed.includes(status)) {
    const err = new Error(`Status must be one of: ${allowed.join(', ')}`);
    err.status = 400;
    throw err;
  }

  return prisma.attendanceRegularization.update({
    where: { id },
    data: { status, reviewedById: reviewerId, reviewedAt: new Date() },
  });
}

module.exports = {
  checkIn,
  checkOut,
  getAttendanceHistory,
  listAllAttendance,
  raiseRegularization,
  listRegularizationRequests,
  reviewRegularization,
};
