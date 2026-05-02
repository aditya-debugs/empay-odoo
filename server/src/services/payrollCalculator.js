const { computeProfTax } = require('../utils/profTax');

const round = (n) => Math.round(Number(n) || 0);
const num = (v) => Number(v ?? 0);

/**
 * Pure payslip calculator.
 *
 * Inputs:
 *   employee  — Employee record (basicSalary, hra, conveyance, …, pfEnabled, pfPercent)
 *   settings  — OrgSettings record
 *   period    — { month (1-12), year, workingDays, paidDays, lopDays }
 *   manual    — { bonus, tds, customDeduction }   (admin can override per row in preview)
 *
 * Output:
 *   { earnings[], deductions[], grossSalary, totalDeductions, netSalary,
 *     basicSalary, basicEarned, workingDays, paidDays, lopDays,
 *     employerContributions: { pf, esic } }
 */
function computePayslip({ employee, settings, period, manual = {} }) {
  const workingDays = period.workingDays || settings.workingDaysPerMonth || 26;
  const paidDays    = period.paidDays    ?? workingDays;
  const lopDays     = period.lopDays     ?? Math.max(0, workingDays - paidDays);
  const proRation   = workingDays > 0 ? paidDays / workingDays : 1;

  // ─────── Earnings (full-month figures, then pro-rated)
  const basicMonth = num(employee.basicSalary);
  const basicEarned = round(basicMonth * proRation);

  // HRA: explicit amount on employee, else compute from org HRA %
  let hraMonth;
  if (employee.hra != null) {
    hraMonth = num(employee.hra);
  } else {
    const pct = settings.isMetro ? num(settings.metroHraPercent) : num(settings.nonMetroHraPercent);
    hraMonth = basicMonth * pct / 100;
  }
  const hraEarned = round(hraMonth * proRation);

  const conveyanceMonth = employee.conveyance != null ? num(employee.conveyance) : num(settings.conveyanceDefault);
  const conveyanceEarned = round(conveyanceMonth * proRation);

  const specialEarned = round(num(employee.specialAllowance) * proRation);
  const otherEarned   = round(num(employee.otherAllowance) * proRation);

  const bonus = round(manual.bonus);

  const gross = basicEarned + hraEarned + conveyanceEarned + specialEarned + otherEarned + bonus;

  // ─────── Deductions
  // PF
  let pfEmployee = 0;
  let pfEmployer = 0;
  const pfEnabled = settings.pfEnabled && employee.pfEnabled !== false;
  const meetsPfThreshold = basicMonth >= num(settings.pfBasicThreshold);
  if (pfEnabled && (meetsPfThreshold || employee.pfEnabled === true)) {
    const pct = employee.pfPercent != null ? num(employee.pfPercent) : num(settings.pfEmployeePercent);
    pfEmployee = round(basicEarned * pct / 100);
    pfEmployer = round(basicEarned * num(settings.pfEmployerPercent) / 100);
  }

  // Professional Tax
  const profTax = round(employee.professionalTax != null && manual.useEmployeeProfTax
    ? num(employee.professionalTax)
    : computeProfTax(settings.profTaxState, gross, period.month));

  // ESIC
  let esicEmployee = 0;
  let esicEmployer = 0;
  if (settings.esicEnabled && gross <= num(settings.esicGrossThreshold)) {
    esicEmployee = round(gross * num(settings.esicEmployeePercent) / 100);
    esicEmployer = round(gross * num(settings.esicEmployerPercent) / 100);
  }

  const tds = round(manual.tds);
  const customDeduction = round(manual.customDeduction);

  const totalDeductions = pfEmployee + profTax + esicEmployee + tds + customDeduction;
  const net = gross - totalDeductions;

  return {
    workingDays,
    paidDays,
    lopDays,
    basicSalary: basicMonth,
    basicEarned,
    earnings: [
      { label: 'Basic Salary',      amount: basicEarned },
      { label: 'HRA',               amount: hraEarned },
      { label: 'Conveyance',        amount: conveyanceEarned },
      { label: 'Special Allowance', amount: specialEarned },
      { label: 'Other Allowances',  amount: otherEarned },
      ...(bonus > 0 ? [{ label: 'Bonus', amount: bonus }] : []),
    ].filter((row) => row.amount > 0 || row.label === 'Basic Salary'),
    deductions: [
      ...(pfEmployee > 0      ? [{ label: 'PF (Employee)',    amount: pfEmployee }] : []),
      ...(profTax > 0         ? [{ label: 'Professional Tax', amount: profTax }] : []),
      ...(esicEmployee > 0    ? [{ label: 'ESIC (Employee)',  amount: esicEmployee }] : []),
      ...(tds > 0             ? [{ label: 'TDS',              amount: tds }] : []),
      ...(customDeduction > 0 ? [{ label: 'Other Deductions', amount: customDeduction }] : []),
    ],
    grossSalary: gross,
    totalDeductions,
    netSalary: net,
    employerContributions: { pf: pfEmployer, esic: esicEmployer },
  };
}

module.exports = { computePayslip };
