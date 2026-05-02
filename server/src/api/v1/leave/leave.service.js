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
      employeeId: employee.id,
      year: new Date().getFullYear()
    }
  });

  return { balances };
}

async function applyLeave(userId, data) {
  const { type, startDate, endDate, reason } = data;
  
  const employee = await prisma.employee.findUnique({
    where: { userId }
  });
  if (!employee) throw new Error('Employee not found');

  // Calculate days (simple difference)
  const start = new Date(startDate);
  const end = new Date(endDate);
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
      const year = new Date(leave.startDate).getFullYear();
      
      // Update balance
      await tx.leaveAllocation.update({
        where: {
          employeeId_type_year: {
            employeeId: leave.employeeId,
            type: leave.type,
            year: year
          }
        },
        data: {
          usedDays: { increment: leave.days }
        }
      });
    }
    
    // 3. If transitioning FROM approved to rejected/pending, restore balance (optional but good)
    if (leave.status === 'APPROVED' && status !== 'APPROVED') {
      const year = new Date(leave.startDate).getFullYear();
      await tx.leaveAllocation.update({
        where: {
          employeeId_type_year: {
            employeeId: leave.employeeId,
            type: leave.type,
            year: year
          }
        },
        data: {
          usedDays: { decrement: leave.days }
        }
      });
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

module.exports = { getMyLeaves, getMyLeaveBalance, applyLeave, getLeaveQueue, updateLeaveStatus };
