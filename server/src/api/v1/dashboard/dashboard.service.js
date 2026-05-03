const prisma = require('../../../config/prisma');

async function getEmployeeDashboard(userId) {
  // Get user with employee details
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { employee: true }
  });

  if (!user || !user.employee) {
    const err = new Error('Employee record not found');
    err.status = 404;
    throw err;
  }

  const employeeId = user.employee.id;

  // Attendance summary for current month
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const attendance = await prisma.attendance.findMany({
    where: {
      employeeId,
      date: { gte: monthStart, lte: monthEnd }
    }
  });

  const presentDays = attendance.filter(a => a.status === 'PRESENT').length;
  const absentDays = attendance.filter(a => a.status === 'ABSENT').length;
  const totalHours = attendance.reduce((sum, a) => sum + Number(a.hoursWorked || 0), 0);

  // Leave allocations for current year
  const leaveAllocations = await prisma.leaveAllocation.findMany({
    where: {
      employeeId,
      year: now.getFullYear()
    }
  });

  // Last payslip
  const lastPayslip = await prisma.payslip.findFirst({
    where: { employeeId },
    orderBy: { createdAt: 'desc' },
    take: 1
  });

  // Recent disputes
  const recentDisputes = await prisma.payslipDispute.findMany({
    where: { raisedById: userId },
    include: { payslip: true },
    orderBy: { createdAt: 'desc' },
    take: 3
  });

  // Recent employees for directory preview
  const recentEmployees = await prisma.employee.findMany({
    where: { status: 'ACTIVE' },
    include: { user: { select: { id: true, name: true, email: true } } },
    take: 6
  });

  return {
    employee: user.employee,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
    attendance: {
      present: presentDays,
      absent: absentDays,
      totalHours: Number(totalHours.toFixed(2)),
      month: `${now.toLocaleString('default', { month: 'long' })} ${now.getFullYear()}`
    },
    leaves: leaveAllocations.map(la => ({
      type: la.type,
      total: la.totalDays,
      used: la.usedDays,
      available: la.totalDays - la.usedDays,
      carriedForward: la.carriedForward
    })),
    lastPayslip: lastPayslip ? {
      id: lastPayslip.id,
      month: lastPayslip.month,
      year: lastPayslip.year,
      netSalary: lastPayslip.netSalary,
      status: lastPayslip.status
    } : null,
    recentDisputes: recentDisputes.map(d => ({
      id: d.id,
      month: d.payslip.month,
      year: d.payslip.year,
      reason: d.reason,
      status: d.status,
      createdAt: d.createdAt
    })),
    recentEmployees
  };
}

async function getAdminDashboard() {
  const totalEmployees = await prisma.employee.count({ where: { status: 'ACTIVE' } });
  
  // Attendance today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const presentToday = await prisma.attendance.count({
    where: {
      date: { gte: today, lt: tomorrow },
      status: 'PRESENT'
    }
  });

  // Pending leave requests
  const pendingLeaves = await prisma.leave.count({
    where: { status: 'PENDING' }
  });

  // Payroll due calculation (sum of basic salaries of active employees)
  const payrollAgg = await prisma.employee.aggregate({
    _sum: { basicSalary: true },
    where: { status: 'ACTIVE' }
  });
  const payrollDue = Number(payrollAgg._sum.basicSalary || 0);

  // Department headcount
  const departments = await prisma.employee.groupBy({
    by: ['department'],
    _count: { _all: true },
    where: { status: 'ACTIVE' }
  });

  // Recent activity (latest leave requests and new joiners)
  const recentLeaves = await prisma.leave.findMany({
    include: { employee: { include: { user: true } } },
    orderBy: { createdAt: 'desc' },
    take: 5
  });

  return {
    stats: {
      totalEmployees,
      presentToday,
      pendingLeaves,
      payrollDue
    },
    departments: departments.map(d => ({
      label: d.department || 'Unassigned',
      count: d._count._all
    })),
    activity: recentLeaves.map(l => ({
      who: l.employee.user.name,
      what: `applied for ${l.type.toLowerCase().replace('_', ' ')} (${l.days} days)`,
      when: l.createdAt,
      type: 'LEAVE'
    }))
  };
}

