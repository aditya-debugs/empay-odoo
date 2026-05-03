import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Play, FileText, ShieldCheck } from 'lucide-react';
import { Card, Button, Avatar } from '../../../features/ui';
import api from '../../../services/api';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const formatINR = (n) => '₹' + Number(n || 0).toLocaleString('en-IN');

export default function PayrunPreviewPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const month = Number(params.get('month'));
  const year  = Number(params.get('year'));

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [adjustments, setAdjustments] = useState({});  // { [employeeId]: { paidDays, lopDays, bonus, tds, customDeduction } }
  const [confirming, setConfirming] = useState(false);
  const [processing, setProcessing] = useState(false);

  async function recompute(adj = adjustments) {
    setLoading(true);
    setError('');
    try {
      const adjArray = Object.entries(adj)
        .map(([employeeId, fields]) => ({ employeeId, ...fields }))
        .filter((a) => Object.values(a).some((v) => v != null && v !== ''));
      const result = await api.post('/payroll/preview', { month, year, adjustments: adjArray }).catch(() => ({ rows: [], totals: { gross: 0, deductions: 0, net: 0 } }));
      setData(result);
    } catch (e) {
      setError(e.message || 'Failed to compute preview');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { if (month && year) recompute({}); /* eslint-disable-line */ }, [month, year]);

  function setAdj(employeeId, field) {
    return (e) => {
      const value = e.target.value === '' ? null : Number(e.target.value);
      setAdjustments((a) => ({ ...a, [employeeId]: { ...(a[employeeId] || {}), [field]: value } }));
    };
  }

  async function processRun() {
    setProcessing(true);
    setError('');
    try {
      const adjArray = Object.entries(adjustments)
        .map(([employeeId, fields]) => ({ employeeId, ...fields }))
        .filter((a) => Object.values(a).some((v) => v != null && v !== ''));
      const res = await api.post('/payroll/process', { month, year, adjustments: adjArray });
      navigate(`/admin/payroll/${res.year}/${res.month}?version=${res.version}`, { replace: true });
    } catch (e) {
      setError(e.message || 'Failed to process payroll');
    } finally {
      setProcessing(false);
      setConfirming(false);
    }
  }

  const periodLabel = `${MONTH_NAMES[month - 1]} ${year}`;
  const isInvalid = !month || !year;

  return (
    <div className="px-8 py-8">
      <button
        type="button"
        onClick={() => navigate('/admin/payroll')}
        className="inline-flex items-center gap-2 text-sm text-ink-muted hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Payroll
      </button>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Payroll Preview</h1>
          <p className="mt-1 text-sm text-ink-muted">
            <span className="font-medium text-ink">{periodLabel}</span> — Review computed values, adjust per row, then process.
          </p>
        </div>
        <Button
          leftIcon={<Play className="h-4 w-4" />}
          onClick={() => setConfirming(true)}
          disabled={loading || processing || !data || data.rows.length === 0}
        >
          Process payroll
        </Button>
      </div>

      {isInvalid && (
        <div className="mt-4 rounded-xl bg-danger-50 px-3 py-2 text-sm text-danger-700">
          Missing month/year. Go back and pick a period.
        </div>
      )}
      {error && <div className="mt-4 rounded-xl bg-danger-50 px-3 py-2 text-sm text-danger-700">{error}</div>}

      {/* Totals */}
      {data && (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-4">
          <Tile label="Eligible employees" value={data.rows.length} />
          <Tile label="Total Gross"        value={formatINR(data.totals.gross)} />
          <Tile label="Total Deductions"   value={formatINR(data.totals.deductions)} tone="danger" />
          <Tile label="Total Net"          value={formatINR(data.totals.net)} tone="success" />
        </div>
      )}

      {/* Settings glance */}
      {data && (
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-ink-muted">
          <span>Working days: <span className="font-medium text-ink">{data.workingDays}</span></span>
          <span>·</span>
          <span>Prof. Tax state: <span className="font-medium text-ink">{data.settings.profTaxState.replace(/_/g, ' ')}</span></span>
          <span>·</span>
          <span>HRA mode: <span className="font-medium text-ink">{data.settings.isMetro ? 'Metro' : 'Non-metro'}</span></span>
        </div>
      )}

      {/* Preview table */}
      <Card className="mt-6 overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-muted/60 text-left text-xs uppercase tracking-wider text-ink-soft">
                <th className="px-4 py-3 font-medium">Employee</th>
                <th className="px-4 py-3 font-medium">Paid</th>
                <th className="px-4 py-3 font-medium">LOP</th>
                <th className="px-4 py-3 font-medium">Bonus</th>
                <th className="px-4 py-3 font-medium">TDS</th>
                <th className="px-4 py-3 font-medium">Other Ded.</th>
                <th className="px-4 py-3 font-medium">Gross</th>
                <th className="px-4 py-3 font-medium">Deductions</th>
                <th className="px-4 py-3 font-medium">Net</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={9} className="px-4 py-12 text-center text-ink-muted">Computing…</td></tr>
              )}
              {!loading && data && data.rows.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-sm text-ink-muted">
                    No eligible employees. Add employees with salary structure under <span className="font-medium text-ink">Employees → New Employee</span>.
                  </td>
                </tr>
              )}
              {!loading && data && data.rows.map((r) => {
                const adj = adjustments[r.employee.id] || {};
                return (
                  <tr key={r.employee.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={`${r.employee.firstName} ${r.employee.lastName}`} size="sm" />
                        <div className="min-w-0">
                          <div className="font-medium text-ink truncate">{r.employee.firstName} {r.employee.lastName}</div>
                          <div className="text-xs text-ink-muted truncate">{r.employee.position || '—'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3"><AdjInput value={adj.paidDays} placeholder={r.paidDays} onChange={setAdj(r.employee.id, 'paidDays')} /></td>
                    <td className="px-4 py-3"><AdjInput value={adj.lopDays}  placeholder={r.lopDays}  onChange={setAdj(r.employee.id, 'lopDays')} /></td>
                    <td className="px-4 py-3"><AdjInput value={adj.bonus}    placeholder="0"          onChange={setAdj(r.employee.id, 'bonus')} /></td>
                    <td className="px-4 py-3"><AdjInput value={adj.tds}      placeholder="0"          onChange={setAdj(r.employee.id, 'tds')} /></td>
                    <td className="px-4 py-3"><AdjInput value={adj.customDeduction} placeholder="0"   onChange={setAdj(r.employee.id, 'customDeduction')} /></td>
                    <td className="px-4 py-3 text-ink">{formatINR(r.grossSalary)}</td>
                    <td className="px-4 py-3 text-ink-muted">−{formatINR(r.totalDeductions)}</td>
                    <td className="px-4 py-3 font-semibold text-ink">{formatINR(r.netSalary)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {data && data.rows.length > 0 && (
          <div className="flex items-center justify-between gap-3 border-t border-border bg-surface-muted/40 px-4 py-3">
            <div className="text-xs text-ink-muted">
              Edit any cell to override the computed value. Click <span className="font-medium text-ink">Recompute</span> to see updated totals.
            </div>
            <Button variant="outline" size="sm" onClick={() => recompute()}>Recompute</Button>
          </div>
        )}
      </Card>

      {/* Confirm modal */}
      {confirming && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4" onClick={() => setConfirming(false)}>
          <Card className="max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-brand-700">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="mt-3 text-lg font-semibold">Process {periodLabel} payroll?</h3>
            <p className="mt-1 text-sm text-ink-muted">
              This will generate {data?.rows.length || 0} payslips with the values shown above.
              {data?.rows.length ? ` Total net to be paid: ${formatINR(data.totals.net)}.` : ''}
              {' '}Re-running for the same period creates a new version, not duplicates.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setConfirming(false)}>Cancel</Button>
              <Button leftIcon={<FileText className="h-4 w-4" />} loading={processing} onClick={processRun}>
                Confirm &amp; Process
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

function AdjInput({ value, placeholder, onChange }) {
  return (
    <input
      type="number"
      step="0.01"
      value={value ?? ''}
      placeholder={placeholder != null ? String(placeholder) : ''}
      onChange={onChange}
      className="h-9 w-20 rounded-lg border border-border bg-white px-2 text-sm text-ink placeholder:text-ink-soft focus:border-brand-500 focus:outline-none"
    />
  );
}

function Tile({ label, value, tone }) {
  const toneClass =
    tone === 'success' ? 'text-success-700' :
    tone === 'danger'  ? 'text-danger-700' :
                         'text-ink';
  return (
    <Card className="p-5">
      <div className="text-xs uppercase tracking-wider text-ink-soft">{label}</div>
      <div className={`mt-1 text-2xl font-semibold tracking-tight ${toneClass}`}>{value}</div>
    </Card>
  );
}



