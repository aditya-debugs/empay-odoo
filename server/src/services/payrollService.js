const repository = require('../repositories/payrollRepository');
const calculator = require('../domain/payroll/calculator');

const assertRole = (user, roles) => {
  if (!roles.includes(user.role)) {
    const err = new Error('Forbidden');
    err.status = 403;
    throw err;
  }
};

const getDashboardStats = async (user) => {
  assertRole(user, ['ADMIN', 'PAYROLL_OFFICER']);
  return await repository.getDashboardStats();
};

const previewPayroll = async (month, user) => {
  assertRole(user, ['ADMIN', 'PAYROLL_OFFICER']);
  return await calculator.previewPayrollForMonth(month);
};

const processPayroll = async (month, user) => {
  assertRole(user, ['ADMIN', 'PAYROLL_OFFICER']);
  return await calculator.processPayrollForMonth(month);
};

const processIndividualPayroll = async (employeeId, month, user) => {
  assertRole(user, ['ADMIN', 'PAYROLL_OFFICER']);
  return await calculator.processPayrollForEmployee(employeeId, month);
};

const getPayslips = async (filters, user) => {
  if (user.role === 'EMPLOYEE') {
    // Need to get user's employeeId
    const prisma = require('../config/prisma');
    const emp = await prisma.employee.findUnique({ where: { userId: user.id } });
    if (!emp) throw new Error('Employee record not found');
    filters.employeeId = emp.id;
  } else {
    assertRole(user, ['ADMIN', 'PAYROLL_OFFICER']);
  }
  return await repository.getAllPayslips(filters);
};

const getPayslipById = async (id, user) => {
  const payslip = await repository.getPayslipById(id);
  if (!payslip) {
    const err = new Error('Not found');
    err.status = 404;
    throw err;
  }
  if (user.role === 'EMPLOYEE') {
    const prisma = require('../config/prisma');
    const emp = await prisma.employee.findUnique({ where: { userId: user.id } });
    if (!emp || emp.id !== payslip.employeeId) {
      const err = new Error('Forbidden');
      err.status = 403;
      throw err;
    }
  }
  return payslip;
};

const generatePDF = async (payslipId, user) => {
  const payslip = await getPayslipById(payslipId, user);
  // Stub for generating PDF
  const pdfPath = `/uploads/payslips/${payslipId}.pdf`;
  const prisma = require('../config/prisma');
  await prisma.payslip.update({
    where: { id: payslipId },
    data: { pdfUrl: pdfPath }
  });
  return { pdfPath };
};

const raiseDispute = async (payslipId, reason, user) => {
  assertRole(user, ['EMPLOYEE']);
  const prisma = require('../config/prisma');
  
  const payslip = await repository.getPayslipById(payslipId);
  const emp = await prisma.employee.findUnique({ where: { userId: user.id } });
  
  if (!payslip || !emp || payslip.employeeId !== emp.id) {
    const err = new Error('Invalid payslip');
    err.status = 400;
    throw err;
  }

  return await prisma.payslipDispute.create({
    data: {
      payslipId,
      raisedById: user.id,
      reason,
      status: 'OPEN'
    }
  });
};

const getDisputes = async (filters = {}, user) => {
  const repository = require('../repositories/payrollRepository');
  const where = {};
  if (user.role === 'EMPLOYEE') {
    where.raisedById = user.id;
  } else {
    assertRole(user, ['ADMIN', 'PAYROLL_OFFICER']);
    if (filters.employeeId) where.payslip = { employeeId: filters.employeeId };
  }
  return await repository.getAllDisputes(where);
};

const resolveDispute = async (id, action, note, user) => {
  assertRole(user, ['ADMIN', 'PAYROLL_OFFICER']);
  
  const statusMap = {
    'RESOLVE': 'RESOLVED',
    'REJECT': 'REJECTED',
    'REISSUE': 'REVISED'
  };
  
  const newStatus = statusMap[action] || 'RESOLVED';

  return await repository.updateDispute(id, {
    status: newStatus,
    resolution: note,
    resolvedById: user.id,
    resolvedAt: new Date()
  });
};

