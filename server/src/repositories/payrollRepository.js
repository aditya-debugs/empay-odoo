const prisma = require('../config/prisma');
const calculator = require('../domain/payroll/calculator');

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
    include: { employee: true }
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

  const employeesWithoutBank = await prisma.employee.count({
    where: { bankAccountNo: { equals: null } }
  });
  
  const employeesWithoutManager = 0;

  // Prisma groupBy does NOT support 'take'. Fetch all and slice manually.
  const payrunsRaw = await prisma.payroll.groupBy({
    by: ['month'],
    _count: { id: true },
    orderBy: { month: 'desc' }
  });
  
  const payrunsSliced = payrunsRaw.slice(0, 3);

  const payruns = await Promise.all(payrunsSliced.map(async p => {
    try {
      if (!p.month) return null;
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
    } catch (err) {
      console.warn(`[Dashboard] Failed to process payrun data for ${p.month}:`, err.message);
      return { month: p.month || 'Unknown', payslipCount: p._count?.id || 0, disputeCount: 0 };
    }
  })).then(results => results.filter(Boolean));

  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    return d.toISOString().slice(0, 7);
  });

  const employerCostData = await Promise.all(months.map(async m => {
    try {
      const r = await prisma.payroll.aggregate({
        _sum: { grossSalary: true },
        where: { month: m, status: 'PROCESSED' }
      });
      return { month: m, amount: Number(r._sum.grossSalary || 0) };
    } catch (err) {
      return { month: m, amount: 0 };
    }
  }));

  const employeeCountData = await Promise.all(months.map(async m => {
    try {
      const parts = m.split('-');
      const d = new Date(Number(parts[0]), Number(parts[1]), 0); // End of month
      const count = await prisma.employee.count({
        where: { joinDate: { lte: d }, status: 'ACTIVE' }
      });
      return { month: m, count };
    } catch (err) {
      return { month: m, count: 0 };
    }
  }));

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
    include: { employee: { select: { firstName: true, lastName: true } } }
  });

  const parts = month.split('-');
  const year = parseInt(parts[0], 10);
  const mInt = parseInt(parts[1], 10);
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

async function recomputePayslip(id) {
  const payslip = await prisma.payslip.findUnique({ where: { id } });
  if (!payslip) throw new Error('Payslip not found');
  const monthStr = `${payslip.year}-${String(payslip.month).padStart(2, '0')}`;
  return (await calculator.processPayrollForEmployee(payslip.employeeId, monthStr)).payslip;
}

async function validatePayslip(id) {
  const payslip = await prisma.payslip.findUnique({ where: { id } });
  if (!payslip) throw new Error('Payslip not found');
  const monthStr = `${payslip.year}-${String(payslip.month).padStart(2, '0')}`;
  await prisma.payroll.update({
    where: { employeeId_month: { employeeId: payslip.employeeId, month: monthStr } },
    data: { status: 'LOCKED' }
  });
  return await prisma.payslip.update({ where: { id }, data: { status: 'GENERATED' } });
}

async function cancelPayslip(id) {
  const payslip = await prisma.payslip.findUnique({ where: { id } });
  if (!payslip) throw new Error('Payslip not found');
  const monthStr = `${payslip.year}-${String(payslip.month).padStart(2, '0')}`;
  await prisma.payroll.updateMany({ where: { employeeId: payslip.employeeId, month: monthStr }, data: { status: 'PENDING' } });
  return await prisma.payslip.delete({ where: { id } });
}

async function getDraftPayslip(employeeId, month) {
  const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
  if (!employee) throw new Error('Employee not found');
  const [year, mInt] = month.split('-').map(Number);
  return {
    id: 'draft', employeeId, employee, month: mInt, year, status: 'DRAFT',
    basicSalary: employee.basicSalary, grossSalary: 0, netSalary: 0,
    earnings: [{ label: 'Basic Salary', amount: employee.basicSalary }],
    deductions: []
  };
}

module.exports = {
  getPayrollByMonth, getDashboardStats, getAllPayslips, getPayslipById, getPayslipsByEmployee,
  getAllDisputes, updateDispute, getPayrollDashboardData, getPayrunSummary, validatePayrun,
  recomputePayslip, validatePayslip, cancelPayslip, getDraftPayslip
};
