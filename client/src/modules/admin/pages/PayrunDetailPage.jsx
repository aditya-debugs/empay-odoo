import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Eye } from 'lucide-react';
import { Card, Avatar, Button } from '../../../features/ui';
import { payrollService } from '../../../services/payrollService';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const formatINR = (n) => '₹' + Number(n || 0).toLocaleString('en-IN');

export default function PayrunDetailPage() {
  const { year, month } = useParams();
  const [params] = useSearchParams();
  const version = params.get('version');
  const navigate = useNavigate();

  const [run, setRun] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    payrollService.getRun(year, month, version)
      .then((r) => setRun(r))
      .catch((e) => setError(e.message || 'Failed to load payrun'))
      .finally(() => setLoading(false));
  }, [year, month, version]);

  return (
    <div className="px-8 py-8">
      <button onClick={() => navigate('/admin/payroll')} className="inline-flex items-center gap-2 text-sm text-ink-muted hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> Back to Payroll
      </button>

      <div className="mt-3">
        <h1 className="text-2xl font-semibold tracking-tight">
          {MONTH_NAMES[Number(month) - 1]} {year}
          {run?.version && <span className="ml-3 text-sm font-normal text-ink-muted">v{run.version}</span>}
        </h1>
        <p className="mt-1 text-sm text-ink-muted">Processed payslips for this run.</p>
      </div>

      {error && <div className="mt-4 rounded-xl bg-danger-50 px-3 py-2 text-sm text-danger-700">{error}</div>}

      <Card className="mt-6 overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-muted/60 text-left text-xs uppercase tracking-wider text-ink-soft">
                <th className="px-5 py-3 font-medium">Employee</th>
                <th className="px-5 py-3 font-medium">Paid Days</th>
                <th className="px-5 py-3 font-medium">Gross</th>
                <th className="px-5 py-3 font-medium">Deductions</th>
                <th className="px-5 py-3 font-medium">Net</th>
                <th className="px-5 py-3 font-medium text-right">Payslip</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={6} className="px-5 py-12 text-center text-ink-muted">Loading…</td></tr>}
              {!loading && run && run.payslips.length === 0 && (
                <tr><td colSpan={6} className="px-5 py-12 text-center text-sm text-ink-muted">No payslips for this run.</td></tr>
              )}
              {!loading && run && run.payslips.map((p) => (
                <tr key={p.id} className="border-b border-border last:border-0 hover:bg-surface-muted/40">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={`${p.employee.firstName} ${p.employee.lastName}`} size="sm" />
                      <div className="min-w-0">
                        <div className="font-medium text-ink truncate">{p.employee.firstName} {p.employee.lastName}</div>
                        <div className="text-xs text-ink-muted truncate">{p.employee.position || '—'} · {p.employee.department || '—'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-ink">{Number(p.paidDays || 0)} / {p.workingDays || '—'}</td>
                  <td className="px-5 py-3 text-ink">{formatINR(p.grossSalary)}</td>
                  <td className="px-5 py-3 text-ink-muted">−{formatINR(p.totalDeductions)}</td>
                  <td className="px-5 py-3 font-semibold text-ink">{formatINR(p.netSalary)}</td>
                  <td className="px-5 py-3 text-right">
                    <Button variant="outline" size="sm" leftIcon={<Eye className="h-3.5 w-3.5" />} onClick={() => navigate(`/admin/payroll/payslip/${p.id}`)}>
                      View
                    </Button>
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