const getReport = async (type, filters, user) => {
  assertRole(user, ['ADMIN', 'PAYROLL_OFFICER']);
  const prisma = require('../config/prisma');

  const empInclude = { employee: { select: { id: true, firstName: true, lastName: true } } };

  // filters.month and filters.year arrive as separate query params (integers as strings)
  const buildMonthWhere = () => {
    const where = {};
    if (filters.year)  where.year  = parseInt(filters.year,  10);
    if (filters.month) where.month = parseInt(filters.month, 10);
    return where;
  };

  const dedupeLatest = (rows) => {
    const map = {};
    for (const r of rows) {
      const key = `${r.employeeId}-${r.year}-${r.month}`;
      if (!map[key] || r.version > map[key].version) map[key] = r;
    }
    return Object.values(map);
  };

  if (type === 'payroll') {
    const rows = await prisma.payslip.findMany({
      where: buildMonthWhere(),
      include: empInclude,
      orderBy: [{ year: 'desc' }, { month: 'desc' }, { version: 'desc' }]
    });
    return dedupeLatest(rows);
  } else if (type === 'pf') {
    const rows = await prisma.payslip.findMany({
      where: buildMonthWhere(),
      include: empInclude,
      orderBy: [{ year: 'desc' }, { month: 'desc' }, { version: 'desc' }]
    });
    return dedupeLatest(rows).map(r => {
      const deductions = Array.isArray(r.deductions) ? r.deductions : [];
      const pfEntry = deductions.find(d => d.label?.toLowerCase().includes('pf') || d.label?.toLowerCase().includes('provident'));
      return {
        employeeId: r.employeeId,
        employee: r.employee,
        basicSalary: Number(r.basicSalary || 0),
        pfAmount: Number(pfEntry?.amount ?? 0),
        month: r.month,
        year: r.year,
      };
    });
  } else if (type === 'prof-tax') {
    const rows = await prisma.payslip.findMany({
      where: buildMonthWhere(),
      include: empInclude,
      orderBy: [{ year: 'desc' }, { month: 'desc' }, { version: 'desc' }]
    });
    return dedupeLatest(rows).map(r => {
      const deductions = Array.isArray(r.deductions) ? r.deductions : [];
      const ptEntry = deductions.find(d => d.label?.toLowerCase().includes('professional') || d.label?.toLowerCase().includes('pt'));
      return {
        employeeId: r.employeeId,
        employee: r.employee,
        grossSalary: Number(r.grossSalary || 0),
        ptAmount: Number(ptEntry?.amount ?? 0),
        month: r.month,
        year: r.year,
      };
    });
  } else if (type === 'ytd') {
    const whereClause = {};
    if (filters.employeeId) whereClause.employeeId = filters.employeeId;
    if (filters.year) whereClause.year = parseInt(filters.year, 10);
    const rows = await prisma.payslip.findMany({
      where: whereClause,
      include: empInclude,
      orderBy: [{ year: 'asc' }, { month: 'asc' }]
    });
    // For YTD, group by employee and sum net/gross across all months
    const all = dedupeLatest(rows);
    const empMap = {};
    for (const r of all) {
      const key = r.employeeId;
      if (!empMap[key]) {
        empMap[key] = { employeeId: key, employee: r.employee, ytdGross: 0, ytdNet: 0, ytdDeductions: 0 };
      }
      empMap[key].ytdGross      += Number(r.grossSalary   || 0);
      empMap[key].ytdNet        += Number(r.netSalary     || 0);
      empMap[key].ytdDeductions += Number(r.totalDeductions || 0);
    }
    return Object.values(empMap);
  }
  return [];
};

module.exports = {
  getDashboardStats,
  previewPayroll,
  processPayroll,
  processIndividualPayroll,
  getPayslips,
  getPayslipById,
  generatePDF,
  raiseDispute,
  getDisputes,
  resolveDispute,
  getReport
};
