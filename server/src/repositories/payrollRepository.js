const prisma = require('../config/prisma');

const getPayrollByMonth = async (month) => {
  return await prisma.payroll.findMany({
    where: { month },
    include: { employee: { select: { id: true, firstName: true, lastName: true } } }
  });
};

const getDashboardStats = async () => {
  const currentMonth = new Date().toISOString().substring(0, 7);

  const totalProcessed = await prisma.payroll.count({
    where: { status: 'PROCESSED' }
  });

  const totalPending = await prisma.payroll.count({
    where: { status: 'PENDING' }
  });

  const netPayoutResult = await prisma.payroll.aggregate({
    _sum: { netSalary: true },
    where: { status: 'PROCESSED' }
  });
  const totalNetPayout = netPayoutResult._sum.netSalary || 0;

  const thisMonthStatusQuery = await prisma.payroll.findFirst({
    where: { month: currentMonth },
    select: { status: true }
  });
  const thisMonthStatus = thisMonthStatusQuery?.status || 'PENDING';

  const last6Months = Array.from({ length: 6 }).map((_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    return d.toISOString().substring(0, 7);
  }).reverse();

  const trendData = await prisma.payroll.groupBy({
    by: ['month', 'status'],
    where: { month: { in: last6Months } },
    _count: { _all: true }
  });

  const monthlyTrend = last6Months.map(m => {
    const processed = trendData.find(t => t.month === m && t.status === 'PROCESSED')?._count?._all || 0;
    const pending = trendData.find(t => t.month === m && t.status === 'PENDING')?._count?._all || 0;
    return { month: m, processed, pending, Processed: processed, Pending: pending };
  });

  const recentDisputes = await prisma.payslipDispute.findMany({
    where: { status: 'OPEN' },
    include: { payslip: { include: { employee: { select: { firstName: true, lastName: true } } } } },
    orderBy: { createdAt: 'desc' },
    take: 3
  });

  const openDisputesCount = await prisma.payslipDispute.count({ where: { status: 'OPEN' } });

  return { totalProcessed, totalPending, totalNetPayout, thisMonthStatus, monthlyTrend, recentDisputes, openDisputesCount };
};
const getAllPayslips = async (filters = {}) => {
  return await prisma.payslip.findMany({
    where: filters,
    include: { employee: { select: { id: true, firstName: true, lastName: true } } },
    orderBy: [{ year: 'desc' }, { month: 'desc' }]
  });
};

const getPayslipById = async (id) => {
  return await prisma.payslip.findUnique({
    where: { id },
    include: { employee: true } // Payroll not included since it's not strongly linked in this phase, but can be via employee+month
  });
};

const getPayslipsByEmployee = async (employeeId) => {
  return await prisma.payslip.findMany({
    where: { employeeId },
    include: { employee: { select: { firstName: true, lastName: true } } },
    orderBy: [{ year: 'desc' }, { month: 'desc' }]
  });
};

const getAllDisputes = async (filters = {}) => {
  return await prisma.payslipDispute.findMany({
    where: filters,
    include: { 
      payslip: { include: { employee: { select: { firstName: true, lastName: true } } } },
      raisedBy: { select: { name: true } }
    },
    orderBy: { createdAt: 'desc' }
  });
};

const updateDispute = async (id, data) => {
  return await prisma.payslipDispute.update({
    where: { id },
    data
  });
};

module.exports = {
  getPayrollByMonth,
  getDashboardStats,
  getAllPayslips,
  getPayslipById,
  getPayslipsByEmployee,
  getAllDisputes,
  updateDispute
};
