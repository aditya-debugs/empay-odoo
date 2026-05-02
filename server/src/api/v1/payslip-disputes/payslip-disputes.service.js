const prisma = require('../../../config/prisma');

async function getMyDisputes(userId) {
  const disputes = await prisma.payslipDispute.findMany({
    where: { raisedById: userId },
    include: { payslip: true },
    orderBy: { createdAt: 'desc' }
  });
  return { disputes };
}

async function raiseDispute(userId, data) {
  const { payslipId, reason } = data;
  
  // Verify payslip belongs to user
  const payslip = await prisma.payslip.findUnique({
    where: { id: payslipId },
    include: { employee: true }
  });
  
  if (!payslip || payslip.employee.userId !== userId) {
    const err = new Error('Payslip not found');
    err.status = 404;
    throw err;
  }

  const dispute = await prisma.payslipDispute.create({
    data: {
      payslipId,
      raisedById: userId,
      reason,
      status: 'OPEN'
    }
  });

  return dispute;
}

async function getDisputeQueue() {
  const disputes = await prisma.payslipDispute.findMany({
    include: { 
      payslip: { include: { employee: true } },
      raisedBy: { select: { name: true } }
    },
    orderBy: { createdAt: 'desc' }
  });
  return { disputes };
}

async function resolveDispute(disputeId, resolvedById, { resolution, status }) {
  return prisma.payslipDispute.update({
    where: { id: disputeId },
    data: {
      status,
      resolution,
      resolvedById,
      resolvedAt: new Date()
    }
  });
}

module.exports = { getMyDisputes, raiseDispute, getDisputeQueue, resolveDispute };
