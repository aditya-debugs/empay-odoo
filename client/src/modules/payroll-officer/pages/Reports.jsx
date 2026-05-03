import { useState, useEffect } from 'react';
import { Card } from '../../../features/ui';
import { useAuth } from '../../../features/auth/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../../../services/api';

const TABS = [
  { id: 'payroll',   label: 'Payroll Summary' },
  { id: 'pf',        label: 'PF Report' },
  { id: 'prof-tax',  label: 'Professional Tax' },
  { id: 'ytd',       label: 'YTD Report' }
];

const MONTHS_LIST = [
  { value: 1, label: 'January' },  { value: 2, label: 'February' }, { value: 3, label: 'March' },
  { value: 4, label: 'April' },    { value: 5, label: 'May' },      { value: 6, label: 'June' },
  { value: 7, label: 'July' },     { value: 8, label: 'August' },   { value: 9, label: 'September' },
  { value: 10, label: 'October' }, { value: 11, label: 'November' },{ value: 12, label: 'December' }
];

const formatINR = (val) => {
  const num = Number(val ?? 0);
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(isNaN(num) ? 0 : num);
};

export default function Reports() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('payroll');
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear]   = useState(new Date().getFullYear());
  const [employeeId, setEmployeeId] = useState('');

  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  useEffect(() => {
    if (user?.role === 'EMPLOYEE') navigate('/payroll/payslips', { replace: true });
  }, [user, navigate]);

  useEffect(() => {
    fetchReport();
  }, [activeTab, month, year]);

  const fetchReport = async () => {
    setLoading(true);
    setError(null);
    try {
      let url = `/reports/${activeTab}?year=${year}&month=${month}`;
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

  const exportPDF = () => {
    if (!data || data.length === 0) return;
    const tabLabel = TABS.find(t => t.id === activeTab)?.label || activeTab;
    const monthLabel = MONTHS_LIST.find(m => m.value === month)?.label || month;

    const buildRows = () => {
      if (activeTab === 'payroll') {
        return data.map(r => `
          <tr>
            <td>${r.employee?.firstName ?? ''} ${r.employee?.lastName ?? ''}</td>
            <td>${r.employee?.department ?? '—'}</td>
            <td class="num">${formatINR(r.grossSalary)}</td>
            <td class="num">${formatINR(r.totalDeductions)}</td>
            <td class="num">${formatINR(r.netSalary)}</td>
            <td>${r.status ?? '—'}</td>
          </tr>`).join('');
      }
      if (activeTab === 'pf') {
        return data.map(r => `
          <tr>
            <td>${r.employee?.firstName ?? ''} ${r.employee?.lastName ?? ''}</td>
            <td class="num">${formatINR(r.basicSalary)}</td>
            <td class="num">${formatINR(r.pfAmount)}</td>
          </tr>`).join('');
      }
      if (activeTab === 'prof-tax') {
        return data.map(r => `
          <tr>
            <td>${r.employee?.firstName ?? ''} ${r.employee?.lastName ?? ''}</td>
            <td class="num">${formatINR(r.grossSalary)}</td>
            <td class="num">${formatINR(r.ptAmount)}</td>
          </tr>`).join('');
      }
      if (activeTab === 'ytd') {
        return data.map(r => `
          <tr>
            <td>${r.employee?.firstName ?? ''} ${r.employee?.lastName ?? ''}</td>
            <td class="num">${formatINR(r.ytdGross)}</td>
            <td class="num">${formatINR(r.ytdDeductions)}</td>
            <td class="num">${formatINR(r.ytdNet)}</td>
          </tr>`).join('');
      }
      return '';
    };

    const buildHead = () => {
      if (activeTab === 'payroll')  return '<th>Employee</th><th>Dept</th><th>Gross</th><th>Deductions</th><th>Net</th><th>Status</th>';
      if (activeTab === 'pf')       return '<th>Employee</th><th>Basic Salary</th><th>PF Amount</th>';
      if (activeTab === 'prof-tax') return '<th>Employee</th><th>Gross Salary</th><th>PT Amount</th>';
      if (activeTab === 'ytd')      return '<th>Employee</th><th>YTD Gross</th><th>YTD Deductions</th><th>YTD Net</th>';
      return '';
    };

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
      <title>EmPay — ${tabLabel}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 24px; color: #111; }
        h1 { font-size: 20px; margin-bottom: 4px; }
        p { font-size: 12px; color: #555; margin-bottom: 16px; }
        table { width: 100%; border-collapse: collapse; font-size: 12px; }
        th { background: #1a1a1a; color: #fff; padding: 8px 12px; text-align: left; }
        td { padding: 7px 12px; border-bottom: 1px solid #eee; }
        tr:nth-child(even) td { background: #f9f9f9; }
        .num { text-align: right; }
        @media print { @page { margin: 20mm; } }
      </style></head><body>
      <h1>EmPay — ${tabLabel}</h1>
      <p>Period: ${monthLabel} ${year} &nbsp;|&nbsp; Generated: ${new Date().toLocaleString()}</p>
      <table><thead><tr>${buildHead()}</tr></thead><tbody>${buildRows()}</tbody></table>
      </body></html>`;

    const win = window.open('', '_blank');
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); }, 500);
  };

  const empName = (r) => {
    if (r.employee?.firstName) return `${r.employee.firstName} ${r.employee.lastName}`;
    return r.employee || '—';
  };

  return (
    <div className="p-8 space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tighter">STATUTORY REPORTS</h1>
          <p className="text-gray-500 font-medium">Compliance oversight and financial summaries</p>
        </div>
        {data && data.length > 0 && (
          <button
            onClick={exportPDF}
            className="bg-gray-900 text-white px-6 py-2 rounded-xl font-bold hover:bg-black transition shadow-lg"
          >
            EXPORT PDF
          </button>
        )}
      </div>

      {/* Tabs */}
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

      {/* Filters */}
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

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-2xl border border-red-100 font-bold text-center italic">⚠ {error}</div>
      )}

      {/* Table */}
      <Card className="overflow-hidden border-gray-100 shadow-2xl rounded-3xl bg-white">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-20 text-center text-gray-400 font-bold animate-pulse">Loading report data...</div>
          ) : data && data.length > 0 ? (
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Employee</th>
                  {activeTab === 'payroll' && <>
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Dept</th>
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Gross</th>
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Deductions</th>
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Net Payable</th>
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Status</th>
                  </>}
                  {activeTab === 'pf' && <>
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Basic Salary</th>
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">PF Amount</th>
                  </>}
                  {activeTab === 'prof-tax' && <>
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Gross Salary</th>
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">PT Amount</th>
                  </>}
                  {activeTab === 'ytd' && <>
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">YTD Gross</th>
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">YTD Deductions</th>
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">YTD Net</th>
                  </>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.map((r, i) => (
                  <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-8 py-6">
                      <div className="font-bold text-gray-900">{empName(r)}</div>
                      {activeTab === 'payroll' && (
                        <div className="text-[10px] text-gray-400 font-black uppercase tracking-tighter">{r.employee?.department ?? '—'}</div>
                      )}
                    </td>
                    {activeTab === 'payroll' && <>
                      <td className="px-8 py-6 text-gray-500 font-medium text-sm">{r.employee?.department ?? '—'}</td>
                      <td className="px-8 py-6 text-right text-gray-600 font-bold">{formatINR(r.grossSalary)}</td>
                      <td className="px-8 py-6 text-right text-red-500 font-bold">{formatINR(r.totalDeductions)}</td>
                      <td className="px-8 py-6 text-right text-gray-900 font-black text-lg">{formatINR(r.netSalary)}</td>
                      <td className="px-8 py-6 text-center">
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black tracking-widest ${
                          r.status === 'GENERATED' ? 'bg-emerald-100 text-emerald-700' :
                          r.status === 'LOCKED'    ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {r.status}
                        </span>
                      </td>
                    </>}
                    {activeTab === 'pf' && <>
                      <td className="px-8 py-6 text-right text-gray-600 font-bold">{formatINR(r.basicSalary)}</td>
                      <td className="px-8 py-6 text-right font-black text-red-600 text-lg">{formatINR(r.pfAmount)}</td>
                    </>}
                    {activeTab === 'prof-tax' && <>
                      <td className="px-8 py-6 text-right text-gray-600 font-bold">{formatINR(r.grossSalary)}</td>
                      <td className="px-8 py-6 text-right font-black text-red-600 text-lg">{formatINR(r.ptAmount)}</td>
                    </>}
                    {activeTab === 'ytd' && <>
                      <td className="px-8 py-6 text-right text-gray-600 font-bold">{formatINR(r.ytdGross)}</td>
                      <td className="px-8 py-6 text-right text-red-500 font-bold">{formatINR(r.ytdDeductions)}</td>
                      <td className="px-8 py-6 text-right font-black text-emerald-700 text-lg">{formatINR(r.ytdNet)}</td>
                    </>}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="py-32 text-center flex flex-col items-center justify-center space-y-4">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
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
