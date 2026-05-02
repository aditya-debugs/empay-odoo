import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, FileText, ChevronRight } from 'lucide-react';
import { Card, Button } from '../../../features/ui';
import api from '../../../services/api';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const formatINR = (n) => '₹' + Number(n || 0).toLocaleString('en-IN');

export default function PayrollPage() {
  const navigate = useNavigate();
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth() + 1);   // 1-12
  const [year,  setYear]  = useState(today.getFullYear());

  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/payroll/runs').catch(() => ([]))
      .then((res) => setRuns(res.runs || res || []))
      .catch((e) => setError(e.message || 'Failed to load payruns'))
      .finally(() => setLoading(false));
  }, []);

  const yearOptions = useMemo(() => {
    const yr = today.getFullYear();
    return [yr - 1, yr, yr + 1];
  }, [today]);

  function gotoPreview() {
    navigate(`/admin/payroll/preview?month=${month}&year=${year}`);
  }

  const totalProcessed = runs.length;
  const lifetimeNet    = runs.reduce((s, r) => s + r.totalNet, 0);

  return (
    <div className="px-8 py-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Payroll</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Process payroll for any month. Salary structure & statutory rules come from <span className="font-medium text-ink">Settings</span>.
          </p>
        </div>
      </div>

      {/* Run-payroll card */}
      <Card className="mt-6 p-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold">Run Payroll</h2>
            <p className="mt-1 text-sm text-ink-muted">Pick a pay period and review the auto-computed preview before processing.</p>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium uppercase tracking-wider text-ink-soft">Month</label>
              <select
                value={month} onChange={(e) => setMonth(Number(e.target.value))}
                className="h-11 rounded-xl border border-border-strong bg-white px-3.5 text-sm text-ink focus:border-brand-500 focus:outline-none"
              >
                {MONTH_NAMES.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium uppercase tracking-wider text-ink-soft">Year</label>
              <select
                value={year} onChange={(e) => setYear(Number(e.target.value))}
                className="h-11 rounded-xl border border-border-strong bg-white px-3.5 text-sm text-ink focus:border-brand-500 focus:outline-none"
              >
                {yearOptions.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <Button leftIcon={<Play className="h-4 w-4" />} onClick={gotoPreview}>
              Preview &amp; Run
            </Button>
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryTile label="Payruns processed" value={loading ? '…' : totalProcessed} />
        <SummaryTile label="Lifetime net paid" value={loading ? '…' : formatINR(lifetimeNet)} />
        <SummaryTile label="Last run" value={runs[0] ? `${MONTH_NAMES[runs[0].month - 1]} ${runs[0].year}` : '—'} />
      </div>

      {/* Past runs */}
      <Card className="mt-6 overflow-hidden p-0">
        <div className="border-b border-border bg-surface-muted/60 px-5 py-3 text-sm font-semibold">Past Payruns</div>
        {error && (
          <div className="bg-danger-50 px-5 py-3 text-sm text-danger-700">{error}</div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-muted/40 text-left text-xs uppercase tracking-wider text-ink-soft">
                <th className="px-5 py-3 font-medium">Period</th>
                <th className="px-5 py-3 font-medium">Version</th>
                <th className="px-5 py-3 font-medium">Payslips</th>
                <th className="px-5 py-3 font-medium">Gross</th>
                <th className="px-5 py-3 font-medium">Deductions</th>
                <th className="px-5 py-3 font-medium">Net Paid</th>
                <th className="px-5 py-3 font-medium text-right">View</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={7} className="px-5 py-12 text-center text-ink-muted">Loading…</td></tr>
              )}
              {!loading && runs.length === 0 && !error && (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-sm text-ink-muted">
                    No payruns yet. Pick a period and click <span className="font-medium text-ink">Preview &amp; Run</span> to start.
                  </td>
                </tr>
              )}
              {runs.map((r) => (
                <tr key={`${r.year}-${r.month}-${r.version}`} className="border-b border-border last:border-0 hover:bg-surface-muted/40">
                  <td className="px-5 py-3 font-medium text-ink">{MONTH_NAMES[r.month - 1]} {r.year}</td>
                  <td className="px-5 py-3 text-ink-muted">v{r.version}</td>
                  <td className="px-5 py-3 text-ink">{r.payslipCount}</td>
                  <td className="px-5 py-3 text-ink">{formatINR(r.totalGross)}</td>
                  <td className="px-5 py-3 text-ink-muted">−{formatINR(r.totalDeductions)}</td>
                  <td className="px-5 py-3 font-semibold text-ink">{formatINR(r.totalNet)}</td>
                  <td className="px-5 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => navigate(`/admin/payroll/${r.year}/${r.month}?version=${r.version}`)}
                      className="inline-flex items-center gap-1 text-sm font-medium text-brand-500 hover:text-brand-700"
                    >
                      View <ChevronRight className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function SummaryTile({ label, value }) {
  return (
    <Card className="p-5">
      <div className="text-xs uppercase tracking-wider text-ink-soft">{label}</div>
      <div className="mt-1 text-2xl font-semibold tracking-tight text-ink">{value}</div>
    </Card>
  );
}
