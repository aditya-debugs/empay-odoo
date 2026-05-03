import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Input } from '../../../features/ui';
import { useAuth } from '../../../features/auth/AuthContext';
import api from '../../../services/api';

export default function ProcessPayroll() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const now = new Date();
  const [month, setMonth] = useState(String(now.getMonth() + 1).padStart(2, '0'));
  const [year, setYear]   = useState(String(now.getFullYear()));

  const [preview, setPreview]           = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [previewError, setPreviewError] = useState(null);

  const [processing, setProcessing]     = useState(false);
  const [processResult, setProcessResult] = useState(null);
  const [processError, setProcessError] = useState(null);

  const [showConfirm, setShowConfirm]   = useState(false);
  const [toast, setToast]               = useState(null);

  const monthStr = `${year}-${month}`;

  const fmt = (n) => '₹' + Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });
  const fmtMonth = (m, y) => new Date(Number(y), Number(m) - 1).toLocaleString('default', { month: 'long', year: 'numeric' });

  useEffect(() => {
    if (user?.role === 'EMPLOYEE') navigate('/employee/payslips', { replace: true });
    else if (user?.role === 'HR_OFFICER') navigate('/dashboard', { replace: true });
  }, [user, navigate]);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const handlePreview = useCallback(async () => {
    setLoadingPreview(true);
    setPreviewError(null);
    setPreview(null);
    setProcessResult(null);
    try {
      const res = await api.get(`/payroll/preview?month=${month}&year=${year}`);
      setPreview(res);
    } catch (e) {
      setPreviewError(e.message || 'Failed to load preview');
    } finally {
      setLoadingPreview(false);
    }
  }, [month, year]);

  useEffect(() => {
    handlePreview();
  }, [month, year]);

  const handleRunPayrun = async () => {
    setShowConfirm(false);
    setProcessing(true);
    setProcessError(null);
    try {
      const res = await api.post('/payroll/process', { month: Number(month), year: Number(year) });
      setProcessResult(res);
      setToast(`✓ Payrun complete — ${res.payslipCount} payslips generated for ${fmtMonth(month, year)}`);
      handlePreview();
    } catch (e) {
      setProcessError(e.message || 'Payrun failed');
      setToast(`✗ Payrun failed: ${e.message}`);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="px-8 py-8 animate-fade-in space-y-6">

      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-lg shadow-lg text-sm font-medium animate-fade-in ${
          toast.startsWith('✓') ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Process Payroll</h1>
          <p className="mt-1 text-sm text-gray-500 italic">Manage monthly salary cycles and validation</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowConfirm(true)}
            disabled={processing || loadingPreview || !preview}
            className="px-7 py-2.5 bg-[#D63384] text-white rounded-full text-sm font-bold hover:opacity-90 transition shadow-md disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {processing && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            Run Payrun
          </button>
        </div>
      </div>

      {/* Month Selector */}
      <Card className="p-6">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">Month</label>
            <select
              value={month}
              onChange={e => setMonth(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
            >
              {Array.from({ length: 12 }, (_, i) => {
                const m = String(i + 1).padStart(2, '0');
                return <option key={m} value={m}>{new Date(2000, i).toLocaleString('default', { month: 'long' })}</option>;
              })}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">Year</label>
            <select
              value={year}
              onChange={e => setYear(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
            >
              {[2023, 2024, 2025, 2026, 2027].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <button
            onClick={handlePreview}
            disabled={loadingPreview}
            className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition font-medium disabled:opacity-50"
          >
            {loadingPreview ? 'Loading...' : 'Refresh Preview'}
          </button>
        </div>
      </Card>

      {/* Process Result Banner */}
      {processResult && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3 animate-fade-in">
          <span className="text-2xl">✓</span>
          <div>
            <p className="font-bold text-green-800">{processResult.payslipCount} payslips generated successfully</p>
            <p className="text-sm text-green-700">
              {fmtMonth(processResult.month, processResult.year)} · Version {processResult.version} ·
              Net Total: {fmt(processResult.totals?.net)}
            </p>
          </div>
        </div>
      )}

      {/* Errors */}
      {previewError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
          Preview failed: {previewError}
        </div>
      )}
      {processError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
          Payrun failed: {processError}
        </div>
      )}

      {/* Preview Table */}
      {loadingPreview && (
        <Card className="p-8 text-center animate-pulse text-gray-400">Loading preview for {fmtMonth(month, year)}...</Card>
      )}

      {preview && !loadingPreview && (
        <Card className="overflow-hidden animate-fade-in">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-700">
                Payroll Preview — {fmtMonth(month, year)}
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">{preview.rows?.length || 0} employees · Working days: {preview.workingDays}</p>
            </div>
            <div className="flex gap-6 text-sm">
              <div className="text-right">
                <span className="block text-[10px] text-gray-400 uppercase font-bold">Gross Total</span>
                <span className="font-bold text-gray-800">{fmt(preview.totals?.gross)}</span>
              </div>
              <div className="text-right">
                <span className="block text-[10px] text-gray-400 uppercase font-bold">Net Payout</span>
                <span className="font-bold text-green-600">{fmt(preview.totals?.net)}</span>
              </div>
              <div className="text-right">
                <span className="block text-[10px] text-gray-400 uppercase font-bold">Deductions</span>
                <span className="font-bold text-red-500">{fmt(preview.totals?.deductions)}</span>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100 text-left">
              <thead className="bg-surface-muted">
                <tr>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Employee</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Department</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Basic</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Working Days</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Paid Days</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">LOP</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Gross</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Deductions</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Net</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-50">
                {(preview.rows || []).map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-sm text-gray-900">{row.employee.firstName} {row.employee.lastName}</div>
                      <div className="text-xs text-gray-400">{row.employee.position || '—'}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{row.employee.department || '—'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{fmt(row.basicSalary)}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{row.workingDays}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{row.paidDays}</td>
                    <td className="px-6 py-4 text-sm text-red-500 font-medium">{row.lopDays}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{fmt(row.grossSalary)}</td>
                    <td className="px-6 py-4 text-sm text-red-500">{fmt(row.totalDeductions)}</td>
                    <td className="px-6 py-4 text-sm font-bold text-green-600">{fmt(row.netSalary)}</td>
                  </tr>
                ))}
                {(!preview.rows || preview.rows.length === 0) && (
                  <tr><td colSpan="9" className="p-8 text-center text-gray-400">No active employees found.</td></tr>
                )}
              </tbody>
              {preview.rows?.length > 0 && (
                <tfoot className="bg-gray-50 border-t-2 border-gray-200 font-bold">
                  <tr>
                    <td colSpan="6" className="px-6 py-3 text-sm text-gray-500 uppercase tracking-wider text-right">Totals</td>
                    <td className="px-6 py-3 text-sm text-gray-800">{fmt(preview.totals?.gross)}</td>
                    <td className="px-6 py-3 text-sm text-red-500">{fmt(preview.totals?.deductions)}</td>
                    <td className="px-6 py-3 text-sm text-green-600">{fmt(preview.totals?.net)}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </Card>
      )}

      {/* Confirm Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-fade-in">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Confirm Run Payrun</h3>
            <p className="text-gray-600 mb-2 text-sm">
              This will generate payslips for <strong>{preview?.rows?.length || 0} employees</strong> for <strong>{fmtMonth(month, year)}</strong>.
            </p>
            {preview?.rows?.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-3 mb-4 text-sm space-y-1">
                <div className="flex justify-between"><span className="text-gray-500">Net Payout</span><span className="font-bold text-green-600">{fmt(preview.totals?.net)}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Total Deductions</span><span className="font-bold text-red-500">{fmt(preview.totals?.deductions)}</span></div>
              </div>
            )}
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowConfirm(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm transition">Cancel</button>
              <button onClick={handleRunPayrun} className="px-5 py-2 bg-[#D63384] text-white rounded-lg text-sm font-bold hover:opacity-90 transition">Confirm & Run</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
