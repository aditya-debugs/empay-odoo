const prisma = require('../../config/prisma');
const { calculateWorkingDays } = require('./calculators/workingDays');
const { calculateLOP } = require('./calculators/lop');
const {
  calculatePF,
  calculateESIC,
  calculateTDS,
  calculateProfTax,
  calculateOvertimeBonus
} = require('./calculators/deductions');

async function processPayrollForEmployee(employeeId, month) {
  // 1. Fetch employee (basicSalary, joiningDate)
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    include: { user: { select: { name: true } } }
  });
  if (!employee) throw { code: 'EMPLOYEE_NOT_FOUND', employeeId };

  // 2. Fetch attendance records
  const [yearStr, monthStr] = month.split('-');
  const year = parseInt(yearStr, 10);
  const monthNum = parseInt(monthStr, 10);
  
  const startDate = new Date(year, monthNum - 1, 1);
  const endDate = new Date(year, monthNum, 0);

  const attendances = await prisma.attendance.findMany({
    where: {
      employeeId,
      date: { gte: startDate, lte: endDate }
    }
  });

  // Calculate attendance summaries
  const presentDays = attendances.filter(a => a.status === 'PRESENT' || a.status === 'REGULARIZED').length;
  const halfDays = attendances.filter(a => a.status === 'HALF_DAY').length;
  const overtimeHours = attendances.reduce((sum, a) => sum + (Number(a.hoursWorked || 0) > 8 ? Number(a.hoursWorked) - 8 : 0), 0);

  // 4. Fetch approved leaves overlapping month
  const leaves = await prisma.leave.findMany({
    where: {
      employeeId,
      status: 'APPROVED',
      startDate: { lte: endDate },
      endDate: { gte: startDate }
    }
  });

  let approvedLeaveDays = 0;
  for (const leave of leaves) {
    const leaveStart = new Date(Math.max(leave.startDate.getTime(), startDate.getTime()));
    const leaveEnd = new Date(Math.min(leave.endDate.getTime(), endDate.getTime()));
    const days = (leaveEnd.getTime() - leaveStart.getTime()) / (1000 * 3600 * 24) + 1;
    approvedLeaveDays += (days > 0 ? days : 0);
  }

  // 5. Check if already processed (Locked)
  const existingPayroll = await prisma.payslip.findFirst({
    where: { employeeId, month: monthNum, year },
    orderBy: { version: 'desc' }
  });
  if (existingPayroll && (existingPayroll.status === 'LOCKED' || existingPayroll.status === 'GENERATED')) {
    throw { code: 'ALREADY_LOCKED', employeeId };
  }

  // 6. Run all calculations in sequence
  const workingDays = calculateWorkingDays(month);
  const lopDays = calculateLOP({ workingDays, presentDays, approvedLeaveDays, halfDays });
  
  const basicSalary = Number(employee.basicSalary);
  const perDaySalary = basicSalary / workingDays;
  const lopDeduction = lopDays * perDaySalary;
  const overtimeBonus = calculateOvertimeBonus({ overtimeHours, basic: basicSalary, workingDays });
  
  const hra   = Math.round(basicSalary * 0.50 * 100) / 100;
  const sa    = Math.round(basicSalary * 0.1667 * 100) / 100;
  const pb    = Math.round(basicSalary * 0.0833 * 100) / 100;
  const lta   = Math.round(basicSalary * 0.0833 * 100) / 100;
  const fixed = Math.round((basicSalary - (hra + sa + pb + lta)) * 100) / 100;

  const grossSalary = basicSalary + hra + sa + pb + lta + fixed - lopDeduction + overtimeBonus;

  const pfEmployee   = Math.round(basicSalary * 0.06 * 100) / 100;
  const pfEmployer   = Math.round(basicSalary * 0.06 * 100) / 100;
  const pfDeduction  = pfEmployee + pfEmployer;

  let professionalTax = 0;
  if (grossSalary > 10000) professionalTax = 200;
  else if (grossSalary > 7500) professionalTax = 175;

  const annualGross = grossSalary * 12;
  let annualTax = 0;
  if (annualGross > 1000000) annualTax = 112500 + (annualGross - 1000000) * 0.30;
  else if (annualGross > 500000) annualTax = 12500 + (annualGross - 500000) * 0.20;
  else if (annualGross > 250000) annualTax = (annualGross - 250000) * 0.05;
  const tdsDeduction = Math.round((annualTax / 12) * 100) / 100;

  const totalDeductions = pfDeduction + professionalTax + tdsDeduction;
  const netSalary = Math.max(0, grossSalary - totalDeductions);

  // 7. Build earnings/deductions breakdown
  const earnings = [
    { label: 'Basic Salary', amount: basicSalary },
    { label: 'House Rent Allowance', amount: hra },
    { label: 'Standard Allowance', amount: sa },
    { label: 'Performance Bonus', amount: pb },
    { label: 'Leave Travel Allowance', amount: lta },
    { label: 'Fixed Allowance', amount: fixed },
    { label: 'Overtime Bonus', amount: overtimeBonus }
  ].filter(e => e.amount > 0);

  const deductions = [
    { label: 'LOP Deduction', amount: lopDeduction },
    { label: 'PF Employee', amount: pfEmployee },
    { label: "PF Employer's", amount: pfEmployer },
    { label: 'TDS Deduction', amount: tdsDeduction },
    { label: 'Professional Tax', amount: professionalTax }
  ].filter(d => d.amount > 0);

  const breakdown = {
    earnings, deductions,
    workedDays: {
      attendance: presentDays,
      approvedLeaves: approvedLeaveDays,
      halfDays,
      lopDays,
      workingDays,
      perDaySalary
    },
    grossSalary, totalDeductions, netSalary
  };

  const existingPayslip = await prisma.payslip.findFirst({
    where: { employeeId, month: monthNum, year },
    orderBy: { version: 'desc' }
  });

  const nextVersion = existingPayslip ? existingPayslip.version + 1 : 1;

  const payslip = await prisma.payslip.create({
    data: {
      employeeId, month: monthNum, year, version: nextVersion,
      workingDays, paidDays: workingDays - lopDays, lopDays,
      basicSalary, grossSalary, totalDeductions, netSalary,
      earnings, deductions, status: 'COMPUTED'
    }
  });

  return { payslip, breakdown };
}

