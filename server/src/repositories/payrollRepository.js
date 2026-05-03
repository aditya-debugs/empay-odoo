const prisma = require('../config/prisma');
const calculator = require('../domain/payroll/calculator');

const getPayrollByMonth = async (month) => {
  const [yearStr, monthStr] = month.split('-');
  return await prisma.payslip.findMany({
    where: { month: parseInt(monthStr, 10), year: parseInt(yearStr, 10) },
    include: { employee: { select: { id: true, firstName: true, lastName: true } } }
  });
};

const getDashboardStats = async () => {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const totalProcessed = await prisma.payslip.count({
    where: { status: 'GENERATED' }
  });

  const totalPending = await prisma.payslip.count({
    where: { status: 'COMPUTED' }
  });

  const netPayoutResult = await prisma.payslip.aggregate({
    _sum: { netSalary: true },
    where: { status: 'GENERATED' }
  });
  const totalNetPayout = netPayoutResult._sum.netSalary || 0;

  const thisMonthStatusQuery = await prisma.payslip.findFirst({
    where: { month: currentMonth, year: currentYear },
    select: { status: true },
    orderBy: { version: 'desc' }
  });
  const thisMonthStatus = thisMonthStatusQuery?.status || 'PENDING';

  const last6Months = Array.from({ length: 6 }).map((_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    return d.toISOString().substring(0, 7);
  }).reverse();

  const monthlyTrend = last6Months.map(m => {
    return { month: m, processed: 0, pending: 0, Processed: 0, Pending: 0 };
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

  // Payrun list — last 3 months derived from payslips
  const last3Months = Array.from({ length: 3 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    return { monthStr: d.toISOString().slice(0, 7), month: d.getMonth() + 1, year: d.getFullYear() };
  });

  const payruns = await Promise.all(last3Months.map(async ({ monthStr, month, year }) => {
    try {
      const payslipCount = await prisma.payslip.count({ where: { month, year } });
      if (payslipCount === 0) return null;
      const disputeCount = await prisma.payslipDispute.count({
        where: { payslip: { month, year } }
      });
      return { month: monthStr, payslipCount, disputeCount };
    } catch (err) {
      console.warn(`[Dashboard] Failed to process payrun data for ${monthStr}:`, err.message);
      return null;
    }
  })).then(results => results.filter(Boolean));

  // Last 6 months array helper
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    return d.toISOString().slice(0, 7);
  });

  // Employer cost per month (sum of grossSalary from generated payslips)
  const employerCostData = await Promise.all(months.map(async m => {
    try {
      const [yearStr, monthStr] = m.split('-');
      const r = await prisma.payslip.aggregate({
        _sum: { grossSalary: true },
        where: { month: parseInt(monthStr, 10), year: parseInt(yearStr, 10), status: { in: ['GENERATED', 'COMPUTED'] } }
      });
      return { month: m, amount: Number(r._sum.grossSalary || 0) };
    } catch (err) {
      console.warn(`[Dashboard] Failed to fetch cost for ${m}:`, err.message);
      return { month: m, amount: 0 };
    }
  }));

  // Employee count per month
  const employeeCountData = await Promise.all(months.map(async m => {
    try {
      const endOfMonth = new Date(m + '-28');
      if (isNaN(endOfMonth.getTime())) throw new Error('Invalid date');
      const count = await prisma.employee.count({
        where: { joinDate: { lte: endOfMonth }, status: 'ACTIVE' }
      });
      return { month: m, count };
    } catch (err) {
      console.warn(`[Dashboard] Failed to fetch count for ${m}:`, err.message);
      return { month: m, count: 0 };
    }
  }));

  // This month payroll status
  const nowDate = new Date();
  const thisMonth = await prisma.payslip.findFirst({
    where: { month: nowDate.getMonth() + 1, year: nowDate.getFullYear() },
    select: { status: true },
    orderBy: { version: 'desc' }
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
  const parts = month.split('-');
  const year = parseInt(parts[0], 10);
  const mInt = parseInt(parts[1], 10);

  const payslips = await prisma.payslip.findMany({
    where: { month: mInt, year },
    include: { employee: { select: { firstName: true, lastName: true } } },
    orderBy: { version: 'desc' }
  });

  // Keep only latest version per employee
  const latestByEmployee = {};
  for (const ps of payslips) {
    if (!latestByEmployee[ps.employeeId]) latestByEmployee[ps.employeeId] = ps;
  }
  const latest = Object.values(latestByEmployee);

  const totalGross = latest.reduce((s, p) => s + Number(p.grossSalary || 0), 0);
  const totalNet = latest.reduce((s, p) => s + Number(p.netSalary || 0), 0);

  return {
    month,
    employerCost: totalGross,
    gross: totalGross,
    net: totalNet,
    payslipCount: latest.length,
    status: latest[0]?.status || null,
    payslips: latest.map(p => ({
      payslipId: p.id,
      employeeId: p.employeeId,
      employeeName: `${p.employee.firstName} ${p.employee.lastName}`,
      employerCost: p.grossSalary,
      basicWage: p.basicSalary,
      grossWage: p.grossSalary,
      netWage: p.netSalary,
      status: p.status,
      cappedAtZero: Number(p.netSalary) === 0
    }))
  };
}

async function validatePayrun(month) {
  const [yearStr, monthStr] = month.split('-');
  const result = await prisma.payslip.updateMany({
    where: { month: parseInt(monthStr, 10), year: parseInt(yearStr, 10), status: 'COMPUTED' },
    data: { status: 'GENERATED' }
  });
  return { month, validated: result.count };
}

async function recomputePayslip(id) {
  const payslip = await prisma.payslip.findUnique({ where: { id } });
  if (!payslip) throw new Error('Payslip not found');

  const monthStr = `${payslip.year}-${String(payslip.month).padStart(2, '0')}`;
  const result = await calculator.processPayrollForEmployee(payslip.employeeId, monthStr);
  return result.payslip;
}

async function validatePayslip(id) {
  const payslip = await prisma.payslip.findUnique({ where: { id } });
  if (!payslip) throw new Error('Payslip not found');

  if (payslip.status === 'GENERATED') throw new Error('Payslip is already validated');
  if (payslip.status !== 'COMPUTED') throw new Error('Payslip must be computed before validating');

  return await prisma.payslip.update({
    where: { id },
    data: { status: 'GENERATED' }
  });
}

async function cancelPayslip(id) {
  const payslip = await prisma.payslip.findUnique({ where: { id } });
  if (!payslip) throw new Error('Payslip not found');

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
  recomputePayslip,
  validatePayslip,
  cancelPayslip,
  getDraftPayslip
};
