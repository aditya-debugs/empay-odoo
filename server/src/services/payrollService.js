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
  
  const empSelect = { employee: { select: { id: true, firstName: true, lastName: true } } };
  
  if (type === 'payroll') {
    return await prisma.payroll.findMany({ 
      where: filters.month ? { month: filters.month } : {},
      include: empSelect 
    });
  } else if (type === 'pf') {
    return await prisma.payroll.findMany({ 
      where: filters.month ? { month: filters.month } : {},
      select: { ...empSelect, employeeId: true, basicSalary: true, pfDeduction: true, month: true } 
    });
  } else if (type === 'prof-tax') {
    return await prisma.payroll.findMany({ 
      where: filters.month ? { month: filters.month } : {},
      select: { ...empSelect, employeeId: true, grossSalary: true, professionalTax: true, month: true } 
    });
  } else if (type === 'ytd') {
    const whereClause = {};
    if (filters.employeeId) whereClause.employeeId = filters.employeeId;
    if (filters.year) whereClause.month = { startsWith: filters.year };
    return await prisma.payroll.findMany({ 
      where: whereClause,
      include: empSelect,
      orderBy: { month: 'asc' }
    });
  }
  return [];
};

module.exports = {
  getDashboardStats,
  previewPayroll,
  processPayroll,
  getPayslips,
  getPayslipById,
  generatePDF,
  raiseDispute,
  getDisputes,
  resolveDispute,
  getReport
};
