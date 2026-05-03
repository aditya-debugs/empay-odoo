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
  const existingPayroll = await prisma.payroll.findFirst({
    where: { employeeId, month }
  });
  if (existingPayroll && existingPayroll.status === 'LOCKED') {
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

  // 7. Prisma upsert payroll record
  const payroll = await prisma.payroll.upsert({
    where: { employeeId_month: { employeeId, month } },
    update: {
      basicSalary, workingDays, presentDays, lopDays,
      perDaySalary, lopDeduction, overtimeBonus, grossSalary,
      pfDeduction, tdsDeduction, professionalTax,
      totalDeductions, netSalary, status: 'PROCESSED', cappedAtZero: netSalary === 0
    },
    create: {
      employeeId, month,
      basicSalary, workingDays, presentDays, lopDays,
      perDaySalary, lopDeduction, overtimeBonus, grossSalary,
      pfDeduction, tdsDeduction, professionalTax,
      totalDeductions, netSalary, status: 'PROCESSED', cappedAtZero: netSalary === 0
    }
  });

  // 8. Prisma create/update payslip
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

  return { payroll, payslip, breakdown };
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
  // Preview logic can stay simplified or use the same calc logic without creating payslip
  const employees = await prisma.employee.findMany({
    where: { status: 'ACTIVE' }
  });

  const preview = [];
  for (const emp of employees) {
    try {
      const result = await processPayrollForEmployee(emp.id, month);
      preview.push({
        employeeId: emp.id,
        employeeName: `${emp.firstName} ${emp.lastName}`,
        ...result.payroll
      });
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
