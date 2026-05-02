const prisma = require('../../../config/prisma');

exports.getAttendanceReport = async () => {
  return await prisma.attendance.findMany({
    include: { employee: { select: { firstName: true, lastName: true, department: true } } },
    orderBy: { date: 'desc' },
    take: 100
  });
};

exports.getLeaveReport = async () => {
  return await prisma.leave.findMany({
    include: { employee: { select: { firstName: true, lastName: true, department: true } } },
    orderBy: { createdAt: 'desc' },
    take: 100
  });
};

exports.getPayrollReport = async () => {
  return await prisma.payslip.findMany({
    include: { employee: { select: { firstName: true, lastName: true, department: true } } },
    orderBy: { createdAt: 'desc' },
    take: 100
  });
};

exports.getHeadcountReport = async () => {
  const activeCount = await prisma.employee.count({ where: { status: 'ACTIVE' } });
  const inactiveCount = await prisma.employee.count({ where: { status: { not: 'ACTIVE' } } });
  const byDept = await prisma.employee.groupBy({ by: ['department'], _count: { _all: true } });
  
  return { active: activeCount, inactive: inactiveCount, byDepartment: byDept };
};

exports.getPfReport = async () => {
  const payslips = await prisma.payslip.findMany({
    where: { status: 'GENERATED' },
    include: { employee: { select: { firstName: true, lastName: true, pan: true, aadhaar: true } } },
    orderBy: { createdAt: 'desc' },
    take: 100
  });
  
  // Extract PF data from deductions json
  return payslips.map(p => {
    let pfAmount = 0;
    if (Array.isArray(p.deductions)) {
      const pfDeduction = p.deductions.find(d => d.label === 'PF' || d.label === 'Provident Fund');
      if (pfDeduction) pfAmount = pfDeduction.amount;
    }
    return {
      employee: `${p.employee.firstName} ${p.employee.lastName}`,
      month: p.month,
      year: p.year,
      pfAmount,
      aadhaar: p.employee.aadhaar
    };
  });
};

exports.getProfTaxReport = async () => {
  const payslips = await prisma.payslip.findMany({
    where: { status: 'GENERATED' },
    include: { employee: { select: { firstName: true, lastName: true } } },
    orderBy: { createdAt: 'desc' },
    take: 100
  });
  
  return payslips.map(p => {
    let ptAmount = 0;
    if (Array.isArray(p.deductions)) {
      const ptDeduction = p.deductions.find(d => d.label === 'PT' || d.label === 'Professional Tax');
      if (ptDeduction) ptAmount = ptDeduction.amount;
    }
    return {
      employee: `${p.employee.firstName} ${p.employee.lastName}`,
      month: p.month,
      year: p.year,
      ptAmount
    };
  });
};

exports.getYtdReport = async () => {
  const currentYear = new Date().getFullYear();
  const runs = await prisma.payslip.groupBy({
    by: ['employeeId'],
    where: { year: currentYear, status: 'GENERATED' },
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
