const prisma = require('../../../config/prisma');

exports.getAttendanceReport = async ({ startDate, endDate, department }) => {
  const where = {};
  if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date.gte = new Date(startDate);
    if (endDate) where.date.lte = new Date(endDate);
  }
  if (department) {
    where.employee = { department };
  }

  return await prisma.attendance.findMany({
    where,
    include: {
      employee: {
        select: {
          firstName: true,
          lastName: true,
          department: true,
          user: { select: { name: true, loginId: true } }
        }
      }
    },
    orderBy: [{ date: 'desc' }, { employeeId: 'asc' }],
    take: 200
  });
};

exports.getLeaveReport = async ({ startDate, endDate, department }) => {
  const where = {};
  if (startDate || endDate) {
    where.startDate = {};
    if (startDate) where.startDate.gte = new Date(startDate);
    if (endDate) where.startDate.lte = new Date(endDate);
  }
  if (department) {
    where.employee = { department };
  }

  return await prisma.leave.findMany({
    where,
    include: {
      employee: {
        select: {
          firstName: true,
          lastName: true,
          department: true,
          user: { select: { name: true, loginId: true } }
        }
      }
    },
    orderBy: { startDate: 'desc' },
    take: 200
  });
};

exports.getPayrollReport = async ({ year, month, department }) => {
  const where = {};
  if (year) where.year = parseInt(year, 10);
  if (month) where.month = parseInt(month, 10);
  if (department) {
    where.employee = { department };
  }

  return await prisma.payslip.findMany({
    where,
    include: {
      employee: {
        select: {
          firstName: true,
          lastName: true,
          department: true,
          user: { select: { name: true, loginId: true } }
        }
      }
    },
    orderBy: [{ year: 'desc' }, { month: 'desc' }],
    take: 200
  });
};

exports.getHeadcountReport = async () => {
  return await prisma.employee.groupBy({
    by: ['department', 'status'],
    _count: { id: true }
  });
};

exports.getPfReport = async ({ year, month }) => {
  const where = { status: { in: ['GENERATED', 'COMPUTED'] } };
  if (year) where.year = parseInt(year, 10);
  if (month) where.month = parseInt(month, 10);

  const payslips = await prisma.payslip.findMany({
    where,
    include: { employee: { select: { firstName: true, lastName: true, pan: true, aadhaar: true } } },
    orderBy: { createdAt: 'desc' },
    take: 200
  });
  
  return payslips.map(p => {
    let pfAmount = 0;
    const earnings = Array.isArray(p.earnings) ? p.earnings : [];
    const deductions = Array.isArray(p.deductions) ? p.deductions : [];
    
    // Look in deductions for PF
    const pfDeduction = deductions.find(d => 
      d.label?.toUpperCase().includes('PF') || 
      d.label?.toUpperCase().includes('PROVIDENT FUND')
    );
    if (pfDeduction) pfAmount = pfDeduction.amount;
    
    return {
      employee: `${p.employee.firstName} ${p.employee.lastName}`,
      month: p.month,
      year: p.year,
      pfAmount,
      aadhaar: p.employee.aadhaar
    };
  });
};

exports.getProfTaxReport = async ({ year, month }) => {
  const where = { status: { in: ['GENERATED', 'COMPUTED'] } };
  if (year) where.year = parseInt(year, 10);
  if (month) where.month = parseInt(month, 10);

  const payslips = await prisma.payslip.findMany({
    where,
    include: { employee: { select: { firstName: true, lastName: true } } },
    orderBy: { createdAt: 'desc' },
    take: 200
  });
  
  return payslips.map(p => {
    let ptAmount = 0;
    const deductions = Array.isArray(p.deductions) ? p.deductions : [];
    const ptDeduction = deductions.find(d => 
      d.label?.toUpperCase().includes('PT') || 
      d.label?.toUpperCase().includes('PROFESSIONAL TAX')
    );
    if (ptDeduction) ptAmount = ptDeduction.amount;
    
    return {
      employee: `${p.employee.firstName} ${p.employee.lastName}`,
      month: p.month,
      year: p.year,
      ptAmount
    };
  });
};

exports.getYtdReport = async ({ year, employeeId }) => {
  const currentYear = year ? parseInt(year, 10) : new Date().getFullYear();
  const where = { year: currentYear, status: { in: ['GENERATED', 'COMPUTED'] } };
  if (employeeId) where.employeeId = employeeId;

  const runs = await prisma.payslip.groupBy({
    by: ['employeeId'],
    where,
    _sum: { grossSalary: true, totalDeductions: true, netSalary: true }
  });
  
  const employees = await prisma.employee.findMany({
    where: { id: { in: runs.map(r => r.employeeId) } },
    select: { id: true, firstName: true, lastName: true }
  });
  
  return runs.map(r => {
    const emp = employees.find(e => e.id === r.employeeId);
    return {
      employee: emp ? `${emp.firstName} ${emp.lastName}` : 'Unknown',
      ytdGross: r._sum.grossSalary,
      ytdDeductions: r._sum.totalDeductions,
      ytdNet: r._sum.netSalary
    };
  });
};