async function processPayrollForMonth(month) {
  const [yearStr, monthStr] = month.split('-');
  const year     = parseInt(yearStr,  10);
  const monthNum = parseInt(monthStr, 10);

  const employees = await prisma.employee.findMany({ where: { status: 'ACTIVE' } });

  const processed = [];
  const failed    = [];
  let totalNet = 0, totalGross = 0, totalDeductions = 0;
  let version = 1;

  for (const emp of employees) {
    try {
      const result = await processPayrollForEmployee(emp.id, month);
      processed.push(result);
      totalNet        += Number(result.payslip.netSalary    || 0);
      totalGross      += Number(result.payslip.grossSalary  || 0);
      totalDeductions += Number(result.payslip.totalDeductions || 0);
      if (result.payslip.version > version) version = result.payslip.version;
    } catch (error) {
      failed.push({ employeeId: emp.id, error: error.code || error.message || 'UNKNOWN_ERROR' });
    }
  }

  return {
    payslipCount: processed.length,
    failedCount:  failed.length,
    month:        monthNum,
    year,
    version,
    totals: {
      gross:      Math.round(totalGross      * 100) / 100,
      net:        Math.round(totalNet        * 100) / 100,
      deductions: Math.round(totalDeductions * 100) / 100,
    },
    processed,
    failed,
  };
}

