import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { Card } from '../../../features/ui';
import api from '../../../services/api';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function PayslipDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [payslip, setPayslip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('worked-days');
  const [viewMode, setViewMode] = useState('VIEW'); // 'VIEW', 'DRAFT', 'COMPUTED'
  const [isUpdating, setIsUpdating] = useState(false);

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
    setViewMode('DRAFT');
  };

  const handleCompute = async () => {
    setIsUpdating(true);
    try {
      if (id === 'new') {
        const query = new URLSearchParams(location.search);
        await api.post('/payroll/process', { 
           month: query.get('month'),
           employeeId: query.get('employeeId')
        });
        setViewMode('COMPUTED');
        fetchPayslip(); 
      } else {
        const res = await api.post(`/payslips/${id}/compute`);
        setPayslip(res);
        setViewMode('COMPUTED');
      }
    } catch (err) {
      alert('Compute failed: ' + err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleValidate = async () => {
    setIsUpdating(true);
    try {
      await api.post(`/payslips/${payslip.id}/validate`);
      setViewMode('VIEW');
      fetchPayslip();
    } catch (err) {
      alert('Validate failed: ' + err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel this payslip?')) return;
    setIsUpdating(true);
    try {
      if (payslip.id !== 'draft') {
        await api.post(`/payslips/${payslip.id}/cancel`);
      }
      navigate('/payroll/process');
    } catch (err) {
      alert('Cancel failed: ' + err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDownloadPdf = () => {
    alert('Preparing PDF Download...');
    try {
      if (!payslip) return alert('No payslip data found');
      
      const doc = new jsPDF();
      const yr = payslip.year || new Date().getFullYear();
      const mn = payslip.month || (new Date().getMonth() + 1);
      const monthName = new Date(yr, mn - 1).toLocaleString('default', { month: 'long', year: 'numeric' });
      
      // Header
      doc.setFontSize(22);
      doc.setTextColor(21, 128, 61); // brand-700
      doc.text('EmPay', 105, 20, { align: 'center' });
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text('PAYSLIP - ' + monthName.toUpperCase(), 105, 28, { align: 'center' });
      
      // Employee Info
      doc.setDrawColor(200);
      doc.line(20, 35, 190, 35);
      
      doc.setFontSize(12);
      doc.setTextColor(0);
      doc.text(`Employee: ${payslip.employee?.firstName || ''} ${payslip.employee?.lastName || ''}`, 20, 45);
      doc.text(`Designation: ${payslip.employee?.designation || 'Staff'}`, 20, 52);
      
      doc.text(`Period: 01 ${monthName} to 31 ${monthName}`, 120, 45);
      doc.text(`Salary Structure: Regular Pay`, 120, 52);

      const earnings = Array.isArray(payslip.earnings) ? payslip.earnings : [];
      const deductions = Array.isArray(payslip.deductions) ? payslip.deductions : [];

      // Earnings Table
      const earningsData = earnings.map(e => [e.label, 'INR ' + (Number(e.amount) || 0).toLocaleString('en-IN')]);
      autoTable(doc, {
        startY: 65,
        head: [['Earnings', 'Amount']],
        body: [
          ...earningsData,
          [{ content: 'Gross Earnings', styles: { fontStyle: 'bold' } }, { content: 'INR ' + (Number(payslip.grossSalary) || 0).toLocaleString('en-IN'), styles: { fontStyle: 'bold' } }]
        ],
        theme: 'grid',
        headStyles: { fillColor: [21, 128, 61] },
        margin: { left: 20, right: 110 }
      });

      // Deductions Table
      const deductionsData = deductions.map(d => [d.label, 'INR ' + (Number(d.amount) || 0).toLocaleString('en-IN')]);
      autoTable(doc, {
        startY: 65,
        head: [['Deductions', 'Amount']],
        body: [
          ...deductionsData,
          [{ content: 'Total Deductions', styles: { fontStyle: 'bold' } }, { content: 'INR ' + (Number(payslip.totalDeductions) || 0).toLocaleString('en-IN'), styles: { fontStyle: 'bold' } }]
        ],
        theme: 'grid',
        headStyles: { fillColor: [185, 28, 28] },
        margin: { left: 110, right: 20 }
      });

      // Net Salary
      const finalY = Math.max(doc.lastAutoTable?.finalY || 65, 65);
      doc.setFillColor(240, 253, 244); // green-50
      doc.rect(20, finalY + 10, 170, 25, 'F');
      doc.setFontSize(10);
      doc.setTextColor(21, 128, 61);
      doc.text('NET PAYABLE SALARY', 105, finalY + 20, { align: 'center' });
      doc.setFontSize(18);
      doc.text('INR ' + (Number(payslip.netSalary) || 0).toLocaleString('en-IN'), 105, finalY + 30, { align: 'center' });

      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(`Version ${payslip.version || 1} - System Generated on ${new Date().toLocaleDateString()}`, 105, finalY + 45, { align: 'center' });

      doc.save(`Payslip_${payslip.employee?.lastName || 'Employee'}_${monthName.replace(' ', '_')}.pdf`);
    } catch (error) {
      console.error('PDF Generation Error:', error);
      alert('Error generating PDF: ' + error.message);
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
          disabled={viewMode !== 'DRAFT'}
          className={`px-6 py-1.5 rounded-full text-sm font-medium transition shadow-sm ${
            viewMode === 'DRAFT' ? 'bg-[#D63384] text-white' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
        >
          Compute
        </button>
        <button 
          onClick={handleValidate}
          disabled={isLocked || viewMode === 'DRAFT' || payslip.id === 'draft'}
          className="px-6 py-1.5 bg-[#ADB5BD] text-white rounded-full text-sm font-medium hover:opacity-90 transition shadow-sm disabled:opacity-50"
        >
          Validate
        </button>
        {!isLocked && (
          <button 
            onClick={handleCancel}
            className="px-6 py-1.5 bg-[#ADB5BD] text-white rounded-full text-sm font-medium hover:opacity-90 transition shadow-sm"
          >
            Cancel
          </button>
        )}
        <button 
          onClick={() => window.print()}
          className="px-6 py-1.5 bg-[#ADB5BD] text-white rounded-full text-sm font-medium hover:opacity-90 transition shadow-sm"
        >
          Print
        </button>
      </div>

      <div className="print:mt-0 mt-4">
        <div className="text-3xl font-medium text-gray-800 mb-6 tracking-tight">
          [{payslip.employee?.firstName} {payslip.employee?.lastName}]
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
                    {viewMode === 'DRAFT' ? '' : `${payslip.paidDays || 20}.00 (5 working days in week)`}
                  </td>
                  <td className="py-4 px-4 text-gray-700">
                    {viewMode === 'DRAFT' ? '' : fmt(payslip.basicSalary)}
                  </td>
                </tr>
                <tr>
                  <td className="py-4 px-4 text-gray-700 italic">Paid Time off</td>
                  <td className="py-4 px-4 text-gray-700">
                    {viewMode === 'DRAFT' ? '' : '2.00 (2 Paid leaves/Month)'}
                  </td>
                  <td className="py-4 px-4 text-gray-700">
                    {viewMode === 'DRAFT' ? '' : fmt(Number(payslip.grossSalary) - Number(payslip.basicSalary))}
                  </td>
                </tr>
                <tr className="border-t-2 border-gray-100 font-bold">
                  <td className="py-4 px-4 text-gray-900"></td>
                  <td className="py-4 px-4 text-gray-900">{viewMode === 'DRAFT' ? '' : '22.00'}</td>
                  <td className="py-4 px-4 text-gray-900">{viewMode === 'DRAFT' ? '' : fmt(payslip.grossSalary)}</td>
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
                      <span>{viewMode === 'DRAFT' ? '' : fmt(e.amount)}</span>
                    </div>
                  ))}
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 border-b pb-1 mb-3">Deductions</h3>
                  {Array.isArray(payslip.deductions) && payslip.deductions.map((d, idx) => (
                    <div key={idx} className="flex justify-between py-1 text-sm">
                      <span>{d.label}</span>
                      <span className="text-red-600">{viewMode === 'DRAFT' ? '' : fmt(d.amount)}</span>
                    </div>
                  ))}
                </div>
             </div>
             <div className="flex justify-end pt-6 border-t mt-6">
                <div className="text-right">
                  <span className="block text-sm text-gray-500 uppercase font-bold">Net Salary</span>
                  <span className="text-3xl font-extrabold text-green-600">{viewMode === 'DRAFT' ? '' : fmt(payslip.netSalary)}</span>
                </div>
             </div>
          </div>
        )}
      </div>

      {/* FOOTER ACTIONS */}
      <div className="flex justify-end pt-8 border-t border-gray-100 print:hidden">
        <button 
          onClick={handleDownloadPdf}
          className="px-6 py-2 bg-[#1B3022] text-white rounded-md text-sm font-medium hover:bg-[#1B3022]/90 transition shadow-md"
        >
          Download PDF
        </button>
      </div>

    </div>
  );
}
