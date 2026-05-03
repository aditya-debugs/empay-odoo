import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../features/auth/AuthContext';
import { ChevronDown, X } from 'lucide-react';
import api from '../../../services/api';

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];

export default function ProcessPayroll() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const now = new Date();
  const [month, setMonth] = useState(String(now.getMonth() + 1).padStart(2, '0'));
  const [year, setYear]   = useState(String(now.getFullYear()));
  const [showPeriodPicker, setShowPeriodPicker] = useState(false);

  const [preview, setPreview]               = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [previewError, setPreviewError]     = useState(null);

  const [processing, setProcessing]         = useState(false);
  const [processError, setProcessError]     = useState(null);

  const [validating, setValidating]         = useState(false);

  const [showConfirm, setShowConfirm]       = useState(null); // null | 'all' | rowIndex
  const [toast, setToast]                   = useState(null);

  // Keep latest month/year in a ref so the fetch function never goes stale
  const monthRef = useRef(month);
  const yearRef  = useRef(year);
  useEffect(() => { monthRef.current = month; }, [month]);
  useEffect(() => { yearRef.current  = year;  }, [year]);

  const periodLabel = `${MONTHS[parseInt(month, 10) - 1]} ${year}`;
  const fmt = (n) => '₹' + Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });

  useEffect(() => {
    if (user?.role === 'EMPLOYEE') navigate('/employee/payslips', { replace: true });
    else if (user?.role === 'HR_OFFICER') navigate('/dashboard', { replace: true });
  }, [user, navigate]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(t);
  }, [toast]);

  // Stable fetch — reads current month/year from refs so it never causes re-render loops
  const handlePreview = async (m = monthRef.current, y = yearRef.current) => {
    setLoadingPreview(true);
    setPreviewError(null);
    setPreview(null);
    try {
      const res = await api.get(`/payroll/preview?month=${m}&year=${y}`);
      setPreview(res);
    } catch (e) {
      setPreviewError(e.message || 'Failed to load preview');
    } finally {
      setLoadingPreview(false);
    }
  };

  // Only re-fetch when month or year actually changes
  useEffect(() => { handlePreview(month, year); }, [month, year]); // eslint-disable-line

  // Run payrun for all employees
  const handleRunAll = async () => {
    setShowConfirm(null);
    setProcessing(true);
    setProcessError(null);
    const m = monthRef.current, y = yearRef.current;
    try {
      const res = await api.post('/payroll/process', { month: Number(m), year: Number(y) });
      setToast(`✓ Payrun complete — ${res.payslipCount} payslips generated for ${periodLabel}`);
      handlePreview(m, y);
    } catch (e) {
      setProcessError(e.message || 'Payrun failed');
      setToast(`✗ Payrun failed: ${e.message}`);
    } finally {
      setProcessing(false);
    }
  };

  // Run payrun for a single employee row
  const handleRunSingle = async (row) => {
    setShowConfirm(null);
    setProcessing(true);
    const m = monthRef.current, y = yearRef.current;
    try {
      const monthStr = `${y}-${m}`;
      await api.post('/payroll/process-individual', { employeeId: row.employeeId, month: monthStr });
      setToast(`✓ Payslip generated for ${row.employee.firstName} ${row.employee.lastName}`);
      handlePreview(m, y);
    } catch (e) {
      setToast(`✗ Failed for ${row.employee?.firstName}: ${e.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const handleValidate = async () => {
    setValidating(true);
    const m = monthRef.current, y = yearRef.current;
    try {
      await api.post('/validate', { month: `${y}-${m}` });
      setToast(`✓ Payrun validated & locked for ${periodLabel}`);
      handlePreview(m, y);
    } catch (e) {
      setToast(`✗ Validation failed: ${e.message}`);
    } finally {
      setValidating(false);
    }
  };

  const rows = preview?.rows || [];
  const totals = preview?.totals || {};
  const employerCost = Number(totals.gross || 0) * 1.13; // employer cost ≈ gross + PF employer share

  const statusBadge = (status) => {
    const map = {
      PREVIEW:   'bg-teal-50 text-teal-700 border-teal-200',
      DRAFT:     'bg-gray-100 text-gray-500 border-gray-200',
      COMPUTED:  'bg-blue-50 text-blue-700 border-blue-200',
      GENERATED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      LOCKED:    'bg-purple-50 text-purple-700 border-purple-200',
      ERROR:     'bg-red-50 text-red-600 border-red-200',
    };
    return map[status] || 'bg-gray-100 text-gray-500 border-gray-200';
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA]">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-semibold flex items-center gap-2 ${
          toast.startsWith('✓') ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {toast}
        </div>
      )}

      {/* ── Summary bar ───────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-100 px-8 py-4 flex flex-wrap items-center gap-6">
        {/* Pay period */}
        <div className="min-w-[120px]">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-0.5">Pay Period</p>
          <button
            onClick={() => setShowPeriodPicker(v => !v)}
            className="flex items-center gap-1.5 text-lg font-bold text-gray-900 hover:text-brand-600 transition"
          >
            {periodLabel}
            <ChevronDown className="h-4 w-4 text-gray-400" />
          </button>
          {/* Period picker dropdown */}
          {showPeriodPicker && (
            <div className="absolute z-30 mt-2 bg-white border border-gray-200 rounded-2xl shadow-xl p-4 flex gap-4">
              <div>
                <p className="text-[10px] font-bold text-gray-400 mb-2 uppercase">Month</p>
                <div className="grid grid-cols-3 gap-1">
                  {MONTHS.map((m, i) => {
                    const val = String(i + 1).padStart(2, '0');
                    return (
                      <button
                        key={val}
                        onClick={() => { setMonth(val); setShowPeriodPicker(false); }}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition ${month === val ? 'bg-[#0D3B2E] text-white' : 'hover:bg-gray-100 text-gray-700'}`}
                      >
                        {m.slice(0, 3)}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 mb-2 uppercase">Year</p>
                <div className="flex flex-col gap-1">
                  {[2024, 2025, 2026, 2027].map(y => (
                    <button
                      key={y}
                      onClick={() => { setYear(String(y)); setShowPeriodPicker(false); }}
                      className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition ${year === String(y) ? 'bg-[#0D3B2E] text-white' : 'hover:bg-gray-100 text-gray-700'}`}
                    >
                      {y}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="h-8 w-px bg-gray-100" />

        {/* Stats */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-0.5">Employer Cost</p>
          <p className="text-lg font-bold text-gray-800">{fmt(employerCost)}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-0.5">Gross Total</p>
          <p className="text-lg font-bold text-gray-800">{fmt(totals.gross)}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-0.5">Net Payout</p>
          <p className="text-lg font-bold text-emerald-600">{fmt(totals.net)}</p>
        </div>

        <div className="ml-auto flex items-center gap-3">
          {/* Validate */}
          <button
            onClick={handleValidate}
            disabled={validating || processing || loadingPreview || !rows.length}
            className="px-5 py-2 border-2 border-[#0D3B2E] text-[#0D3B2E] rounded-full text-sm font-bold hover:bg-[#0D3B2E] hover:text-white transition disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {validating && <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />}
            Validate Payrun
          </button>

          {/* Run all */}
          <button
            onClick={() => setShowConfirm('all')}
            disabled={processing || loadingPreview}
            className="px-5 py-2 bg-[#D63384] text-white rounded-full text-sm font-bold hover:opacity-90 transition shadow disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {processing && <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            Run Payrun
          </button>

          {/* Done / close */}
          <button
            onClick={() => navigate('/payroll/payslips')}
            className="px-5 py-2 bg-gray-900 text-white rounded-full text-sm font-bold hover:bg-black transition"
          >
            DONE
          </button>
        </div>
      </div>

      {/* ── Page title ────────────────────────────────────────────────── */}
      <div className="px-8 pt-6 pb-2">
        <h1 className="text-2xl font-bold text-gray-900">PAYROLL PREVIEW</h1>
        {!loadingPreview && preview && (
          <p className="text-sm text-gray-400 mt-0.5">
            {rows.length} employee{rows.length !== 1 ? 's' : ''} · {preview.workingDays} working days · {periodLabel}
          </p>
        )}
      </div>

      {/* ── Errors ────────────────────────────────────────────────────── */}
      {previewError && (
        <div className="mx-8 mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm font-medium">
          {previewError}
        </div>
      )}
      {processError && (
        <div className="mx-8 mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm font-medium">
          {processError}
        </div>
      )}

      {/* ── Table ─────────────────────────────────────────────────────── */}
      <div className="px-8 pb-10">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {loadingPreview ? (
            <div className="py-20 text-center text-gray-400 font-medium animate-pulse">
              Loading preview for {periodLabel}…
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-gray-400 whitespace-nowrap">Employee Name</th>
                    <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-gray-400 whitespace-nowrap">Basic Salary</th>
                    <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-gray-400 whitespace-nowrap">Working Days</th>
                    <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-gray-400 whitespace-nowrap">Present</th>
                    <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-gray-400 whitespace-nowrap">LOP Days</th>
                    <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-gray-400 whitespace-nowrap">Gross</th>
                    <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-gray-400 whitespace-nowrap">Deductions</th>
                    <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-gray-400 whitespace-nowrap">Net Salary</th>
                    <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-gray-400 whitespace-nowrap">Status</th>
                    <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-gray-400 whitespace-nowrap">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-16 text-center text-gray-400 font-medium">
                        No active employees found for {periodLabel}.
                      </td>
                    </tr>
                  ) : rows.map((row, i) => (
                    <tr key={i} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-semibold text-gray-900">{row.employee?.firstName} {row.employee?.lastName}</div>
                        <div className="text-[11px] text-gray-400 mt-0.5">{row.employee?.department || '—'}</div>
                      </td>
                      <td className="px-5 py-4 font-medium text-gray-700">{fmt(row.basicSalary)}</td>
                      <td className="px-5 py-4 text-gray-600">{row.workingDays}</td>
                      <td className="px-5 py-4 text-gray-600">{row.presentDays ?? row.paidDays ?? '—'}</td>
                      <td className="px-5 py-4 font-semibold text-red-500">{Number(row.lopDays || 0).toFixed(1)}</td>
                      <td className="px-5 py-4 text-gray-700">{fmt(row.grossSalary)}</td>
                      <td className="px-5 py-4 text-red-500">{fmt(row.totalDeductions)}</td>
                      <td className="px-5 py-4 font-bold text-emerald-600">{fmt(row.netSalary)}</td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${statusBadge(row.status || 'PREVIEW')}`}>
                          {row.status || 'PREVIEW'}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          {row.payslipId && (
                            <button
                              onClick={() => navigate(`/payroll/payslip/${row.payslipId}`)}
                              className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-bold text-gray-700 hover:bg-gray-100 transition whitespace-nowrap"
                            >
                              View Detail
                            </button>
                          )}
                          <button
                            onClick={() => setShowConfirm(i)}
                            disabled={processing || row.status === 'LOCKED'}
                            className="px-3 py-1.5 bg-[#0D3B2E] text-white rounded-lg text-xs font-bold hover:bg-[#0A2E24] transition disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                          >
                            Payrun
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                {rows.length > 0 && (
                  <tfoot className="border-t-2 border-gray-200 bg-gray-50 font-bold">
                    <tr>
                      <td colSpan={5} className="px-5 py-3 text-xs text-gray-400 uppercase tracking-wider text-right">Totals</td>
                      <td className="px-5 py-3 text-sm text-gray-800">{fmt(totals.gross)}</td>
                      <td className="px-5 py-3 text-sm text-red-500">{fmt(totals.deductions)}</td>
                      <td className="px-5 py-3 text-sm text-emerald-600">{fmt(totals.net)}</td>
                      <td colSpan={2} />
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── Confirm modal ─────────────────────────────────────────────── */}
      {showConfirm !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowConfirm(null)}>
          <div className="bg-white rounded-2xl p-7 max-w-sm w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">
                {showConfirm === 'all' ? 'Run Full Payrun?' : `Run Payrun for ${rows[showConfirm]?.employee?.firstName}?`}
              </h3>
              <button onClick={() => setShowConfirm(null)} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              {showConfirm === 'all'
                ? `This will generate payslips for all ${rows.length} employees for ${periodLabel}.`
                : `This will generate a payslip for ${rows[showConfirm]?.employee?.firstName} ${rows[showConfirm]?.employee?.lastName} for ${periodLabel}.`}
            </p>
            {showConfirm === 'all' && rows.length > 0 && (
              <div className="bg-gray-50 rounded-xl p-3 mb-4 space-y-1.5 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Net Payout</span><span className="font-bold text-emerald-600">{fmt(totals.net)}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Gross Total</span><span className="font-bold text-gray-800">{fmt(totals.gross)}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Deductions</span><span className="font-bold text-red-500">{fmt(totals.deductions)}</span></div>
              </div>
            )}
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowConfirm(null)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm transition">Cancel</button>
              <button
                onClick={() => showConfirm === 'all' ? handleRunAll() : handleRunSingle(rows[showConfirm])}
                className="px-5 py-2 bg-[#D63384] text-white rounded-lg text-sm font-bold hover:opacity-90 transition"
              >
                Confirm & Run
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
