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

  const [month, setMonth] = useState(() => new Date().toISOString().substring(0, 10));
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

  const fmt = n => '₹' + Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2 });
  const fmtMonth = m => new Date(m + '-01').toLocaleString('default', { month: 'short', year: 'numeric' });

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

  const formatINR = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val || 0);

  return (
    <div className="px-8 py-8 animate-fade-in space-y-6 relative">

      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-gray-800 text-white px-4 py-3 rounded shadow-lg max-w-sm animate-fade-in">
          {toastMessage}
        </div>
      )}

      {/* ACTION BUTTONS ROW */}
      <div className="flex gap-4">
        <button
          onClick={() => setShowConfirm(true)}
          disabled={summary?.status === 'LOCKED' || isProcessing}
          className="px-6 py-2 bg-[#D63384] text-white rounded-md font-medium hover:opacity-90 transition disabled:opacity-50 flex items-center gap-2"
        >
          {isProcessing && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
          Payrun
        </button>
        <button
          onClick={() => setShowValidateConfirm(true)}
          disabled={!summary || summary.status !== 'PROCESSED' || isValidating}
          className="px-6 py-2 bg-[#198754] text-white rounded-md font-medium hover:opacity-90 transition disabled:opacity-50 flex items-center gap-2"
        >
          {isValidating && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
          Validate
        </button>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-gray-900">Process Payroll</h1>
        <p className="mt-1 text-sm text-gray-500">Select a month to preview and process payroll</p>
      </div>

      {/* Controls */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <Input 
            type="date" 
            value={month} 
            onChange={e => setMonth(e.target.value)}
            className="w-full sm:w-auto"
            disabled={isProcessing}
          />
          <button
            onClick={handlePreview}
            disabled={isProcessing || loadingPreview}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium transition disabled:opacity-50"
          >
            {loadingPreview ? 'Loading...' : 'Preview Payroll'}
          </button>
        </div>
      </Card>

      {/* PAYRUN SUMMARY ROW */}
      {summary && (
        <div className="space-y-4">
          <Card
            className="p-4 cursor-pointer hover:bg-gray-50 transition border-l-4 border-brand-600"
            onClick={() => setShowSummaryTable(!showSummaryTable)}
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <span className="font-bold text-gray-900">Payrun {fmtMonth(month)}</span>
                <span className="text-gray-500">|</span>
                <span className="text-gray-700 font-medium">{fmt(summary.employerCost)} <span className="text-gray-400 font-normal">Employer Cost</span></span>
                <span className="text-gray-500">|</span>
                <span className="text-gray-700 font-medium">{fmt(summary.gross)} <span className="text-gray-400 font-normal">Gross</span></span>
                <span className="text-gray-500">|</span>
                <span className="text-gray-700 font-medium">{fmt(summary.net)} <span className="text-gray-400 font-normal">Net</span></span>
              </div>
              <div className="flex items-center gap-3">
                {summary.status === 'PROCESSED' ? (
                  <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-bold rounded-full">Done</span>
                ) : summary.status === 'LOCKED' ? (
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-bold rounded-full">Validated</span>
                ) : null}
                <span className="text-gray-400">{showSummaryTable ? '▲' : '▼'}</span>
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
                        className="hover:bg-gray-50 cursor-pointer transition"
                      >
                        <td className="px-6 py-4 text-sm text-gray-500">[{fmtMonth(month)}]</td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">[{p.employeeName}]</td>
                        <td className="px-6 py-4 text-sm text-gray-500">{fmt(p.employerCost)}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">{fmt(p.basicWage)}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">{fmt(p.grossWage)}</td>
                        <td className={`px-6 py-4 text-sm font-bold ${p.cappedAtZero ? 'text-red-600' : 'text-gray-900'}`}>
                          {fmt(p.netWage)}
                        </td>
                        <td className="px-6 py-4">
                          {p.status === 'PROCESSED' ? (
                            <span className="px-2 py-0.5 text-xs font-bold bg-green-100 text-green-800 rounded-full">Done</span>
                          ) : (
                            <span className="px-2 py-0.5 text-xs font-bold bg-blue-100 text-blue-800 rounded-full">Validated</span>
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
              <button onClick={() => setShowConfirm(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md">Cancel</button>
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
          <h3 className="font-medium text-gray-900 mb-6">Processing Status</h3>
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
                  <span className={`text-xs font-medium ${active ? 'text-gray-900' : 'text-gray-400'}`}>{step}</span>
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
              <thead className="bg-gray-50">
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
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{row.employeeName}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{formatINR(row.basicSalary)}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{row.workingDays}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{row.presentDays}</td>
                      <td className="px-6 py-4 text-sm text-red-500 font-medium">{row.lopDays}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{formatINR(row.grossSalary)}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{formatINR(row.totalDeductions)}</td>
                      <td className="px-6 py-4 text-sm font-bold text-gray-900">
                        {row.cappedAtZero ? (
                          <span className="inline-flex items-center gap-1 text-amber-600 bg-amber-50 px-2 py-0.5 rounded text-xs">Capped at ₹0</span>
                        ) : (
                          <span className="text-green-600">{formatINR(row.netSalary)}</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">PREVIEW</span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/payroll/payslip/new?employeeId=${row.employeeId}&month=${month}`);
                          }}
                          className="text-brand-600 hover:text-brand-900 font-bold text-sm bg-brand-50 px-3 py-1 rounded border border-brand-200"
                        >
                          View Detail
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
