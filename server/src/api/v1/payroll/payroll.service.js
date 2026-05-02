const prisma = require('../../../config/prisma');
const settingsService = require('../settings/settings.service');
const { computePayslip } = require('../../../services/payrollCalculator');

function clamp01(x) { return x == null ? null : (x < 0 ? 0 : x); }

/**
 * Build a preview of payslips for a given month — no DB writes.
 * Each employee gets a computed breakdown using OrgSettings + their salary structure.
 */
async function preview({ month, year, adjustments = [] }) {
  const settings = await settingsService.getSettings();
  const employees = await prisma.employee.findMany({
    where: { status: 'ACTIVE' },
    include: { user: { select: { name: true, email: true, role: true, isActive: true } } },
    orderBy: { firstName: 'asc' },
  });

  // Active employees only (and exclude admins — they typically don't have salary)
  const eligible = employees.filter((e) => e.user?.isActive && e.user?.role !== 'ADMIN');

  const adjMap = new Map(adjustments.map((a) => [a.employeeId, a]));
  const workingDays = settings.workingDaysPerMonth;

  const rows = eligible.map((emp) => {
    const adj = adjMap.get(emp.id) || {};
    const paidDays = clamp01(adj.paidDays != null ? Number(adj.paidDays) : workingDays);
    const lopDays  = clamp01(adj.lopDays  != null ? Number(adj.lopDays)  : 0);

    const result = computePayslip({
      employee: emp,
      settings,
      period: { month: Number(month), year: Number(year), workingDays, paidDays, lopDays },
      manual: {
        bonus:           adj.bonus,
        tds:             adj.tds,
        customDeduction: adj.customDeduction,
      },
    });

    return {
      employee: {
        id: emp.id,
        userId: emp.userId,
        firstName: emp.firstName,
        lastName: emp.lastName,
        loginId: null, // attach if we want to fetch from User
        department: emp.department,
        position: emp.position,
        email: emp.user?.email,
      },
      ...result,
    };
  });

  return {
    month: Number(month),
    year: Number(year),
    workingDays,
    settings: {
      profTaxState: settings.profTaxState,
      isMetro: settings.isMetro,
      pfEnabled: settings.pfEnabled,
      esicEnabled: settings.esicEnabled,
    },
    totals: rows.reduce(
      (acc, r) => ({
        gross: acc.gross + r.grossSalary,
        deductions: acc.deductions + r.totalDeductions,
        net: acc.net + r.netSalary,
      }),
      { gross: 0, deductions: 0, net: 0 },
    ),
    rows,
  };
}

/**
 * Process the payrun — same compute as preview, but persist Payslip rows.
 * Idempotent per (employeeId, month, year, version): if payslips exist for the
 * given month, a new version is created.
 */
async function process({ month, year, adjustments = [] }, creatorId) {
  const previewResult = await preview({ month, year, adjustments });

  // Determine next version: if payslips already exist for this month/year, bump.
  const existing = await prisma.payslip.findFirst({
    where: { month: Number(month), year: Number(year) },
    orderBy: { version: 'desc' },
  });
  const nextVersion = existing ? existing.version + 1 : 1;

  const created = await prisma.$transaction(
    previewResult.rows.map((row) =>
      prisma.payslip.create({
        data: {
          employeeId: row.employee.id,
          month: Number(month),
          year: Number(year),
          version: nextVersion,
          workingDays: row.workingDays,
          paidDays: row.paidDays,
          lopDays: row.lopDays,
          basicSalary: row.basicSalary,
          grossSalary: row.grossSalary,
          totalDeductions: row.totalDeductions,
          netSalary: row.netSalary,
          earnings: row.earnings,
          deductions: row.deductions,
          status: 'GENERATED',
          createdById: creatorId,
        },
      }),
    ),
  );

  return {
    month: Number(month),
    year: Number(year),
    version: nextVersion,
    payslipCount: created.length,
    totals: previewResult.totals,
  };
}

/**
 * List all distinct payruns (one row per month/year/version) with summary totals.
 */
async function listRuns() {
  const grouped = await prisma.payslip.groupBy({
    by: ['year', 'month', 'version'],
    _count: { _all: true },
    _sum: { grossSalary: true, totalDeductions: true, netSalary: true },
    orderBy: [{ year: 'desc' }, { month: 'desc' }, { version: 'desc' }],
  });
  return grouped.map((g) => ({
    month: g.month,
    year: g.year,
    version: g.version,
    payslipCount: g._count._all,
    totalGross: Number(g._sum.grossSalary || 0),
    totalDeductions: Number(g._sum.totalDeductions || 0),
    totalNet: Number(g._sum.netSalary || 0),
  }));
}

/**
 * Fetch payslips for a specific (year, month, version=latest if not given).
 */
async function getRun(year, month, version) {
  const where = { year: Number(year), month: Number(month) };
  if (version) where.version = Number(version);
  else {
    const latest = await prisma.payslip.findFirst({
      where, orderBy: { version: 'desc' }, select: { version: true },
    });
    if (!latest) return { year, month, version: null, payslips: [] };
    where.version = latest.version;
  }

  const payslips = await prisma.payslip.findMany({
    where,
    include: { employee: { include: { user: { select: { name: true, email: true } } } } },
    orderBy: { employee: { firstName: 'asc' } },
  });
  return { year: Number(year), month: Number(month), version: where.version, payslips };
}

module.exports = { preview, process, listRuns, getRun };
