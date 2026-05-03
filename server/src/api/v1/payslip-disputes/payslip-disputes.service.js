const prisma = require('../../../config/prisma');

// Reasons that belong to Payroll Officer
const PAYROLL_REASONS = [
  'Mismatched Work Hours',
  'Unrecorded Overtime',
  'Balance Disputes',
  'Missing Benefits/Allowances',
];

function resolveRoute(reason) {
  return PAYROLL_REASONS.includes(reason) ? 'PAYROLL' : 'HR';
}

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
      routedTo: resolveRoute(reason),
      status: 'OPEN'
    }
  });

  return dispute;
}

async function getDisputeQueue(role) {
  // ADMIN & PAYROLL_OFFICER see everything
  // HR_OFFICER only sees HR-routed disputes
  const where = role === 'HR_OFFICER' ? { routedTo: 'HR' } : {};

  const disputes = await prisma.payslipDispute.findMany({
    where,
    include: {
      payslip: { include: { employee: true } },
      raisedBy: { select: { name: true } }
    },
    orderBy: { createdAt: 'desc' }
  });
  return { disputes };
}

async function resolveDispute(disputeId, resolvedById, resolverRole, { resolution, status }) {
  const dispute = await prisma.payslipDispute.findUnique({ where: { id: disputeId } });
  if (!dispute) {
    const err = new Error('Dispute not found'); err.status = 404; throw err;
  }
  // HR Officers can only resolve disputes routed to HR
  if (resolverRole === 'HR_OFFICER' && dispute.routedTo !== 'HR') {
    const err = new Error('Access denied: this dispute is handled by the Payroll Officer');
    err.status = 403; throw err;
  }
  return prisma.payslipDispute.update({
    where: { id: disputeId },
    data: { status, resolution, resolvedById, resolvedAt: new Date() }
  });
}

module.exports = { getMyDisputes, raiseDispute, getDisputeQueue, resolveDispute };
