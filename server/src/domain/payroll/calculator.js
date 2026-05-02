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

async function calculatePayrollForEmployee(employeeId, month) {
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

  // 3. If no attendance records -> proceed with 0 present days (no throw)
  // Removed MISSING_ATTENDANCE throw so payslips generate even with 0 attendance

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

  // 5. Check if already processed
  const existingPayroll = await prisma.payroll.findFirst({
    where: { employeeId, month }
  });
  if (existingPayroll && existingPayroll.status !== 'PENDING') {
    throw { code: 'ALREADY_PROCESSED', employeeId };
  }

  // 6. Run all calculations in sequence
  const workingDays = calculateWorkingDays(month);
  const lopDays = calculateLOP({ workingDays, presentDays, approvedLeaveDays, halfDays });
  
  const basicSalary = Number(employee.basicSalary);
  const perDaySalary = basicSalary / workingDays;
  const lopDeduction = lopDays * perDaySalary;
  const overtimeBonus = calculateOvertimeBonus({ overtimeHours, basic: basicSalary, workingDays });
  
  let grossSalary = basicSalary 
    + Number(employee.hra || 0) 
    + Number(employee.conveyance || 0) 
    + Number(employee.specialAllowance || 0) 
    + Number(employee.otherAllowance || 0) 
    - lopDeduction 
    + overtimeBonus;

  if (grossSalary < 0) grossSalary = 0;

  const pfDeduction = employee.pfEnabled ? calculatePF(basicSalary) : 0;
  const esicDeduction = calculateESIC(grossSalary);
  const tdsDeduction = calculateTDS(basicSalary);
  const professionalTax = calculateProfTax(grossSalary);
  
  let totalDeductions = pfDeduction + esicDeduction + tdsDeduction + professionalTax;
  // Bug fix: Negative salary capped at 0
  let netSalary = grossSalary - totalDeductions;
  
  const wasNegative = netSalary < 0;
  if (wasNegative) {
    netSalary = 0;
    totalDeductions = grossSalary;
  }

  return {
    employeeId,
    employeeName: employee.user?.name || `${employee.firstName} ${employee.lastName}`,
    month,
    basicSalary, workingDays, presentDays, lopDays,
    perDaySalary, lopDeduction, overtimeBonus, grossSalary,
    pfDeduction, esicDeduction, tdsDeduction, professionalTax,
    totalDeductions, netSalary, status: 'PENDING', cappedAtZero: wasNegative
  };
}

async function processPayrollForEmployee(employeeId, month) {
  const calc = await calculatePayrollForEmployee(employeeId, month);
  const {
    basicSalary, workingDays, presentDays, lopDays,
    perDaySalary, lopDeduction, overtimeBonus, grossSalary,
    pfDeduction, esicDeduction, tdsDeduction, professionalTax,
    totalDeductions, netSalary, cappedAtZero
  } = calc;
  
  // Also fetch employee for some HRA/conveyance needed in payslip breakdown
  const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
  
  const [yearStr, monthStr] = month.split('-');
  const year = parseInt(yearStr, 10);
  const monthNum = parseInt(monthStr, 10);

  // 7. Prisma upsert payroll record
  const payroll = await prisma.payroll.upsert({
    where: { employeeId_month: { employeeId, month } },
    update: {
      basicSalary, workingDays, presentDays, lopDays,
      perDaySalary, lopDeduction, overtimeBonus, grossSalary,
      pfDeduction, esicDeduction, tdsDeduction, professionalTax,
      totalDeductions, netSalary, status: 'PROCESSED', cappedAtZero
    },
    create: {
      employeeId, month,
      basicSalary, workingDays, presentDays, lopDays,
      perDaySalary, lopDeduction, overtimeBonus, grossSalary,
      pfDeduction, esicDeduction, tdsDeduction, professionalTax,
      totalDeductions, netSalary, status: 'PROCESSED', cappedAtZero
    }
  });

  // 8. Prisma create payslip
  // Note: Using existing Payslip fields (`earnings` and `deductions` arrays of objects) 
  // since the existing Payslip model was preserved per user constraint.
  const earnings = [
    { label: 'Basic Salary', amount: basicSalary },
    { label: 'HRA', amount: Number(employee.hra || 0) },
    { label: 'Conveyance', amount: Number(employee.conveyance || 0) },
    { label: 'Special Allowance', amount: Number(employee.specialAllowance || 0) },
    { label: 'Other Allowance', amount: Number(employee.otherAllowance || 0) },
    { label: 'Overtime Bonus', amount: overtimeBonus }
  ].filter(e => e.amount > 0);

  const deductions = [
    { label: 'LOP Deduction', amount: lopDeduction },
    { label: 'PF', amount: pfDeduction },
    { label: 'ESIC', amount: esicDeduction },
    { label: 'TDS', amount: tdsDeduction },
    { label: 'Professional Tax', amount: professionalTax }
  ].filter(d => d.amount > 0);

  const existingPayslip = await prisma.payslip.findFirst({
    where: { employeeId, month: monthNum, year },
    orderBy: { version: 'desc' }
  });

  const nextVersion = existingPayslip ? existingPayslip.version + 1 : 1;

  const payslip = await prisma.payslip.create({
    data: {
      employeeId,
      month: monthNum,
      year,
      version: nextVersion,
      workingDays,
      paidDays: workingDays - lopDays,
      lopDays,
      basicSalary,
      grossSalary,
      totalDeductions,
      netSalary,
      cappedAtZero,
      earnings,
      deductions,
      status: 'GENERATED'
    }
  });

  // 9. Return
  return { payroll, payslip };
}

