const prisma = require('../../../config/prisma');

async function getMyLeaves(userId) {
  const employee = await prisma.employee.findUnique({
    where: { userId }
  });
  if (!employee) throw new Error('Employee not found');

  const leaves = await prisma.leave.findMany({
    where: { employeeId: employee.id },
    orderBy: { createdAt: 'desc' }
  });

  return { leaves };
}

async function getMyLeaveBalance(userId) {
  const employee = await prisma.employee.findUnique({
    where: { userId }
  });
  if (!employee) throw new Error('Employee not found');

  const balances = await prisma.leaveAllocation.findMany({
    where: { 
      employeeId: employee.id
    }
  });

  return { balances };
}

async function applyLeave(userId, data) {
  const { type, startDate, endDate, reason, attachmentUrl } = data;
  
  const employee = await prisma.employee.findUnique({
    where: { userId }
  });
  if (!employee) throw new Error('Employee not found');

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (end < start) {
    const err = new Error('End date cannot be before start date');
    err.status = 400;
    throw err;
  }

  // Calculate days (simple difference)
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

  const leave = await prisma.leave.create({
    data: {
      employeeId: employee.id,
      type,
      startDate: start,
      endDate: end,
      days: diffDays,
      reason,
      attachmentUrl,
      status: 'PENDING'
    }
  });

  return leave;
}

async function getLeaveQueue() {
  return prisma.leave.findMany({
    include: { 
      employee: { 
        include: { user: { select: { name: true } } } 
      } 
    },
    orderBy: { createdAt: 'desc' }
  });
}

async function updateLeaveStatus(leaveId, approvedById, { status, adminNote }) {
  return prisma.$transaction(async (tx) => {
    // 1. Get current leave data
    const leave = await tx.leave.findUnique({
      where: { id: leaveId },
      select: { id: true, status: true, days: true, type: true, employeeId: true, startDate: true }
    });

    if (!leave) throw new Error('Leave record not found');
    
    // 2. If transitioning TO approved, deduct from allocation
    if (status === 'APPROVED' && leave.status !== 'APPROVED') {
      const allocation = await tx.leaveAllocation.findFirst({
        where: { employeeId: leave.employeeId, type: leave.type }
      });
      if (allocation) {
        await tx.leaveAllocation.update({
          where: { id: allocation.id },
          data: { usedDays: { increment: leave.days } }
        });
      }
    }
    
    // 3. If transitioning FROM approved to rejected/pending, restore balance
    if (leave.status === 'APPROVED' && status !== 'APPROVED') {
      const allocation = await tx.leaveAllocation.findFirst({
        where: { employeeId: leave.employeeId, type: leave.type }
      });
      if (allocation) {
        await tx.leaveAllocation.update({
          where: { id: allocation.id },
          data: { usedDays: { decrement: leave.days } }
        });
      }
    }

    // 4. Update the leave record
    return tx.leave.update({
      where: { id: leaveId },
      data: {
        status,
        approvedById,
        approvedAt: new Date(),
        reviewNote: adminNote
      }
    });
  });
}

async function getEmployeeLeaves(employeeId) {
  const leaves = await prisma.leave.findMany({
    where: { employeeId },
    orderBy: { createdAt: 'desc' }
  });
  return { leaves };
}

async function allocateLeave({ employeeId, type, year, totalDays }) {
  // Use upsert so we can either create a new allocation or update an existing one
  return prisma.leaveAllocation.upsert({
    where: {
      employeeId_type_year: {
        employeeId,
        type,
        year: parseInt(year, 10)
      }
    },
    update: {
      totalDays
    },
    create: {
      employeeId,
      type,
      year: parseInt(year, 10),
      totalDays
    }
  });
}

async function getAllLeaveAllocations() {
  return prisma.leaveAllocation.findMany({
    include: {
      employee: {
        include: { user: { select: { name: true } } }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
}

module.exports = { getMyLeaves, getMyLeaveBalance, applyLeave, getLeaveQueue, updateLeaveStatus, getEmployeeLeaves, allocateLeave, getAllLeaveAllocations };

