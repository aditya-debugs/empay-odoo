/**
 * Generates and downloads a professional payslip PDF using the browser's
 * print-to-PDF capability via a hidden popup window.
 */
export function downloadPayslipPdf(payslip) {
  const fmt = (val) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val || 0);

  const monthName = payslip.month && payslip.year
    ? new Date(`${payslip.year}-${String(payslip.month).padStart(2, '0')}-01`).toLocaleString('default', { month: 'long', year: 'numeric' })
    : '';

  const empName = payslip.employee
    ? `${payslip.employee.firstName || ''} ${payslip.employee.lastName || ''}`.trim()
    : '';

  const earnings = Array.isArray(payslip.earnings) ? payslip.earnings : [];
  const deductions = Array.isArray(payslip.deductions) ? payslip.deductions : [];

  const earningsRows = earnings.map(e => `
    <tr>
      <td style="padding:7px 0;color:#555;font-size:13px;">${e.label}</td>
      <td style="padding:7px 0;text-align:right;font-size:13px;font-weight:600;">${fmt(e.amount)}</td>
    </tr>`).join('');

  const deductionRows = deductions.map(d => `
    <tr>
      <td style="padding:7px 0;color:#555;font-size:13px;">${d.label}</td>
      <td style="padding:7px 0;text-align:right;font-size:13px;font-weight:600;color:#c0392b;">${fmt(d.amount)}</td>
    </tr>`).join('');

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Payslip — ${empName} — ${monthName}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #fff; color: #222; padding: 40px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #0F4C3A; padding-bottom: 20px; margin-bottom: 28px; }
    .company { font-size: 22px; font-weight: 800; color: #0F4C3A; letter-spacing: -0.5px; }
    .company-sub { font-size: 12px; color: #888; margin-top: 4px; }
    .payslip-label { font-size: 12px; font-weight: 700; color: #fff; background: #0F4C3A; padding: 4px 12px; border-radius: 20px; letter-spacing: 1px; text-transform: uppercase; }
    .meta { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; background: #f5f7f6; border-radius: 10px; padding: 16px 20px; margin-bottom: 28px; }
    .meta-item label { font-size: 10px; font-weight: 700; text-transform: uppercase; color: #888; letter-spacing: 0.8px; }
    .meta-item p { font-size: 14px; font-weight: 600; color: #222; margin-top: 3px; }
    .columns { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-bottom: 28px; }
    .section-title { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #0F4C3A; border-bottom: 1px solid #e2e8e4; padding-bottom: 8px; margin-bottom: 4px; }
    table { width: 100%; border-collapse: collapse; }
    .total-row td { border-top: 1px solid #e2e8e4; padding-top: 10px; padding-bottom: 4px; font-weight: 700; font-size: 14px; }
    .net-box { background: linear-gradient(135deg, #0F4C3A, #1a6b52); color: white; border-radius: 12px; padding: 24px 28px; display: flex; justify-content: space-between; align-items: center; }
    .net-box .label { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; opacity: 0.8; }
    .net-box .amount { font-size: 32px; font-weight: 900; letter-spacing: -1px; }
    .footer { margin-top: 36px; border-top: 1px solid #e2e8e4; padding-top: 16px; display: flex; justify-content: space-between; align-items: center; font-size: 11px; color: #aaa; }
    @media print {
      body { padding: 20px; }
      @page { margin: 0.5in; size: A4; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="company">EmPay</div>
      <div class="company-sub">Official Salary Payslip</div>
    </div>
    <span class="payslip-label">Payslip</span>
  </div>

  <div class="meta">
    <div class="meta-item">
      <label>Employee Name</label>
      <p>${empName || '—'}</p>
    </div>
    <div class="meta-item">
      <label>Pay Period</label>
      <p>${monthName || '—'}</p>
    </div>
    <div class="meta-item">
      <label>Version</label>
      <p>v${payslip.version || 1} — System Generated</p>
    </div>
  </div>

  <div class="columns">
    <div>
      <div class="section-title">Earnings</div>
      <table>
        <tbody>
          ${earningsRows || `<tr><td style="padding:7px 0;color:#888;font-size:13px;">Basic Salary</td><td style="text-align:right;font-size:13px;font-weight:600;">${fmt(payslip.basicSalary)}</td></tr>`}
          <tr class="total-row">
            <td>Gross Earnings</td>
            <td style="text-align:right;">${fmt(payslip.grossSalary)}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <div>
      <div class="section-title">Deductions</div>
      <table>
        <tbody>
          ${deductionRows || '<tr><td colspan="2" style="padding:7px 0;color:#888;font-size:13px;">No deductions</td></tr>'}
          <tr class="total-row">
            <td>Total Deductions</td>
            <td style="text-align:right;color:#c0392b;">${fmt(payslip.totalDeductions)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <div class="net-box">
    <span class="label">Net Payable Salary</span>
    <span class="amount">${fmt(payslip.netSalary)}</span>
  </div>

  <div class="footer">
    <span>Generated on ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
    <span>This is a system-generated payslip and does not require a signature.</span>
  </div>

  <script>window.onload = function() { window.print(); window.onafterprint = function() { window.close(); }; }</script>
</body>
</html>`;

  const win = window.open('', '_blank', 'width=800,height=600');
  if (!win) {
    alert('Please allow popups for this site to download the PDF.');
    return;
  }
  win.document.write(html);
  win.document.close();
}
