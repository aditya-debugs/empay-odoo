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
  const thisMonth = new Date().getMonth() + 1;
  const thisYear = new Date().getFullYear();

  const [totalProcessed, totalPending, openDisputesCount, netPayoutAgg, monthlyRaw, recentDisputes] = await Promise.all([
    prisma.payslip.count({ where: { status: 'GENERATED' } }),
    prisma.payslip.count({ where: { status: 'DRAFT' } }),
    prisma.payslipDispute.count({ where: { status: 'OPEN' } }),
    prisma.payslip.aggregate({ _sum: { netSalary: true }, where: { status: 'GENERATED' } }),
    // Group by year+month for last 6 months trend
    prisma.payslip.groupBy({
      by: ['year', 'month', 'status'],
      _count: { _all: true },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
      take: 12,
    }),
    prisma.payslipDispute.findMany({
      where: { status: 'OPEN' },
      include: { payslip: { include: { employee: true } } },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
  ]);

  // Build monthly trend: merge processed/pending counts per month
  const trendMap = {};
  for (const row of monthlyRaw) {
    const key = `${row.year}-${String(row.month).padStart(2, '0')}`;
    if (!trendMap[key]) trendMap[key] = { month: key, Processed: 0, Pending: 0 };
    if (row.status === 'GENERATED') trendMap[key].Processed += row._count._all;
    else trendMap[key].Pending += row._count._all;
  }
  const monthlyTrend = Object.values(trendMap).sort((a, b) => a.month.localeCompare(b.month));

  return {
    totalProcessed,
    totalPending,
    totalNetPayout: Number(netPayoutAgg._sum.netSalary || 0),
    currentRun: await prisma.payslip.count({ where: { month: thisMonth, year: thisYear, status: 'GENERATED' } }),
    openDisputesCount,
    monthlyTrend,
    recentDisputes,
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