async function processPayrollForMonth(month) {
  const employees = await prisma.employee.findMany({
    where: { status: 'ACTIVE' }
  });

  const processed = [];
  const failed = [];

  for (const emp of employees) {
    try {
      const result = await processPayrollForEmployee(emp.id, month);
      processed.push(result);
    } catch (error) {
      failed.push({ employeeId: emp.id, error: error.code || error.message || 'UNKNOWN_ERROR' });
    }
  }

  return { processed, failed };
}

async function previewPayrollForMonth(month) {
  const employees = await prisma.employee.findMany({
    where: { status: 'ACTIVE' }
  });

  const preview = [];
  for (const emp of employees) {
    try {
      const calc = await calculatePayrollForEmployee(emp.id, month);
      
      // Save preview to DB so it doesn't disappear on revisit
      await prisma.payroll.upsert({
        where: { employeeId_month: { employeeId: emp.id, month } },
        update: {
          basicSalary: calc.basicSalary, workingDays: calc.workingDays, presentDays: calc.presentDays, lopDays: calc.lopDays,
          perDaySalary: calc.perDaySalary, lopDeduction: calc.lopDeduction, overtimeBonus: calc.overtimeBonus, grossSalary: calc.grossSalary,
          pfDeduction: calc.pfDeduction, esicDeduction: calc.esicDeduction, tdsDeduction: calc.tdsDeduction, professionalTax: calc.professionalTax,
          totalDeductions: calc.totalDeductions, netSalary: calc.netSalary, status: 'PENDING', cappedAtZero: calc.cappedAtZero
        },
        create: {
          employeeId: emp.id, month,
          basicSalary: calc.basicSalary, workingDays: calc.workingDays, presentDays: calc.presentDays, lopDays: calc.lopDays,
          perDaySalary: calc.perDaySalary, lopDeduction: calc.lopDeduction, overtimeBonus: calc.overtimeBonus, grossSalary: calc.grossSalary,
          pfDeduction: calc.pfDeduction, esicDeduction: calc.esicDeduction, tdsDeduction: calc.tdsDeduction, professionalTax: calc.professionalTax,
          totalDeductions: calc.totalDeductions, netSalary: calc.netSalary, status: 'PENDING', cappedAtZero: calc.cappedAtZero
        }
      });
      
      preview.push(calc);
    } catch (error) {
      preview.push({ 
        employeeId: emp.id, 
        employeeName: `${emp.firstName} ${emp.lastName}`,
        error: error.code || error.message || 'UNKNOWN_ERROR', 
        status: 'ERROR' 
      });
    }
  }
  return preview;
}

module.exports = {
  processPayrollForEmployee,
  processPayrollForMonth,
  previewPayrollForMonth
};