async function getPayrollDashboard() {
  const now = new Date();
  const thisMonth = now.getMonth() + 1;
  const thisYear = now.getFullYear();

  // Last 6 months
  const last6 = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return { monthStr: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, month: d.getMonth() + 1, year: d.getFullYear() };
  });

  const [totalProcessed, totalPending, openDisputesCount, netPayoutAgg, employeesWithoutBank] = await Promise.all([
    prisma.payslip.count({ where: { status: 'GENERATED' } }),
    prisma.payslip.count({ where: { status: 'COMPUTED' } }),
    prisma.payslipDispute.count({ where: { status: 'OPEN' } }),
    prisma.payslip.aggregate({ _sum: { netSalary: true }, where: { status: 'GENERATED' } }),
    prisma.employee.count({ where: { bankAccountNo: null } }),
  ]);

  // Employer cost per month (sum of grossSalary from generated/computed payslips)
  const employerCostData = await Promise.all(last6.map(async ({ monthStr, month, year }) => {
    const r = await prisma.payslip.aggregate({
      _sum: { grossSalary: true },
      where: { month, year, status: { in: ['GENERATED', 'COMPUTED'] } }
    });
    return { month: monthStr, amount: Number(r._sum.grossSalary || 0) };
  }));

  // Employee count per month
  const employeeCountData = await Promise.all(last6.map(async ({ monthStr, month, year }) => {
    const endOfMonth = new Date(year, month, 0);
    const count = await prisma.employee.count({
      where: { joinDate: { lte: endOfMonth }, status: 'ACTIVE' }
    });
    return { month: monthStr, count };
  }));

  // Payruns (last 3 months with payslip counts and dispute counts)
  const payruns = (await Promise.all(last6.slice(-3).reverse().map(async ({ monthStr, month, year }) => {
    const payslipCount = await prisma.payslip.count({ where: { month, year } });
    if (payslipCount === 0) return null;
    const disputeCount = await prisma.payslipDispute.count({ where: { payslip: { month, year } } });
    return { month: monthStr, payslipCount, disputeCount };
  }))).filter(Boolean);

  return {
    warnings: { employeesWithoutBank, employeesWithoutManager: 0 },
    payruns,
    employerCostData,
    employeeCountData,
    totalProcessed,
    totalPending,
    totalNetPayout: Number(netPayoutAgg._sum.netSalary || 0),
    openDisputesCount,
    thisMonthStatus: (await prisma.payslip.findFirst({
      where: { month: thisMonth, year: thisYear },
      select: { status: true },
      orderBy: { version: 'desc' }
    }))?.status || null,
  };
}

async function getHRDashboard() {
  const totalEmployees = await prisma.employee.count({ where: { status: 'ACTIVE' } });
  
  // Attendance today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const attendanceToday = await prisma.attendance.findMany({
    where: {
      date: { gte: today, lt: tomorrow }
    }
  });

  const presentToday = attendanceToday.filter(a => a.status === 'PRESENT').length;
  const onLeaveToday = attendanceToday.filter(a => a.status === 'ON_LEAVE').length;
  const absentToday = attendanceToday.filter(a => a.status === 'ABSENT').length;

  // Pending leave requests
  const pendingLeaves = await prisma.leave.findMany({
    where: { status: 'PENDING' },
    include: { employee: { include: { user: true } } },
    orderBy: { createdAt: 'desc' },
    take: 5
  });

  const pendingLeavesCount = await prisma.leave.count({
    where: { status: 'PENDING' }
  });

  // New joiners (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const newJoiners = await prisma.employee.findMany({
    where: {
      joinDate: { gte: thirtyDaysAgo },
      status: 'ACTIVE'
    },
    include: { user: true },
    orderBy: { joinDate: 'desc' },
    take: 5
  });

  return {
    stats: {
      totalEmployees,
      presentToday,
      onLeaveToday,
      absentToday,
      pendingLeavesCount
    },
    pendingLeaves,
    newJoiners: newJoiners.map(e => ({
      id: e.user.id,
      name: e.user.name,
      department: e.department,
      position: e.position,
      joinDate: e.joinDate
    }))
  };
}

module.exports = { 
  getEmployeeDashboard, 
  getAdminDashboard, 
  getPayrollDashboard, 
  getHRDashboard 
};
