import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { Card } from '../../../features/ui';
import api from '../../../services/api';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Lock } from 'lucide-react';

export default function PayslipDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [payslip, setPayslip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('worked-days');
  const [viewMode, setViewMode] = useState('VIEW'); // 'VIEW', 'DRAFT', 'COMPUTED'
  const [isUpdating, setIsUpdating] = useState(false);
  const [showNewModal, setShowNewModal] = useState(false);
  const [newMonth, setNewMonth] = useState('');
  const [creating, setCreating] = useState(false);
  const [newError, setNewError] = useState('');
  const [printing, setPrinting] = useState(false);

  const fetchPayslip = async () => {
    setLoading(true);
    try {
      if (id === 'new') {
        const query = new URLSearchParams(location.search);
        const employeeId = query.get('employeeId');
        const month = query.get('month');
        const res = await api.get(`/payslips/draft?employeeId=${employeeId}&month=${month}`);
        setPayslip(res);
        setViewMode('DRAFT');
      } else {
        const res = await api.get(`/payslips/${id}`);
        setPayslip(res);
        if (res.status === 'LOCKED' || res.status === 'GENERATED') {
          setViewMode('VIEW');
        } else {
          setViewMode('COMPUTED');
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayslip();
  }, [id, location.search]);

  const handleNewPayslip = () => {
    setNewMonth('');
    setNewError('');
    setShowNewModal(true);
  };

  const handleNewPayslipSubmit = async () => {
    if (!newMonth) { setNewError('Please select a month'); return; }
    setCreating(true);
    setNewError('');
    try {
      const res = await api.post('/payslips/new', {
        employeeId: payslip.employeeId,
        month: newMonth
      });
      setShowNewModal(false);
      navigate(`/payroll/payslip/${res.payslipId}`);
    } catch (e) {
      setNewError(e.message || 'Failed to create payslip');
    } finally {
      setCreating(false);
    }
  };

  const handleCompute = async () => {
    setIsUpdating(true);
    try {
      if (id === 'new') {
        const query = new URLSearchParams(location.search);
        const employeeId = query.get('employeeId');
        const month = query.get('month');
        const res = await api.post('/payroll/process-individual', { employeeId, month });
        alert('Salary computed successfully!');
        navigate(`/payroll/payslip/${res.payslip.id}`);
      } else {
        const res = await api.post(`/payslips/${id}/compute`);
        setPayslip(res);
        setViewMode('COMPUTED');
        alert('Salary computed successfully!');
      }
    } catch (err) {
      alert('Compute failed: ' + (err.message || 'Unknown error'));
    } finally {
      setIsUpdating(false);
    }
  };

  const handleValidate = async () => {
    if (!window.confirm('Validate and lock this payslip? This action CANNOT be undone.')) return;
    setIsUpdating(true);
    try {
      await api.post(`/payslips/${payslip.id}/validate`);
      setViewMode('VIEW');
      fetchPayslip();
      alert('Payslip validated and locked successfully!');
    } catch (err) {
      alert('Validate failed: ' + (err.message || 'Unknown error'));
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('Cancel this payslip? This action will mark it as CANCELLED.')) return;
    setIsUpdating(true);
    try {
      await api.patch(`/payslips/${payslip.id}/cancel`);
      alert('Payslip cancelled successfully');
      navigate('/payroll/process');
    } catch (err) {
      alert('Cancel failed: ' + (err.message || 'Unknown error'));
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDownloadPdf = async () => {
    setPrinting(true);
    try {
      const res = await api.get(`/payslips/${payslip.id}/pdf`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([res]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Payslip_${payslip.employee?.lastName || 'Emp'}_${payslip.year}_${payslip.month}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      alert('PDF generation failed: ' + (err.message || 'Unknown error'));
    } finally {
      setPrinting(false);
    }
  };

  if (loading) return <div className="p-8 text-center animate-pulse text-gray-500 font-medium">Loading Payslip...</div>;
  if (!payslip) return <div className="p-8 text-center text-red-500 font-medium">Payslip not found.</div>;

  const fmt = (val) => '₹ ' + (Number(val) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });
  const monthName = new Date(payslip.year, payslip.month - 1).toLocaleString('default', { month: 'short', year: 'numeric' });
  
  const isLocked = payslip.status === 'LOCKED' || payslip.status === 'GENERATED';

  return (
    <div className="px-8 py-8 space-y-6 max-w-5xl mx-auto animate-fade-in print:p-0">
      
      {/* ACTION BUTTONS */}
      <div className="flex flex-wrap gap-3 print:hidden">
        <button 
          onClick={handleNewPayslip}
          className="px-6 py-1.5 bg-[#D63384] text-white rounded-full text-sm font-medium hover:opacity-90 transition shadow-sm"
        >
          New Payslip
        </button>
        <button 
          onClick={handleCompute}
          disabled={isLocked || isUpdating}
          className={`px-6 py-1.5 rounded-full text-sm font-medium transition shadow-sm ${
            !isLocked ? 'bg-[#D63384] text-white hover:opacity-90' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
        >
          {isUpdating ? 'Computing...' : 'Compute'}
        </button>
        <button 
          onClick={handleValidate}
          disabled={isLocked || payslip.status !== 'COMPUTED' || isUpdating}
          className={`px-6 py-1.5 rounded-full text-sm font-medium transition shadow-sm ${
            !isLocked && payslip.status === 'COMPUTED' ? 'bg-[#ADB5BD] text-white hover:opacity-90' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
        >
          {isUpdating && payslip.status === 'COMPUTED' ? 'Validating...' : 'Validate'}
        </button>
        {!isLocked && payslip.status !== 'CANCELLED' && (
          <button 
            onClick={handleCancel}
            disabled={isUpdating}
            className="px-6 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded-full text-sm font-medium hover:bg-red-100 transition shadow-sm disabled:opacity-50"
          >
            {isUpdating && payslip.status !== 'COMPUTED' ? 'Cancelling...' : 'Cancel'}
          </button>
        )}
        {isLocked && (
          <span className="flex items-center text-xs text-gray-400 gap-1 italic">
            <Lock className="h-3 w-3" /> Locked
          </span>
        )}
        <button 
          onClick={handleDownloadPdf}
          className="px-6 py-1.5 bg-[#ADB5BD] text-white rounded-full text-sm font-medium hover:opacity-90 transition shadow-sm"
        >
          Download PDF
        </button>
        <button 
          onClick={() => window.print()}
          className="px-6 py-1.5 bg-[#ADB5BD] text-white rounded-full text-sm font-medium hover:opacity-90 transition shadow-sm"
        >
          Print
        </button>
      </div>

      {/* LOCKED BANNER */}
      {isLocked && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3 text-amber-800 animate-fade-in shadow-sm">
          <div className="p-2 bg-amber-100 rounded-lg">
            <Lock className="h-5 w-5 text-amber-600" />
          </div>
          <p className="text-sm font-medium">
            This payslip has been validated and is locked. Contact Admin to make changes.
          </p>
        </div>
      )}

      <div className="print:mt-0 mt-4">
        <div className="text-3xl font-medium text-gray-800 mb-6 tracking-tight flex items-center gap-4">
          [{payslip.employee?.firstName} {payslip.employee?.lastName}]
          {isLocked && (
            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold uppercase tracking-wider border border-green-200">
              Done
            </span>
          )}
        </div>

        <div className="space-y-4 max-w-md">
          <div className="grid grid-cols-2">
            <span className="text-gray-900 font-medium">Payrun</span>
            <Link to={`/payroll/process?month=${payslip.year}-${String(payslip.month).padStart(2, '0')}`} className="text-blue-500 hover:underline">
              Payrun {monthName}
            </Link>
          </div>
          <div className="grid grid-cols-2">
            <span className="text-gray-900 font-medium">Salary Structure</span>
            <span className="text-blue-500">Regular Pay</span>
          </div>
          <div className="grid grid-cols-2">
            <span className="text-gray-900 font-medium">Period</span>
            <span className="text-gray-800">01 {monthName.split(' ')[0]} To 31 {monthName.split(' ')[0]}</span>
          </div>
        </div>
      </div>

      {/* TABS */}
      <div className="mt-8 border-b border-gray-200 print:hidden">
        <div className="flex gap-2">
          <button 
            onClick={() => setActiveTab('worked-days')}
            className={`px-6 py-2 border border-b-0 rounded-t-lg transition-colors ${
              activeTab === 'worked-days' ? 'bg-white border-gray-200 -mb-px text-gray-900 font-medium' : 'bg-gray-50 border-transparent text-gray-500'
            }`}
          >
            Worked Days
          </button>
          <button 
            onClick={() => setActiveTab('salary-computation')}
            className={`px-6 py-2 border border-b-0 rounded-t-lg transition-colors ${
              activeTab === 'salary-computation' ? 'bg-white border-gray-200 -mb-px text-gray-900 font-medium' : 'bg-gray-50 border-transparent text-gray-500'
            }`}
          >
            Salary Computation
          </button>
        </div>
      </div>

      {/* CONTENT AREA */}
      <div className="bg-white pb-10">
        {activeTab === 'worked-days' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="py-3 px-4 text-gray-800 font-medium">Type</th>
                  <th className="py-3 px-4 text-gray-800 font-medium">Days</th>
                  <th className="py-3 px-4 text-gray-800 font-medium">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                <tr>
                  <td className="py-4 px-4 text-gray-700 italic">Attendance</td>
                  <td className="py-4 px-4 text-gray-700">
                    {payslip.status === 'DRAFT' ? '0.00' : `${payslip.paidDays || 0}.00`}
                  </td>
                  <td className="py-4 px-4 text-gray-700">
                    {payslip.status === 'DRAFT' ? '₹ 0.00' : fmt(payslip.basicSalary)}
                  </td>
                </tr>
                <tr>
                  <td className="py-4 px-4 text-gray-700 italic">Unpaid Time off (LOP)</td>
                  <td className="py-4 px-4 text-gray-700 text-red-600">
                    {payslip.status === 'DRAFT' ? '0.00' : `${payslip.lopDays || 0}.00`}
                  </td>
                  <td className="py-4 px-4 text-red-600">
                    {payslip.status === 'DRAFT' ? '₹ 0.00' : `- ${fmt(Number(payslip.lopDeduction || 0))}`}
                  </td>
                </tr>
                <tr className="border-t-2 border-gray-100 font-bold">
                  <td className="py-4 px-4 text-gray-900">Total Worked Days</td>
                  <td className="py-4 px-4 text-gray-900">{payslip.status === 'DRAFT' ? '0.00' : `${payslip.paidDays || 0}.00`}</td>
                  <td className="py-4 px-4 text-gray-900">{payslip.status === 'DRAFT' ? '₹ 0.00' : fmt(payslip.grossSalary)}</td>
                </tr>
              </tbody>
            </table>
            
            <p className="mt-8 text-sm text-gray-600 leading-relaxed max-w-3xl italic">
              Salary is calculated based on the employee's monthly attendance. Paid leaves are 
              included in the total payable days, while unpaid leaves are deducted from the 
              salary
            </p>
          </div>
        )}

        {activeTab === 'salary-computation' && (
          <div className="p-4 space-y-4">
             <div className="grid grid-cols-2 gap-8">
                <div>
                  <h3 className="font-bold text-gray-800 border-b pb-1 mb-3">Earnings</h3>
                  {Array.isArray(payslip.earnings) && payslip.earnings.map((e, idx) => (
                    <div key={idx} className="flex justify-between py-1 text-sm">
                      <span>{e.label}</span>
                      <span>{payslip.status === 'DRAFT' ? '₹ 0.00' : fmt(e.amount)}</span>
                    </div>
                  ))}
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 border-b pb-1 mb-3">Deductions</h3>
                  {Array.isArray(payslip.deductions) && payslip.deductions.map((d, idx) => (
                    <div key={idx} className="flex justify-between py-1 text-sm">
                      <span>{d.label}</span>
                      <span className="text-red-600">{payslip.status === 'DRAFT' ? '₹ 0.00' : fmt(d.amount)}</span>
                    </div>
                  ))}
                </div>
             </div>
             <div className="flex justify-end pt-6 border-t mt-6">
                <div className="text-right">
                  <span className="block text-sm text-gray-500 uppercase font-bold">Net Salary</span>
                  <span className="text-3xl font-extrabold text-green-600">{payslip.status === 'DRAFT' ? '₹ 0.00' : fmt(payslip.netSalary)}</span>
                </div>
             </div>
          </div>
        )}
      </div>

      {/* FOOTER ACTIONS */}
      <div className="flex justify-end pt-8 border-t border-gray-100 print:hidden">
        <button 
          onClick={handleDownloadPdf}
          disabled={printing}
          className="px-6 py-2 bg-[#1B3022] text-white rounded-md text-sm font-medium hover:bg-[#1B3022]/90 transition shadow-md flex items-center gap-2"
        >
          {printing ? (
            <>
              <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Downloading...
            </>
          ) : 'Download PDF'}
        </button>
      </div>

      {/* New Payslip Modal */}
      {showNewModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="max-w-sm w-full p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-gray-800 mb-2">New Payslip</h2>
            <p className="text-sm text-gray-600 mb-6">
              Select the month to generate a new draft payslip for <strong>{payslip.employee?.firstName} {payslip.employee?.lastName}</strong>.
            </p>
            
            <div className="mb-6">
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Select Month</label>
              <input
                type="month"
                value={newMonth}
                onChange={e => { setNewMonth(e.target.value); setNewError(''); }}
                className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-[#D63384] focus:border-transparent outline-none transition-all"
              />
              {newError && <p className="text-red-500 text-xs mt-2 font-medium">{newError}</p>}
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleNewPayslipSubmit}
                disabled={creating}
                className="flex-1 bg-[#D63384] text-white rounded-lg py-3 text-sm font-bold hover:opacity-90 transition disabled:opacity-50"
              >
                {creating ? 'Creating...' : 'Create Payslip'}
              </button>
              <button
                onClick={() => setShowNewModal(false)}
                className="flex-1 bg-gray-100 text-gray-600 rounded-lg py-3 text-sm font-bold hover:bg-gray-200 transition"
              >
                Cancel
              </button>
            </div>
          </Card>
        </div>
      )}

    </div>
  );
}
