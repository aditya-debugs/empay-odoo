import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer } from 'lucide-react';
import { Card, Button } from '../../../features/ui';
import api from '../../../services/api';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const formatINR = (n) => '₹' + Number(n || 0).toLocaleString('en-IN');

export default function PayslipViewerPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [payslip, setPayslip] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      api.get(`/payslips/${id}`),
      api.get('/settings').catch(() => ({}))
    ])
      .then(([payslipRes, settingsRes]) => {
        setPayslip(payslipRes?.payslip || payslipRes);
        setSettings(settingsRes?.settings || settingsRes || {});
      })
      .catch((e) => setError(e.message || 'Failed to load payslip'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="flex h-full items-center justify-center text-ink-muted">Loading payslip…</div>;
  if (error || !payslip) {
    return (
      <div className="px-8 py-8">
        <Button variant="outline" onClick={() => navigate(-1)}>Back</Button>
        <div className="mt-4 rounded-xl bg-danger-50 px-3 py-2 text-sm text-danger-700">{error || 'Payslip not found.'}</div>
      </div>
    );
  }

  const e = payslip.employee;
  const u = e.user;
  const periodLabel = `${MONTH_NAMES[payslip.month - 1]} ${payslip.year}`;
  const accountMask = e.bankAccountNo ? `XXXX${e.bankAccountNo.slice(-4)}` : '—';

  return (
    <div className="px-8 py-8 print:p-0">
      {/* Toolbar — hidden in print */}
      <div className="flex items-center justify-between print:hidden">
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-sm text-ink-muted hover:text-ink">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <Button leftIcon={<Printer className="h-4 w-4" />} onClick={() => window.print()}>Print / Save as PDF</Button>
      </div>

      {/* Payslip body */}
      <Card className="mx-auto mt-6 max-w-4xl p-10 print:mt-0 print:max-w-none print:rounded-none print:border-0 print:shadow-none">
        {/* Header */}
        <div className="flex items-start justify-between border-b-2 border-brand-500 pb-5">
          <div>
            <h1 className="text-2xl font-bold text-brand-700">{settings?.companyName || 'EmPay'}</h1>
            {settings?.companyAddress && <p className="mt-1 text-sm text-ink-muted">{settings.companyAddress}</p>}
            {settings?.cin && <p className="text-xs text-ink-soft">CIN: {settings.cin}</p>}
          </div>
          <div className="text-right">
            <h2 className="text-lg font-semibold text-ink">PAYSLIP</h2>
            <p className="mt-1 text-sm text-ink-muted">For the month of</p>
            <p className="text-base font-semibold text-ink">{periodLabel}</p>
            <p className="mt-1 text-xs text-ink-soft">v{payslip.version}</p>
          </div>
        </div>

        {/* Employee details */}
        <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
          <Detail label="Employee Name"   value={`${e.firstName} ${e.lastName}`} />
          <Detail label="Employee ID"     value={u?.loginId || e.id.slice(0, 8)} />
          <Detail label="Designation"     value={e.position} />
          <Detail label="Department"      value={e.department} />
          <Detail label="PAN"             value={e.pan} />
          <Detail label="Bank A/C"        value={accountMask} />
          <Detail label="Date of Joining" value={e.joinDate ? new Date(e.joinDate).toLocaleDateString() : '—'} />
          <Detail label="Pay Date"        value={`${settings?.payDay || 28} ${MONTH_NAMES[payslip.month % 12]} ${payslip.month === 12 ? payslip.year + 1 : payslip.year}`} />
        </div>

        {/* Working days summary */}
        <div className="mt-6 grid grid-cols-3 gap-3 rounded-xl bg-surface-muted p-4 text-sm">
          <DayMetric label="Working Days" value={payslip.workingDays || '—'} />
          <DayMetric label="Paid Days"    value={Number(payslip.paidDays || 0)} />
          <DayMetric label="LOP Days"     value={Number(payslip.lopDays || 0)} />
        </div>

        {/* Earnings + Deductions */}
        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
          <Section title="Earnings">
            <BreakdownTable rows={payslip.earnings || []} />
            <Subtotal label="Gross Salary" value={payslip.grossSalary} />
          </Section>
          <Section title="Deductions">
            <BreakdownTable rows={payslip.deductions || []} />
            <Subtotal label="Total Deductions" value={payslip.totalDeductions} tone="danger" />
          </Section>
        </div>

        {/* Net */}
        <div className="mt-6 flex items-center justify-between rounded-xl bg-brand-500 px-5 py-4 text-white">
          <span className="text-base font-medium">Net Salary</span>
          <span className="text-2xl font-bold">{formatINR(payslip.netSalary)}</span>
        </div>

        {/* Footer */}
        <div className="mt-8 grid grid-cols-2 gap-6 border-t border-border pt-5 text-xs text-ink-muted">
          <div>
            <p>This is a computer-generated payslip and does not require a signature.</p>
            <p className="mt-1">Generated on {new Date(payslip.createdAt).toLocaleString()}</p>
          </div>
          <div className="text-right">
            <p className="mt-8 border-t border-border pt-2">Authorised Signatory</p>
          </div>
        </div>
      </Card>
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-ink-soft">{label}</div>
      <div className="mt-0.5 text-sm font-medium text-ink">{value || '—'}</div>
    </div>
  );
}

function DayMetric({ label, value }) {
  return (
    <div className="text-center">
      <div className="text-xs text-ink-muted">{label}</div>
      <div className="mt-1 text-lg font-semibold text-ink">{value}</div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <h3 className="text-sm font-semibold uppercase tracking-wider text-ink-soft">{title}</h3>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function BreakdownTable({ rows }) {
  if (!rows.length) {
    return <p className="text-xs text-ink-soft">None</p>;
  }
  return (
    <table className="w-full text-sm">
      <tbody>
        {rows.map((r, i) => (
          <tr key={i} className="border-b border-border last:border-0">
            <td className="py-2 text-ink-muted">{r.label}</td>
            <td className="py-2 text-right font-medium text-ink">{formatINR(r.amount)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Subtotal({ label, value, tone }) {
  return (
    <div className={`mt-2 flex justify-between border-t-2 border-border pt-2 text-sm font-semibold ${tone === 'danger' ? 'text-danger-700' : 'text-ink'}`}>
      <span>{label}</span>
      <span>{formatINR(value)}</span>
    </div>
  );
}



