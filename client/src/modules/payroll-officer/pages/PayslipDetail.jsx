import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '../../../features/ui';
import api from '../../../services/api';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Lock } from 'lucide-react';

export default function PayslipDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [payslip, setPayslip] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [activeTab, setActiveTab] = useState('worked-days');
  const [isUpdating, setIsUpdating] = useState(false);
  const [printing, setPrinting] = useState(false);

  const fetchPayslip = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/payslips/${id}`);
      // v1 controller wraps in { payslip: … }
      setPayslip(res.payslip || res);
    } catch (err) {
      setError(err.message || 'Failed to load payslip');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPayslip(); }, [id]);

  const handleValidate = async () => {
    if (!window.confirm('Validate and lock this payslip? This cannot be undone.')) return;
    setIsUpdating(true);
    try {
      await api.post(`/payslips/${id}/validate`);
      fetchPayslip();
    } catch (err) {
      alert('Validate failed: ' + (err.message || 'Unknown error'));
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('Cancel this payslip?')) return;
    setIsUpdating(true);
    try {
      await api.patch(`/payslips/${id}/cancel`);
      navigate('/payroll/payslips');
    } catch (err) {
      alert('Cancel failed: ' + (err.message || 'Unknown error'));
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDownloadPdf = () => {
    setPrinting(true);
    try { downloadPayslipPdf(payslip); }
    catch (err) { alert('PDF error: ' + err.message); }
    finally { setTimeout(() => setPrinting(false), 800); }
  };

  if (loading) return (
    <div className="px-8 py-16 text-center animate-pulse text-gray-400 font-medium">Loading payslip…</div>
  );

  if (error || !payslip) return (
    <div className="px-8 py-8 max-w-xl mx-auto">
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center space-y-3">
        <p className="text-red-700 font-semibold text-lg">Payslip not found</p>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button onClick={() => navigate(-1)} className="mt-2 px-5 py-2 border border-gray-300 rounded-full text-sm text-gray-600 hover:bg-gray-50 transition">
          ← Back
        </button>
      </div>
    </div>
  );

  const fmt = (val) => '₹ ' + (Number(val) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });
  const empName = payslip.employee
    ? `${payslip.employee.firstName || ''} ${payslip.employee.lastName || ''}`.trim()
    : (payslip.employee?.user?.name || '—');
  const monthName = new Date(payslip.year, payslip.month - 1)
    .toLocaleString('default', { month: 'long', year: 'numeric' });
  const isLocked = payslip.status === 'LOCKED' || payslip.status === 'GENERATED';
  const daysInMonth = new Date(payslip.year, payslip.month, 0).getDate();

  return (
    <div className="px-8 py-8 space-y-6 max-w-5xl mx-auto animate-fade-in">

      {/* Back + Status */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-gray-100 transition text-gray-500">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
          isLocked ? 'bg-green-100 text-green-700' :
          payslip.status === 'COMPUTED' ? 'bg-blue-100 text-blue-700' :
          payslip.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
          'bg-gray-100 text-gray-600'
        }`}>{payslip.status}</span>
        {isLocked && <span className="flex items-center gap-1 text-xs text-gray-400"><Lock className="h-3 w-3" /> Locked</span>}
      </div>

      {/* ACTION BUTTONS */}
      <div className="flex flex-wrap gap-3 print:hidden">
        {!isLocked && payslip.status !== 'CANCELLED' && (
          <button
            onClick={handleValidate}
            disabled={isUpdating || payslip.status !== 'COMPUTED'}
            className="px-6 py-2 bg-green-600 text-white rounded-full text-sm font-semibold hover:opacity-90 transition shadow-sm disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
          >
            {isUpdating ? 'Validating…' : 'Validate & Lock'}
          </button>
        )}
        {!isLocked && payslip.status !== 'CANCELLED' && (
          <button
            onClick={handleCancel}
            disabled={isUpdating}
            className="px-6 py-2 bg-red-50 text-red-600 border border-red-200 rounded-full text-sm font-semibold hover:bg-red-100 transition shadow-sm disabled:opacity-50"
          >
            Cancel
          </button>
        )}
        <button
          onClick={handleDownloadPdf}
          disabled={printing}
          className="px-6 py-2 bg-gray-800 text-white rounded-full text-sm font-semibold hover:bg-gray-700 transition shadow-sm disabled:opacity-50 flex items-center gap-2"
        >
          {printing && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
          Download PDF
        </button>
        <button onClick={() => window.print()} className="px-6 py-2 border border-gray-200 text-gray-600 rounded-full text-sm font-semibold hover:bg-gray-50 transition">
          Print
        </button>
      </div>

      {/* Locked banner */}
      {isLocked && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3 text-amber-800">
          <Lock className="h-5 w-5 text-amber-500 flex-shrink-0" />
          <p className="text-sm font-medium">This payslip is validated and locked. Contact Admin to make changes.</p>
        </div>
      )}

      {/* Header Info */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">{empName}</h1>
        <div className="grid grid-cols-2 gap-y-3 max-w-md text-sm">
          <span className="font-medium text-gray-700">Pay Period</span>
          <span className="text-gray-600">{monthName}</span>
          <span className="font-medium text-gray-700">Salary Structure</span>
          <span className="text-blue-500">Regular Pay</span>
          <span className="font-medium text-gray-700">Period</span>
          <span className="text-gray-600">01 – {daysInMonth} {new Date(payslip.year, payslip.month - 1).toLocaleString('default', { month: 'short' })} {payslip.year}</span>
          {payslip.version && (
            <>
              <span className="font-medium text-gray-700">Version</span>
              <span className="text-gray-600">v{payslip.version}</span>
            </>
          )}
          {payslip.employee?.department && (
            <>
              <span className="font-medium text-gray-700">Department</span>
              <span className="text-gray-600">{payslip.employee.department}</span>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 print:hidden">
        <div className="flex gap-2">
          {[['worked-days', 'Worked Days'], ['salary-computation', 'Salary Computation']].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`px-6 py-2.5 border border-b-0 rounded-t-lg text-sm transition-colors ${
                activeTab === key
                  ? 'bg-white border-gray-200 -mb-px text-gray-900 font-semibold'
                  : 'bg-gray-50 border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <Card className="overflow-hidden">
        {activeTab === 'worked-days' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="py-3 px-6 text-xs font-semibold text-gray-500 uppercase">Type</th>
                  <th className="py-3 px-6 text-xs font-semibold text-gray-500 uppercase">Days</th>
                  <th className="py-3 px-6 text-xs font-semibold text-gray-500 uppercase">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                <tr>
                  <td className="py-4 px-6 text-gray-700 italic">Attendance (Paid Days)</td>
                  <td className="py-4 px-6 text-gray-700">{Number(payslip.paidDays || 0).toFixed(2)}</td>
                  <td className="py-4 px-6 text-gray-700">{fmt(payslip.basicSalary)}</td>
                </tr>
                <tr>
                  <td className="py-4 px-6 text-gray-700 italic">Unpaid Time off (LOP)</td>
                  <td className="py-4 px-6 text-red-500 font-medium">{Number(payslip.lopDays || 0).toFixed(2)}</td>
                  <td className="py-4 px-6 text-red-500">
                    {payslip.lopDays > 0
                      ? `- ${fmt((Number(payslip.basicSalary) / (payslip.workingDays || 26)) * Number(payslip.lopDays))}`
                      : '₹ 0.00'}
                  </td>
                </tr>
                <tr className="bg-gray-50 font-bold">
                  <td className="py-4 px-6 text-gray-900">Total Worked Days</td>
                  <td className="py-4 px-6 text-gray-900">{Number(payslip.paidDays || 0).toFixed(2)}</td>
                  <td className="py-4 px-6 text-gray-900">{fmt(payslip.grossSalary)}</td>
                </tr>
              </tbody>
            </table>
            <p className="px-6 py-4 text-sm text-gray-400 italic">
              Salary is calculated based on the employee's monthly attendance. Paid leaves are included in the total payable days, while unpaid leaves are deducted.
            </p>
          </div>
        )}

        {activeTab === 'salary-computation' && (
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Earnings */}
              <div>
                <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wider border-b pb-2 mb-3">Earnings</h3>
                {Array.isArray(payslip.earnings) && payslip.earnings.length > 0
                  ? payslip.earnings.map((e, i) => (
                    <div key={i} className="flex justify-between py-2 text-sm border-b border-gray-50 last:border-0">
                      <span className="text-gray-600">{e.label}</span>
                      <span className="font-medium text-gray-800">{fmt(e.amount)}</span>
                    </div>
                  ))
                  : <p className="text-sm text-gray-400 italic">No earnings breakdown available.</p>
                }
                <div className="flex justify-between py-3 text-sm font-bold border-t border-gray-200 mt-2">
                  <span>Gross Salary</span>
                  <span className="text-gray-900">{fmt(payslip.grossSalary)}</span>
                </div>
              </div>

              {/* Deductions */}
              <div>
                <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wider border-b pb-2 mb-3">Deductions</h3>
                {Array.isArray(payslip.deductions) && payslip.deductions.length > 0
                  ? payslip.deductions.map((d, i) => (
                    <div key={i} className="flex justify-between py-2 text-sm border-b border-gray-50 last:border-0">
                      <span className="text-gray-600">{d.label}</span>
                      <span className="font-medium text-red-600">- {fmt(d.amount)}</span>
                    </div>
                  ))
                  : <p className="text-sm text-gray-400 italic">No deductions.</p>
                }
                <div className="flex justify-between py-3 text-sm font-bold border-t border-gray-200 mt-2">
                  <span>Total Deductions</span>
                  <span className="text-red-600">- {fmt(payslip.totalDeductions)}</span>
                </div>
              </div>
            </div>

            {/* Net Salary */}
            <div className="flex justify-end">
              <div className="bg-gray-900 text-white rounded-xl px-8 py-5 text-right min-w-[220px]">
                <span className="block text-xs uppercase tracking-widest text-gray-400 mb-1">Net Salary</span>
                <span className="text-3xl font-extrabold">{fmt(payslip.netSalary)}</span>
              </div>
            </div>
          </div>
        )}
      </Card>

    </div>
  );
}
