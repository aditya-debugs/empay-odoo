const { jsPDF } = require('jspdf');
const fs = require('fs');
const path = require('path');
const numWords = require('num-words');

function fmtINR(n) {
  return '₹ ' + Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtMonthLong(y, m) {
  return new Date(y, m - 1).toLocaleString('default', { month: 'long', year: 'numeric' });
}

function payPeriod(y, m) {
  const last = new Date(y, m, 0).getDate();
  return `01/${String(m).padStart(2, '0')}/${y} to ${last}/${String(m).padStart(2, '0')}/${y}`;
}

async function generatePayslipPDF(payslip) {
  const emp = payslip.employee;
  const earnings = Array.isArray(payslip.earnings) ? payslip.earnings : [];
  const deductions = Array.isArray(payslip.deductions) ? payslip.deductions : [];

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = 210, M = 14;
  let y = 0;

  // ── HEADER BAR ──
  doc.setFillColor(224, 247, 250);
  doc.rect(0, 0, W, 22, 'F');
  doc.setFontSize(14).setFont(undefined, 'bold').setTextColor(20, 20, 20);
  doc.text('EmPay HRMS', M, 10);
  doc.setFontSize(13);
  doc.text('Salary slip for ' + fmtMonthLong(payslip.year, payslip.month), W / 2, 12, { align: 'center' });
  y = 28;

  // ── EMPLOYEE INFO ──
  doc.setFontSize(9).setFont(undefined, 'normal').setTextColor(50, 50, 50);
  const leftInfo = [
    ['Employee Name', `${emp?.firstName || ''} ${emp?.lastName || ''}`],
    ['Employee ID', emp?.employeeId || emp?.id?.substring(0, 8) || '—'],
    ['Department', emp?.department || '—'],
    ['Designation', emp?.designation || '—'],
    ['Joining Date', emp?.joinDate ? new Date(emp.joinDate).toLocaleDateString('en-IN') : '—']
  ];
  const rightInfo = [
    ['PAN', emp?.pan || '—'],
    ['Aadhaar', emp?.aadhaar || '—'],
    ['Bank A/c No.', emp?.bankAccountNo || '—'],
    ['Pay Period', payPeriod(payslip.year, payslip.month)],
    ['Status', payslip.status]
  ];
  leftInfo.forEach((r, i) => {
    doc.setFont(undefined, 'bold').text(r[0] + ' :', M, y + i * 5.5);
    doc.setFont(undefined, 'normal').text(String(r[1]), M + 36, y + i * 5.5);
  });
  rightInfo.forEach((r, i) => {
    doc.setFont(undefined, 'bold').text(r[0] + ' :', W / 2 + 2, y + i * 5.5);
    doc.setFont(undefined, 'normal').text(String(r[1]), W / 2 + 34, y + i * 5.5);
  });
  y += 34;

  // ── WORKED DAYS ──
  doc.setFillColor(224, 247, 250).rect(M, y, W - M * 2, 7, 'F');
  doc.setFont(undefined, 'bold').setTextColor(20, 20, 20);
  doc.text('Worked Days Summary', M + 2, y + 5);
  doc.text('Days / Count', W - M - 32, y + 5);
  y += 9;
  
  doc.setFont(undefined, 'normal').setTextColor(60, 60, 60);
  doc.text('Working Days in Month', M + 2, y);
  doc.text(String(payslip.workingDays || 0), W - M - 32, y); y += 5;
  doc.text('Paid Days', M + 2, y);
  doc.text(String(payslip.paidDays || 0), W - M - 32, y); y += 5;
  doc.text('LOP Days', M + 2, y);
  doc.setTextColor(180, 0, 0);
  doc.text(String(payslip.lopDays || 0), W - M - 32, y); y += 5;
  doc.setTextColor(60, 60, 60);

  doc.setDrawColor(200).line(M, y, W - M, y); y += 4;
  doc.setFont(undefined, 'bold').setTextColor(20, 20, 20);
  doc.text('Total Payable Days', M + 2, y);
  doc.text(String(payslip.paidDays || 0), W - M - 32, y);
  y += 10;

  // ── EARNINGS + DEDUCTIONS ──
  const colW = (W - M * 2) / 4;
  doc.setFillColor(224, 247, 250).rect(M, y, W - M * 2, 7, 'F');
  doc.setFont(undefined, 'bold').setTextColor(20, 20, 20);
  ['Earnings', 'Amount', 'Deductions', 'Amount'].forEach((h, i) => {
    doc.text(h, M + i * colW + 2, y + 5);
  });
  y += 9;

  const rowCount = Math.max(earnings.length, deductions.length);
  doc.setFont(undefined, 'normal').setTextColor(60, 60, 60);
  for (let i = 0; i < rowCount; i++) {
    const e = earnings[i] || { label: '', amount: null };
    const d = deductions[i] || { label: '', amount: null };
    
    if (e.label) doc.text(e.label, M + 2, y);
    if (e.amount !== null) doc.text(fmtINR(e.amount), M + colW + 2, y);
    
    if (d.label) doc.text(d.label, M + colW * 2 + 2, y);
    if (d.amount !== null) {
      doc.setTextColor(180, 0, 0);
      doc.text('- ' + fmtINR(d.amount), M + colW * 3 + 2, y);
      doc.setTextColor(60, 60, 60);
    }
    y += 5.5;
  }

  // Totals
  y += 2; doc.setDrawColor(180).line(M, y, W - M, y); y += 5;
  doc.setFont(undefined, 'bold').setTextColor(20, 20, 20);
  doc.text('Gross Earnings', M + 2, y);
  doc.text(fmtINR(payslip.grossSalary), M + colW + 2, y);
  doc.text('Total Deductions', M + colW * 2 + 2, y);
  doc.text(fmtINR(payslip.totalDeductions), M + colW * 3 + 2, y);
  y += 10;

  // ── NET PAYABLE BOX ──
  doc.setFillColor(0, 137, 123).rect(M, y, W - M * 2, 14, 'F');
  doc.setTextColor(255, 255, 255).setFontSize(10).setFont(undefined, 'bold');
  doc.text('NET PAYABLE SALARY', M + 3, y + 6);
  doc.setFontSize(12);
  doc.text(fmtINR(payslip.netSalary), W - M - 40, y + 6);
  
  doc.setFontSize(8).setFont(undefined, 'normal');
  const netVal = Math.round(Number(payslip.netSalary) || 0);
  let words = '';
  try { words = numWords(netVal); } catch (e) { words = ''; }
  doc.text('Amount in words: ' + words.toUpperCase() + ' ONLY', M + 3, y + 11);
  y += 16;

  // ── FOOTER ──
  doc.setTextColor(130, 130, 130).setFontSize(8);
  doc.text('This is a system-generated payslip. No signature required. Version: ' + (payslip.version || 1), M, y + 6);
  doc.text('Generated on: ' + new Date().toLocaleString(), M, y + 10);

  // ── SAVE & RETURN ──
  const dir = path.join(process.cwd(), 'artifacts', 'payslips');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const filename = `payslip_${emp?.lastName || 'emp'}_${payslip.year}_${payslip.month}.pdf`;
  const filePath = path.join(dir, filename);
  
  const buffer = Buffer.from(doc.output('arraybuffer'));
  fs.writeFileSync(filePath, buffer);
  
  return { filePath, filename };
}

module.exports = { generatePayslipPDF };
