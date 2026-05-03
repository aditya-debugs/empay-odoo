import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, Input } from '../../../features/ui';
import { useAuth } from '../../../features/auth/AuthContext';
import api from '../../../services/api';

const STEPS = [
  'Fetching Data',
  'Calculating Salaries',
  'Saving Records',
  'Generating Payslips',
  'Done'
];

export default function ProcessPayroll() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [month, setMonth] = useState(() => new Date().toISOString().substring(0, 7));
  const [summary, setSummary] = useState(null);
  const [showSummaryTable, setShowSummaryTable] = useState(false);

  const [previewData, setPreviewData] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  const [isProcessing, setIsProcessing] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [processStep, setProcessStep] = useState(-1);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showValidateConfirm, setShowValidateConfirm] = useState(false);

  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [failedEmployees, setFailedEmployees] = useState([]);
  const [processingIndividual, setProcessingIndividual] = useState(null);

  const formatINR = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(val || 0);
  };

  const fmtMonth = m => {
    if (!m) return '—';
    const [year, month] = m.split('-');
    return new Date(year, month - 1).toLocaleString('default', { month: 'long', year: 'numeric' });
  };

  // Load from URL query ?month= if present
  useEffect(() => {
    const urlMonth = new URLSearchParams(location.search).get('month');
    if (urlMonth) setMonth(urlMonth);
  }, [location]);

  // Fetch summary when month changes
  const fetchSummary = async () => {
    try {
      const res = await api.get(`/payrun-summary?month=${month}`);
      setSummary(res);
    } catch (e) {
      setSummary(null);
    }
  };

  useEffect(() => {
    if (month) {
      fetchSummary();
      handlePreview();
    }
  }, [month]);

  // Clear toast after 5s
  useEffect(() => {
    if (user?.role === 'EMPLOYEE') {
      navigate('/payroll/payslips', { replace: true });
    } else if (user?.role === 'HR_OFFICER') {
      navigate('/dashboard', { replace: true });
    }

    if (toastMessage) {
      const t = setTimeout(() => setToastMessage(null), 5000);
      return () => clearTimeout(t);
    }
  }, [toastMessage, user, navigate]);

  const handlePreview = async () => {
    setLoadingPreview(true);
    setPreviewData(null);
    setFailedEmployees([]);
    try {
      const res = await api.get(`/payroll/preview?month=${month}`);
      setPreviewData(res);
    } catch (e) {
      setToastMessage(`Preview failed: ${e.message}`);
    } finally {
      setLoadingPreview(false);
    }
  };

  const executeProcess = async () => {
    setShowConfirm(false);
    setIsProcessing(true);
    setProcessStep(0);
    setFailedEmployees([]);

    try {
      const res = await api.post('/payroll/process', { month });
      setProcessStep(4);
      setTimeout(() => {
        setIsProcessing(false);
        setProcessStep(-1);
        setToastMessage(`Payrun complete — ${res.processed?.length || 0} payslips generated`);
        fetchSummary();
        setPreviewData(null);
      }, 1000);
    } catch (e) {
      setToastMessage(`Error: ${e.message}`);
      setProcessStep(-1);
      setIsProcessing(false);
    }
  };

  const handleIndividualPayrun = async (employeeId, employeeName) => {
    setProcessingIndividual(employeeId);
    try {
      await api.post('/payroll/process-individual', { employeeId, month });
      setToastMessage(`✓ Payslip generated for ${employeeName}`);
      fetchSummary();
      // Optional: Refresh preview to show updated status if needed, 
      // but usually individual payrun removes them from 'pending' preview or updates status.
    } catch (e) {
      setToastMessage(`Error for ${employeeName}: ${e.message}`);
    } finally {
      setProcessingIndividual(null);
    }
  };

  const executeValidate = async () => {
    setShowValidateConfirm(false);
    setIsValidating(true);
    try {
      await api.post('/validate', { month });
      setToastMessage(`✓ Payroll validated and locked`);
      fetchSummary();
    } catch (e) {
      setToastMessage(`Validation failed: ${e.message}`);
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="px-8 py-8 animate-fade-in space-y-6 relative">

      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-ink text-white px-4 py-3 rounded shadow-lg max-w-sm animate-fade-in">
          {toastMessage}
        </div>
      )}

      {/* ACTION BUTTONS ROW */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Process Payroll</h1>
          <p className="mt-1 text-sm text-gray-500 font-medium italic">Manage monthly salary cycles and validation</p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => setShowConfirm(true)}
            disabled={summary?.status === 'LOCKED' || isProcessing}
            className="px-8 py-2.5 bg-[#D63384] text-white rounded-full text-sm font-bold hover:opacity-90 transition shadow-md flex items-center gap-2 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {isProcessing && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
            Run Payrun
          </button>
          <button
            onClick={() => setShowValidateConfirm(true)}
            disabled={!summary || summary.status !== 'PROCESSED' || isValidating}
            className="px-8 py-2.5 bg-[#198754] text-white rounded-full text-sm font-bold hover:opacity-90 transition shadow-md flex items-center gap-2 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {isValidating && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
            Validate Cycle
          </button>
        </div>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-ink">Process Payroll</h1>
        <p className="mt-1 text-sm text-ink-muted">Select a month to preview and process payroll</p>
      </div>

      {/* Controls */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <Input 
            type="month" 
            value={month} 
            onChange={e => setMonth(e.target.value)}
            className="w-full sm:w-auto"
            disabled={isProcessing}
          />
          <button
            onClick={handlePreview}
            disabled={isProcessing || loadingPreview}
            className="px-4 py-2 border border-border-strong rounded-md text-ink-muted hover:bg-surface-muted font-medium transition disabled:opacity-50"
          >
            {loadingPreview ? 'Loading...' : 'Preview Payroll'}
          </button>
        </div>
      </Card>

      {/* PAYRUN SUMMARY ROW */}
      {summary && (
        <div className="space-y-4">
          <Card
            className={`p-5 cursor-pointer hover:shadow-md transition-all border-l-4 ${summary.status === 'LOCKED' ? 'border-blue-500 bg-blue-50/20' : 'border-[#D63384] bg-white'}`}
            onClick={() => setShowSummaryTable(!showSummaryTable)}
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-6">
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-0.5">Pay Period</span>
                  <span className="font-bold text-gray-900 text-lg">{fmtMonth(month)}</span>
                </div>
                <div className="h-10 w-px bg-gray-100 mx-2"></div>
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-0.5">Employer Cost</span>
                  <span className="text-gray-900 font-bold">{formatINR(summary.employerCost)}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-0.5">Gross Total</span>
                  <span className="text-gray-900 font-bold">{formatINR(summary.gross)}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-0.5">Net Payout</span>
                  <span className="text-green-600 font-extrabold">{formatINR(summary.net)}</span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {summary.status === 'PROCESSED' ? (
                  <span className="px-4 py-1 bg-green-100 text-green-700 text-[10px] font-black uppercase tracking-wider rounded-full border border-green-200">Done</span>
                ) : summary.status === 'LOCKED' ? (
                  <span className="px-4 py-1 bg-blue-100 text-blue-700 text-[10px] font-black uppercase tracking-wider rounded-full border border-blue-200">Validated</span>
                ) : (
                  <span className="px-4 py-1 bg-amber-100 text-amber-700 text-[10px] font-black uppercase tracking-wider rounded-full border border-amber-200">Draft</span>
                )}
                <span className={`text-gray-400 transition-transform ${showSummaryTable ? 'rotate-180' : ''}`}>▼</span>
              </div>
            </div>
          </Card>

          {showSummaryTable && (
            <Card className="overflow-hidden animate-fade-in border-t-0 rounded-t-none">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-left">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Pay Period</th>
                      <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Employee</th>
                      <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Employer Cost</th>
                      <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Basic Wage</th>
                      <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Gross Wage</th>
                      <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Net Wage</th>
                      <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {summary.payslips.map((p, i) => (
                      <tr
                        key={i}
                        onClick={() => {
                          if (p.payslipId) {
                            navigate(`/payroll/payslip/${p.payslipId}`);
                          } else {
                            navigate(`/payroll/payslip/new?employeeId=${p.employeeId}&month=${month}`);
                          }
                        }}
                        className="hover:bg-gray-50/80 cursor-pointer transition-colors border-b border-gray-50 last:border-0"
                      >
                        <td className="px-6 py-4 text-xs font-bold text-gray-400">[{month}]</td>
                        <td className="px-6 py-4 text-sm font-bold text-gray-900">{p.employeeName}</td>
                        <td className="px-6 py-4 text-sm text-gray-600 font-medium">{formatINR(p.employerCost)}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">{formatINR(p.basicWage)}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">{formatINR(p.grossWage)}</td>
                        <td className={`px-6 py-4 text-sm font-black ${p.cappedAtZero ? 'text-amber-600' : 'text-green-600'}`}>
                          {formatINR(p.netWage)}
                        </td>
                        <td className="px-6 py-4">
                          {p.status === 'PROCESSED' ? (
                            <span className="px-2.5 py-0.5 text-[10px] font-black bg-green-50 text-green-600 rounded-full border border-green-100">DONE</span>
                          ) : (
                            <span className="px-2.5 py-0.5 text-[10px] font-black bg-blue-50 text-blue-600 rounded-full border border-blue-100">VALIDATED</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Confirmation Dialogs */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-fade-in">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Confirm Process</h3>
            <p className="text-gray-600 mb-6">Run payroll for {fmtMonth(month)}? All payslips will be generated.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowConfirm(false)} className="px-4 py-2 text-ink-muted hover:bg-surface-muted rounded-md">Cancel</button>
              <button onClick={executeProcess} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">Confirm</button>
            </div>
          </div>
        </div>
      )}

      {showValidateConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-fade-in">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Confirm Validation</h3>
            <p className="text-gray-600 mb-6">Validate and lock payroll for {fmtMonth(month)}? Cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowValidateConfirm(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md">Cancel</button>
              <button onClick={executeValidate} className="px-4 py-2 bg-[#198754] text-white rounded-md hover:bg-[#198754]/90">Confirm</button>
            </div>
          </div>
        </div>
      )}

      {/* Progress Stepper */}
      {isProcessing && (
        <Card className="p-6 animate-fade-in">
          <h3 className="font-medium text-ink mb-6">Processing Status</h3>
          <div className="relative flex justify-between items-center">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-200 -z-10"></div>
            <div
              className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-brand-600 -z-10 transition-all duration-500"
              style={{ width: `${(processStep / (STEPS.length - 1)) * 100}%` }}
            ></div>

            {STEPS.map((step, idx) => {
              const active = idx <= processStep;
              const current = idx === processStep;
              return (
                <div key={idx} className="flex flex-col items-center gap-2 bg-white px-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors ${active ? 'bg-brand-600 border-brand-600 text-white' : 'bg-white border-gray-300 text-gray-400'
                    } ${current ? 'ring-4 ring-brand-100' : ''}`}>
                    {idx + 1}
                  </div>
                  <span className={`text-xs font-medium ${active ? 'text-ink' : 'text-ink-soft'}`}>{step}</span>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Preview Table */}
      {previewData && !isProcessing && (
        <Card className="overflow-hidden animate-fade-in">
          <div className="bg-gray-50 px-6 py-3 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-700">Payroll Preview</h3>
            <button
              onClick={() => setPreviewData(null)}
              className="text-gray-400 hover:text-gray-600"
            >✕</button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-left">
              <thead className="bg-surface-muted">
                <tr>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Employee Name</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Basic Salary</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Working Days</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Present</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">LOP Days</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Gross</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Deductions</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Net Salary</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {previewData.map((row, i) => {
                  if (row.status === 'ERROR') {
                    return (
                      <tr
                        key={i}
                        onClick={() => navigate(`/payroll/payslip/new?employeeId=${row.employeeId}&month=${month}`)}
                        className="bg-red-50 hover:bg-red-100 cursor-pointer transition relative z-10"
                      >
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{row.employeeName}</td>
                        <td colSpan="9" className="px-6 py-4">
                          <div className="flex items-center justify-between">
                            <span className="text-red-600 font-bold">{row.error}</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/payroll/payslip/new?employeeId=${row.employeeId}&month=${month}`);
                              }}
                              className="text-brand-600 hover:text-brand-900 font-bold text-sm bg-brand-50 px-4 py-1.5 rounded-md border border-brand-200 shadow-sm transition-all"
                            >
                              View Detail & Manage
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }
                  return (
                    <tr
                      key={i}
                      onClick={() => navigate(`/payroll/payslip/new?employeeId=${row.employeeId}&month=${month}`)}
                      className="hover:bg-gray-50 cursor-pointer transition relative z-10"
                      title="Click to view/manage individual payslip"
                    >
                      <td className="px-6 py-4 text-sm font-medium text-ink">{row.employeeName}</td>
                      <td className="px-6 py-4 text-sm text-ink-muted">{formatINR(row.basicSalary)}</td>
                      <td className="px-6 py-4 text-sm text-ink-muted">{row.workingDays}</td>
                      <td className="px-6 py-4 text-sm text-ink-muted">{row.presentDays}</td>
                      <td className="px-6 py-4 text-sm text-red-500 font-medium">{row.lopDays}</td>
                      <td className="px-6 py-4 text-sm text-ink-muted">{formatINR(row.grossSalary)}</td>
                      <td className="px-6 py-4 text-sm text-ink-muted">{formatINR(row.totalDeductions)}</td>
                      <td className="px-6 py-4 text-sm font-bold text-ink">
                        {row.cappedAtZero ? (
                          <span className="inline-flex items-center gap-1 text-amber-600 bg-amber-50 px-2 py-0.5 rounded text-xs">Capped at ₹0</span>
                        ) : (
                          <span className="text-green-600">{formatINR(row.netSalary)}</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">PREVIEW</span>
                      </td>
                      <td className="px-6 py-4 flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/payroll/payslip/new?employeeId=${row.employeeId}&month=${month}`);
                          }}
                          className="text-brand-600 hover:text-brand-900 font-bold text-sm bg-brand-50 px-3 py-1 rounded border border-brand-200"
                        >
                          View Detail
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleIndividualPayrun(row.employeeId, row.employeeName);
                          }}
                          disabled={processingIndividual === row.employeeId || isProcessing}
                          className="px-3 py-1 bg-teal-600 text-white rounded text-sm font-medium hover:bg-teal-700 transition disabled:opacity-50 flex items-center gap-1"
                        >
                          {processingIndividual === row.employeeId && <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                          Payrun
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}


    </div>
  );
}



