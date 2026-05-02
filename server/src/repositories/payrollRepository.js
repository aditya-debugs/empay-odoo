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

async function getPayrollDashboardData() {
  const currentMonth = new Date().toISOString().slice(0, 7);

  // Warnings — adapted to actual Employee model (bankAccountNo exists, managerId does not)
  const employeesWithoutBank = await prisma.employee.count({
    where: { bankAccountNo: null }
  });
  
  // managerId is not in schema, so we set this to 0 for now to avoid crash
  const employeesWithoutManager = 0;

  // Payrun list — last 3 months with payslip counts and dispute counts
  const payrunsRaw = await prisma.payroll.groupBy({
    by: ['month'],
    _count: { id: true },
    orderBy: { month: 'desc' },
    take: 3
  });

  const payruns = await Promise.all(payrunsRaw.map(async p => {
    const [year, month] = p.month.split('-').map(Number);
    const disputeCount = await prisma.payslipDispute.count({
      where: {
        payslip: {
          month,
          year
        }
      }
    });
    return {
      month: p.month,
      payslipCount: p._count.id,
      disputeCount
    };
  }));

  // Last 6 months array helper
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    return d.toISOString().slice(0, 7);
  });

  // Employer cost per month (sum of grossSalary for PROCESSED payrolls)
  const employerCostData = await Promise.all(months.map(async m => {
    const r = await prisma.payroll.aggregate({
      _sum: { grossSalary: true },
      where: { month: m, status: 'PROCESSED' }
    });
    return { month: m, amount: Number(r._sum.grossSalary || 0) };
  }));

  // Employee count per month
  const employeeCountData = await Promise.all(months.map(async m => {
    const endOfMonth = new Date(m + '-28');
    const count = await prisma.employee.count({
      where: { joinDate: { lte: endOfMonth }, status: 'ACTIVE' }
    });
    return { month: m, count };
  }));

  // This month payroll status
  const thisMonth = await prisma.payroll.findFirst({
    where: { month: currentMonth },
    select: { status: true }
  });

  return {
    warnings: { employeesWithoutBank, employeesWithoutManager },
    payruns,
    employerCostData,
    employeeCountData,
    thisMonthStatus: thisMonth?.status || null
  };
}

async function getPayrunSummary(month) {
  const payrolls = await prisma.payroll.findMany({
    where: { month },
    include: { 
      employee: { 
        select: { 
          firstName: true, 
          lastName: true, 
          loginId: true 
        } 
      } 
    }
  });

  const [year, mInt] = month.split('-').map(Number);
  const payslips = await prisma.payslip.findMany({
    where: { month: mInt, year: year }
  });

  const totalGross = payrolls.reduce((s, p) => s + Number(p.grossSalary || 0), 0);
  const totalNet = payrolls.reduce((s, p) => s + Number(p.netSalary || 0), 0);

  return {
    month,
    employerCost: totalGross,
    gross: totalGross,
    net: totalNet,
    payslipCount: payrolls.length,
    status: payrolls[0]?.status || null,
    payslips: payrolls.map(p => {
      const ps = payslips.find(ps => ps.employeeId === p.employeeId);
      return {
        payslipId: ps?.id,
        employeeId: p.employeeId,
        employeeName: `${p.employee.firstName} ${p.employee.lastName}`,
        employerCost: p.grossSalary,
        basicWage: p.basicSalary,
        grossWage: p.grossSalary,
        netWage: p.netSalary,
        status: p.status,
        cappedAtZero: p.cappedAtZero
      };
    })
  };
}

async function validatePayrun(month) {
  const result = await prisma.payroll.updateMany({
    where: { month, status: 'PROCESSED' },
    data: { status: 'LOCKED' }
  });
  return { month, validated: result.count };
}

async function validatePayslip(id) {
  const payslip = await prisma.payslip.findUnique({ where: { id } });
  if (!payslip) throw new Error('Payslip not found');

  const monthStr = `${payslip.year}-${String(payslip.month).padStart(2, '0')}`;
  
  await prisma.payroll.updateMany({
    where: { employeeId: payslip.employeeId, month: monthStr },
    data: { status: 'LOCKED' }
  });

  return await prisma.payslip.update({
    where: { id },
    data: { status: 'GENERATED' } // Or 'LOCKED' if you add it to enum
  });
}

async function cancelPayslip(id) {
  const payslip = await prisma.payslip.findUnique({ where: { id } });
  if (!payslip) throw new Error('Payslip not found');

  const monthStr = `${payslip.year}-${String(payslip.month).padStart(2, '0')}`;

  // Reset payroll record to PENDING
  await prisma.payroll.updateMany({
    where: { employeeId: payslip.employeeId, month: monthStr },
    data: { status: 'PENDING' }
  });

  // Delete payslip to allow regeneration
  return await prisma.payslip.delete({ where: { id } });
}

async function getDraftPayslip(employeeId, month) {
  const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
  if (!employee) throw new Error('Employee not found');

  const [year, mInt] = month.split('-').map(Number);
  
  // Reuse some of the logic from preview or just return basic info
  return {
    id: 'draft',
    employeeId,
    employee,
    month: mInt,
    year,
    status: 'DRAFT',
    basicSalary: employee.basicSalary,
    grossSalary: 0,
    netSalary: 0,
    earnings: [
      { label: 'Basic Salary', amount: employee.basicSalary },
      { label: 'HRA', amount: 0 },
      { label: 'Conveyance', amount: 0 },
      { label: 'Special Allowance', amount: 0 },
      { label: 'Other Allowance', amount: 0 },
      { label: 'Overtime Bonus', amount: 0 }
    ],
    deductions: [
      { label: 'LOP Deduction', amount: 0 },
      { label: 'PF', amount: 0 },
      { label: 'TDS', amount: 0 },
      { label: 'Professional Tax', amount: 0 }
    ]
  };
}

module.exports = {
  getPayrollByMonth,
  getDashboardStats,
  getAllPayslips,
  getPayslipById,
  getPayslipsByEmployee,
  getAllDisputes,
  updateDispute,
  getPayrollDashboardData,
  getPayrunSummary,
  validatePayrun,
  validatePayslip,
  cancelPayslip,
  getDraftPayslip
};