async function previewPayrollForMonth(month) {
  const [yearStr, monthStr] = month.split('-');
  const year     = parseInt(yearStr,  10);
  const monthNum = parseInt(monthStr, 10);

  const startDate = new Date(year, monthNum - 1, 1);
  const endDate   = new Date(year, monthNum, 0);

  const employees = await prisma.employee.findMany({
    where: { status: 'ACTIVE' },
    include: { user: { select: { name: true } } }
  });

  const workingDays = calculateWorkingDays(month);

  const rows = [];
  let totalGross = 0, totalNet = 0, totalDeductions = 0;

  for (const emp of employees) {
    try {
      // ── attendance for the month ──────────────────────────────────────────
      const attendances = await prisma.attendance.findMany({
        where: { employeeId: emp.id, date: { gte: startDate, lte: endDate } }
      });
      const presentDays   = attendances.filter(a => a.status === 'PRESENT' || a.status === 'REGULARIZED').length;
      const halfDays      = attendances.filter(a => a.status === 'HALF_DAY').length;
      const overtimeHours = attendances.reduce((s, a) => s + (Number(a.hoursWorked || 0) > 8 ? Number(a.hoursWorked) - 8 : 0), 0);

      // ── approved leaves overlapping this month ────────────────────────────
      const leaves = await prisma.leave.findMany({
        where: { employeeId: emp.id, status: 'APPROVED', startDate: { lte: endDate }, endDate: { gte: startDate } }
      });
      let approvedLeaveDays = 0;
      for (const l of leaves) {
        const ls = new Date(Math.max(l.startDate.getTime(), startDate.getTime()));
        const le = new Date(Math.min(l.endDate.getTime(),   endDate.getTime()));
        const d  = (le - ls) / 86400000 + 1;
        if (d > 0) approvedLeaveDays += d;
      }

      // ── salary calculation (read-only — NO DB writes) ─────────────────────
      const lopDays      = calculateLOP({ workingDays, presentDays, approvedLeaveDays, halfDays });
      const basicSalary  = Number(emp.basicSalary || 0);
      const perDaySalary = workingDays > 0 ? basicSalary / workingDays : 0;
      const lopDeduction = lopDays * perDaySalary;
      const overtimeBonus = calculateOvertimeBonus({ overtimeHours, basic: basicSalary, workingDays });

      const hra   = Math.round(basicSalary * 0.50   * 100) / 100;
      const sa    = Math.round(basicSalary * 0.1667 * 100) / 100;
      const pb    = Math.round(basicSalary * 0.0833 * 100) / 100;
      const lta   = Math.round(basicSalary * 0.0833 * 100) / 100;
      const fixed = Math.round((basicSalary - (hra + sa + pb + lta)) * 100) / 100;

      const grossSalary = basicSalary + hra + sa + pb + lta + fixed - lopDeduction + overtimeBonus;

      const pfDeduction = Math.round(basicSalary * 0.12 * 100) / 100;  // 12% total PF
      let professionalTax = 0;
      if (grossSalary > 10000) professionalTax = 200;
      else if (grossSalary > 7500) professionalTax = 175;
      const annualGross = grossSalary * 12;
      let annualTax = 0;
      if (annualGross > 1000000) annualTax = 112500 + (annualGross - 1000000) * 0.30;
      else if (annualGross > 500000) annualTax = 12500 + (annualGross - 500000) * 0.20;
      else if (annualGross > 250000) annualTax = (annualGross - 250000) * 0.05;
      const tdsDeduction = Math.round((annualTax / 12) * 100) / 100;

      const totalDeductionsRow = pfDeduction + professionalTax + tdsDeduction;
      const netSalary = Math.max(0, grossSalary - totalDeductionsRow);

      // Check if a payslip already exists for this month
      const existing = await prisma.payslip.findFirst({
        where: { employeeId: emp.id, month: monthNum, year },
        orderBy: { version: 'desc' }
      });

      rows.push({
        employeeId: emp.id,
        employee: {
          firstName:  emp.firstName,
          lastName:   emp.lastName,
          department: emp.department,
          position:   emp.position,
        },
        basicSalary,
        grossSalary: Math.round(grossSalary * 100) / 100,
        totalDeductions: Math.round(totalDeductionsRow * 100) / 100,
        netSalary:   Math.round(netSalary * 100) / 100,
        workingDays,
        paidDays:    workingDays - lopDays,
        presentDays,
        lopDays:     Math.round(lopDays * 100) / 100,
        status:      existing?.status ?? 'DRAFT',
        payslipId:   existing?.id ?? null,
      });

      totalGross       += grossSalary;
      totalNet         += netSalary;
      totalDeductions  += totalDeductionsRow;
    } catch (err) {
      rows.push({
        employeeId: emp.id,
        employee: { firstName: emp.firstName, lastName: emp.lastName, department: emp.department, position: emp.position },
        error:  err.message || 'UNKNOWN_ERROR',
        status: 'ERROR',
      });
    }
  }

  return {
    rows,
    workingDays,
    totals: {
      gross:       Math.round(totalGross      * 100) / 100,
      net:         Math.round(totalNet        * 100) / 100,
      deductions:  Math.round(totalDeductions * 100) / 100,
    }
  };
}

module.exports = {
  processPayrollForEmployee,
  processPayrollForMonth,
  previewPayrollForMonth
};
