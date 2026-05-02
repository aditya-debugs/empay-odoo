import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../../features/ui';
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

  const [month, setMonth] = useState(() => new Date().toISOString().substring(0, 7));
  const [previewData, setPreviewData] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [processStep, setProcessStep] = useState(-1);
  const [showConfirm, setShowConfirm] = useState(false);
  
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [failedEmployees, setFailedEmployees] = useState([]);

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
    
    // Simulate steps for UI
    for (let i = 1; i <= 3; i++) {
      await new Promise(r => setTimeout(r, 600));
      setProcessStep(i);
    }

    try {
      const res = await api.post('/payroll/process', { month });
      setProcessStep(4);
      setTimeout(() => {
        setIsProcessing(false);
        setProcessStep(-1);
        setToastMessage(`Payroll processed for ${res.processed?.length || 0} employees. ${res.failed?.length || 0} failed.`);
        if (res.failed && res.failed.length > 0) {
          setFailedEmployees(res.failed);
        } else {
          // Navigate to payslips if 100% successful
          navigate('/payroll/payslips');
        }
        setPreviewData(null);
      }, 1000);
    } catch (e) {
      setToastMessage(`Error: ${e.message}`);
      setProcessStep(-1);
      setIsProcessing(false);
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

      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-gray-900">Process Payroll</h1>
        <p className="mt-1 text-sm text-gray-500">Select a month to preview and process payroll</p>
      </div>

      {/* Controls */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <input 
            type="month" 
            value={month} 
            onChange={e => setMonth(e.target.value)}
            className="border border-gray-300 rounded-md px-4 py-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
            disabled={isProcessing}
          />
          <button 
            onClick={handlePreview}
            disabled={isProcessing || loadingPreview}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium transition disabled:opacity-50"
          >
            {loadingPreview ? 'Loading...' : 'Preview Payroll'}
          </button>
          
          <button 
            onClick={() => setShowConfirm(true)}
            disabled={!previewData || isProcessing}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium transition disabled:opacity-50 disabled:bg-green-400"
          >
            Process Payroll
          </button>
        </div>
      </Card>

      {/* Confirmation Dialog */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-fade-in">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Confirm Process</h3>
            <p className="text-gray-600 mb-6">Process payroll for {month}? This cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowConfirm(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md">Cancel</button>
              <button onClick={executeProcess} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">Confirm</button>
            </div>
          </div>
        </div>
      )}

      {/* Progress Stepper */}
      {isProcessing && (
        <Card className="p-6 animate-fade-in">
          <h3 className="font-medium text-gray-900 mb-6">Processing Status</h3>
          <div className="relative flex justify-between items-center">
            {/* Connecting line */}
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
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors ${
                    active ? 'bg-brand-600 border-brand-600 text-white' : 'bg-white border-gray-300 text-gray-400'
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

      {/* Failed Employees List */}
      {failedEmployees.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="text-red-800 font-bold mb-3">Failed Processing</h3>
          <ul className="space-y-2 text-sm text-red-700">
            {failedEmployees.map((f, i) => (
              <li key={i}>&bull; {f.employeeId}: {f.error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Preview Table */}
      {previewData && !isProcessing && (
        <Card className="overflow-hidden animate-fade-in">
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
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {previewData.map((row, i) => {
                  if (row.status === 'ERROR') {
                    return (
                      <tr key={i} className="bg-red-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{row.employeeName}</td>
                        <td colSpan="8" className="px-6 py-4 text-sm text-red-600">{row.error}</td>
                      </tr>
                    );
                  }

                  const isZero = row.netSalary <= 0;
                  return (
                    <tr 
                      key={i} 
                      onClick={() => setSelectedEmployee(row)}
                      className="hover:bg-gray-50 cursor-pointer transition"
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
                          <span className="inline-flex items-center gap-1 text-amber-600 bg-amber-50 px-2 py-0.5 rounded text-xs">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                            Capped at ₹0
                          </span>
                        ) : (
                          <span className="text-green-600">{formatINR(row.netSalary)}</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          PREVIEW
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {previewData.length === 0 && (
                  <tr>
                    <td colSpan="9" className="px-6 py-8 text-center text-gray-500">No active employees found for preview.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Breakdown Modal */}
      {selectedEmployee && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 animate-fade-in p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Salary Breakdown</h2>
                <p className="text-sm text-gray-500 mt-1">{selectedEmployee.employeeName} — {month}</p>
              </div>
              <button 
                onClick={() => setSelectedEmployee(null)} 
                className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-200 transition"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Earnings */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Earnings</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Basic Salary</span>
                      <span className="font-medium">{formatINR(selectedEmployee.basicSalary)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Overtime Bonus</span>
                      <span className="font-medium">{formatINR(selectedEmployee.overtimeBonus)}</span>
                    </div>
                    {/* Add more allowances here if provided in the payload */}
                    <div className="pt-3 border-t mt-3 flex justify-between font-bold text-gray-900">
                      <span>Gross Earnings</span>
                      <span>{formatINR(selectedEmployee.grossSalary)}</span>
                    </div>
                  </div>
                </div>

                {/* Deductions */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Deductions</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">LOP Deduction</span>
                      <span className="font-medium text-red-600">{formatINR(selectedEmployee.lopDeduction)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">PF</span>
                      <span className="font-medium text-red-600">{formatINR(selectedEmployee.pfDeduction)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">ESIC</span>
                      <span className="font-medium text-red-600">{formatINR(selectedEmployee.esicDeduction)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">TDS</span>
                      <span className="font-medium text-red-600">{formatINR(selectedEmployee.tdsDeduction)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Professional Tax</span>
                      <span className="font-medium text-red-600">{formatINR(selectedEmployee.professionalTax)}</span>
                    </div>
                    <div className="pt-3 border-t mt-3 flex justify-between font-bold text-gray-900">
                      <span>Total Deductions</span>
                      <span className="text-red-600">{formatINR(selectedEmployee.totalDeductions)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
              <span className="text-gray-600 font-medium">Net Payable Salary</span>
              <div className="flex flex-col items-end">
                {selectedEmployee.cappedAtZero && (
                  <span className="text-xs font-bold text-amber-600 mb-1 uppercase tracking-wide bg-amber-50 px-2 py-0.5 rounded">⚠ Capped at ₹0</span>
                )}
                <span className={`text-3xl font-extrabold ${selectedEmployee.cappedAtZero ? 'text-amber-600' : 'text-green-600'}`}>
                  {formatINR(selectedEmployee.netSalary)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
