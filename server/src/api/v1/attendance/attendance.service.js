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

  // Check if already checked in
  const existing = await prisma.attendance.findUnique({
    where: {
      employeeId_date: {
        employeeId: user.employee.id,
        date: todayDate
      }
    }
  });

  if (existing && existing.checkIn) {
    const err = new Error('Already checked in today');
    err.status = 400;
    throw err;
  }

  const attendance = await prisma.attendance.upsert({
    where: {
      employeeId_date: {
        employeeId: user.employee.id,
        date: todayDate
      }
    },
    create: {
      employeeId: user.employee.id,
      date: todayDate,
      checkIn: new Date(),
      status: 'PRESENT'
    },
    update: {
      checkIn: new Date(),
      status: 'PRESENT'
    }
  });

  return attendance;
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

  const existing = await prisma.attendance.findUnique({
    where: {
      employeeId_date: {
        employeeId: user.employee.id,
        date: todayDate
      }
    }
  });

  if (!existing || !existing.checkIn) {
    const err = new Error('No check-in found for today');
    err.status = 400;
    throw err;
  }

  const checkOutTime = new Date();
  const hoursWorked = (checkOutTime - existing.checkIn) / (1000 * 60 * 60);

  const attendance = await prisma.attendance.update({
    where: {
      employeeId_date: {
        employeeId: user.employee.id,
        date: todayDate
      }
    },
    data: {
      checkOut: checkOutTime,
      hoursWorked: parseFloat(hoursWorked.toFixed(2))
    }
  });

  return attendance;
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
      regularization: true
    },
    orderBy: { checkIn: 'desc' }
  });

  return { records };
}

// ==========================================
// Regularization
// ==========================================

async function raiseRegularization(userId, { date, reason }) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { employee: true }
  });

  if (!user || !user.employee) throw new Error('Employee record not found');

  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);

  // Upsert attendance record as ABSENT (if it didn't exist) so we can attach a request
  const attendance = await prisma.attendance.upsert({
    where: {
      employeeId_date: { employeeId: user.employee.id, date: targetDate }
    },
    create: {
      employeeId: user.employee.id,
      date: targetDate,
      status: 'ABSENT' // Start as absent
    },
    update: {}
  });

  const existingReq = await prisma.attendanceRegularization.findUnique({
    where: { attendanceId: attendance.id }
  });

  if (existingReq && existingReq.status !== 'REJECTED') {
    throw new Error('A pending or approved regularization request already exists for this date.');
  }

  const req = await prisma.attendanceRegularization.upsert({
    where: { attendanceId: attendance.id },
    create: {
      attendanceId: attendance.id,
      reason,
      status: 'PENDING'
    },
    update: {
      reason,
      status: 'PENDING',
      reviewedById: null,
      reviewedAt: null
    }
  });

  return req;
}

async function listRegularizationRequests() {
  const requests = await prisma.attendanceRegularization.findMany({
    include: {
      attendance: {
        include: {
          employee: { include: { user: { select: { name: true, email: true } } } }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
  return requests;
}

async function reviewRegularization(reqId, reviewerId, { status }) {
  if (!['APPROVED', 'REJECTED'].includes(status)) {
    throw new Error('Invalid status');
  }

  const req = await prisma.attendanceRegularization.update({
    where: { id: reqId },
    data: {
      status,
      reviewedById: reviewerId,
      reviewedAt: new Date()
    },
    include: { attendance: true }
  });

  // If approved, update the attendance status to REGULARIZED
  if (status === 'APPROVED') {
    await prisma.attendance.update({
      where: { id: req.attendanceId },
      data: {
        status: 'REGULARIZED',
        // We could also set a dummy checkIn/checkOut or hours worked here if required.
        // For now we just mark it as regularized (present equivalent).
      }
    });
  }

  return req;
}

module.exports = { checkIn, checkOut, getAttendanceHistory, listAllAttendance, raiseRegularization, listRegularizationRequests, reviewRegularization };

