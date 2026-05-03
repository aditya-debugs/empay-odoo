import { useState, useEffect } from 'react';
import { Card } from '../../../features/ui';
import { useAuth } from '../../../features/auth/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../../../services/api';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const TABS = [
  { id: 'payroll', label: 'Payroll Summary' },
  { id: 'pf', label: 'PF Report' },
  { id: 'prof-tax', label: 'Professional Tax' },
  { id: 'ytd', label: 'YTD Report' }
];

const MONTHS_LIST = [
  { value: 1, label: 'January' }, { value: 2, label: 'February' }, { value: 3, label: 'March' },
  { value: 4, label: 'April' }, { value: 5, label: 'May' }, { value: 6, label: 'June' },
  { value: 7, label: 'July' }, { value: 8, label: 'August' }, { value: 9, label: 'September' },
  { value: 10, label: 'October' }, { value: 11, label: 'November' }, { value: 12, label: 'December' }
];

export default function Reports() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('payroll');
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [employeeId, setEmployeeId] = useState('');
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user?.role === 'EMPLOYEE') {
      navigate('/payroll/payslips', { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    fetchReport();
  }, [activeTab, month, year]);

  const fetchReport = async () => {
    setLoading(true);
    setError(null);
    try {
      let url = `/reports/${activeTab}?year=${year}`;
      if (activeTab !== 'ytd') url += `&month=${month}`;
      if (activeTab === 'ytd' && employeeId) url += `&employeeId=${employeeId}`;
      
      const res = await api.get(url);
      setData(res || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch report');
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const formatINR = (val) => {
    const num = typeof val === 'object' && val?.d ? Number(val.d.join('')) : Number(val || 0); // Handle Prisma Decimal
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(num);
  };

  const exportPDF = () => {
    if (!data || data.length === 0) return;
    const doc = new jsPDF('l', 'mm', 'a4');
    doc.setFontSize(18);
    doc.text(`EmPay - ${TABS.find(t => t.id === activeTab)?.label}`, 14, 20);
    doc.setFontSize(10);
    doc.text(`Period: ${MONTHS_LIST.find(m => m.value === month)?.label} ${year}`, 14, 28);

    let head = [], body = [];
    if (activeTab === 'payroll') {
      head = [['Employee', 'Gross Salary', 'Deductions', 'Net Salary', 'Status']];
      body = data.map(r => [`${r.employee?.firstName} ${r.employee?.lastName}`, formatINR(r.grossSalary), formatINR(r.totalDeductions), formatINR(r.netSalary), r.status]);
    } else if (activeTab === 'pf') {
      head = [['Employee', 'PF Amount', 'Aadhaar']];
      body = data.map(r => [r.employee, formatINR(r.pfAmount), r.aadhaar || '-']);
    } else if (activeTab === 'prof-tax') {
      head = [['Employee', 'PT Amount']];
      body = data.map(r => [r.employee, formatINR(r.ptAmount)]);
    } else if (activeTab === 'ytd') {
      head = [['Employee', 'YTD Gross', 'YTD Net']];
      body = data.map(r => [r.employee, formatINR(r.ytdGross), formatINR(r.ytdNet)]);
    }

    autoTable(doc, { startY: 35, head, body, theme: 'grid', headStyles: { fillColor: [40, 40, 40] } });
    doc.save(`Report_${activeTab}_${month}_${year}.pdf`);
  };

  return (
    <div className="p-8 space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tighter">STATUTORY REPORTS</h1>
          <p className="text-gray-500 font-medium">Compliance oversight and financial summaries</p>
        </div>
        {data && data.length > 0 && (
          <button onClick={exportPDF} className="bg-gray-900 text-white px-6 py-2 rounded-xl font-bold hover:bg-black transition shadow-lg">EXPORT PDF</button>
        )}
      </div>

      <div className="flex bg-gray-100 p-1 rounded-2xl w-fit border border-gray-200">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all ${
              activeTab === tab.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label.toUpperCase()}
          </button>
        ))}
      </div>

      <Card className="p-6 grid grid-cols-1 md:grid-cols-4 gap-6 items-end bg-white border-gray-100 shadow-xl rounded-3xl">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Month</label>
          <select 
            value={month} 
            onChange={e => setMonth(parseInt(e.target.value))}
            className="w-full h-12 bg-gray-50 border-none rounded-2xl px-4 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-gray-200 transition-all cursor-pointer"
          >
            {MONTHS_LIST.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Year</label>
          <select 
            value={year} 
            onChange={e => setYear(parseInt(e.target.value))}
            className="w-full h-12 bg-gray-50 border-none rounded-2xl px-4 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-gray-200 transition-all cursor-pointer"
          >
            {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div className="md:col-span-2">
           <button 
             onClick={fetchReport}
             disabled={loading}
             className="w-full h-12 bg-emerald-600 text-white rounded-2xl font-black tracking-widest hover:bg-emerald-700 transition-all active:scale-95 disabled:opacity-50 shadow-emerald-200 shadow-lg"
           >
             {loading ? 'GENERATING...' : 'REFRESH DATA'}
           </button>
        </div>
      </Card>

      {error && <div className="p-4 bg-red-50 text-red-600 rounded-2xl border border-red-100 font-bold text-center italic">⚠ {error}</div>}

      <Card className="overflow-hidden border-gray-100 shadow-2xl rounded-3xl bg-white">
        <div className="overflow-x-auto">
          {data && data.length > 0 ? (
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Employee</th>
                  {activeTab === 'payroll' && (
                    <>
                      <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Gross</th>
                      <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Net Payable</th>
                      <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Status</th>
                    </>
                  )}
                  {activeTab === 'pf' && <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">PF Amount</th>}
                  {activeTab === 'prof-tax' && <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">PT Amount</th>}
                  {activeTab === 'ytd' && <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Annual Net</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.map((r, i) => (
                  <tr key={i} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="font-bold text-gray-900">{activeTab === 'payroll' ? `${r.employee?.firstName} ${r.employee?.lastName}` : r.employee}</div>
                      <div className="text-[10px] text-gray-400 font-black uppercase tracking-tighter">{activeTab === 'payroll' ? r.employee?.department : 'Personnel'}</div>
                    </td>
                    {activeTab === 'payroll' && (
                      <>
                        <td className="px-8 py-6 text-gray-500 font-bold">{formatINR(r.grossSalary)}</td>
                        <td className="px-8 py-6 text-gray-900 font-black text-lg">{formatINR(r.netSalary)}</td>
                        <td className="px-8 py-6 text-center">
                          <span className={`px-3 py-1 rounded-full text-[9px] font-black tracking-widest ${
                            r.status === 'GENERATED' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                          }`}>
                            {r.status}
                          </span>
                        </td>
                      </>
                    )}
                    {activeTab === 'pf' && <td className="px-8 py-6 text-right font-black text-red-600 text-lg">{formatINR(r.pfAmount)}</td>}
                    {activeTab === 'prof-tax' && <td className="px-8 py-6 text-right font-black text-red-600 text-lg">{formatINR(r.ptAmount)}</td>}
                    {activeTab === 'ytd' && <td className="px-8 py-6 text-right font-black text-emerald-700 text-lg">{formatINR(r.ytdNet)}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="py-32 text-center flex flex-col items-center justify-center space-y-4">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-400">NO RECORDS FOUND</h3>
                <p className="text-sm text-gray-400 font-medium italic">Try adjusting the period or generating payroll first.</p>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
