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
  const pendingDisputes = await prisma.payslipDispute.count({
    where: { status: 'OPEN' }
  });

  const payrollRuns = await prisma.payslip.groupBy({
    by: ['year', 'month', 'status'],
    _count: { _all: true },
    where: { status: 'GENERATED' }
  });

  const totalGenerated = payrollRuns.reduce((sum, run) => sum + run._count._all, 0);

  const thisMonth = new Date().getMonth() + 1;
  const thisYear = new Date().getFullYear();

  const currentRun = await prisma.payslip.count({
    where: { month: thisMonth, year: thisYear, status: 'GENERATED' }
  });

  return {
    pendingDisputes,
    totalGenerated,
    currentRun,
    recentActivity: [
      { text: `${currentRun} payslips generated for this month.` },
      { text: `${pendingDisputes} disputes waiting for review.` }
    ]
  };
}

module.exports = { getEmployeeDashboard, getAdminDashboard, getPayrollDashboard };
