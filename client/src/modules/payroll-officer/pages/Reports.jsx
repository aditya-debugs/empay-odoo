import { useState, useEffect } from 'react';
import { Card } from '../../../features/ui';
import { useAuth } from '../../../features/auth/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../../../services/api';

const TABS = [
  { id: 'payroll', label: 'Payroll Summary' },
  { id: 'pf', label: 'PF Report' },
  { id: 'prof-tax', label: 'Professional Tax' },
  { id: 'ytd', label: 'YTD Report' }
];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function Reports() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('payroll');
  const [month, setMonth] = useState(() => new Date().toISOString().substring(0, 7));
  const [year, setYear] = useState(() => new Date().getFullYear().toString());
  const [employeeId, setEmployeeId] = useState('');
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user?.role === 'EMPLOYEE') {
      navigate('/payroll/payslips', { replace: true });
    } else if (user?.role === 'HR_OFFICER') {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const fetchReport = async () => {
    setLoading(true);
    setError(null);
    setData(null);
    try {
      let url = `/reports/${activeTab}?`;
      if (activeTab === 'ytd') {
        url += `year=${year}`;
        if (employeeId) url += `&employeeId=${employeeId}`;
      } else {
        url += `month=${month}`;
      }
      const res = await api.get(url);
      setData(res);
    } catch (err) {
      setError(err.message || 'Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setData(null);
    setError(null);
  };

  const formatINR = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val || 0);

  const exportCSV = () => {
    if (!data || data.length === 0) return;
    
    let csvContent = "";
    
    if (activeTab === 'payroll') {
      csvContent += "Employee,Basic,Gross,Total Deductions,Net,Status\n";
      data.forEach(r => {
        const name = `${r.employee?.firstName} ${r.employee?.lastName}`;
        csvContent += `"${name}",${r.basicSalary},${r.grossSalary},${r.totalDeductions},${r.netSalary},${r.status}\n`;
      });
    } else if (activeTab === 'pf') {
      csvContent += "Employee,Basic Salary,PF (12%),Month\n";
      data.forEach(r => {
        const name = `${r.employee?.firstName} ${r.employee?.lastName}`;
        csvContent += `"${name}",${r.basicSalary},${r.pfDeduction},${r.month}\n`;
      });
    } else if (activeTab === 'prof-tax') {
      csvContent += "Employee,Gross Salary,PT Amount,Month\n";
      data.forEach(r => {
        const name = `${r.employee?.firstName} ${r.employee?.lastName}`;
        csvContent += `"${name}",${r.grossSalary},${r.professionalTax},${r.month}\n`;
      });
    } else if (activeTab === 'ytd') {
      csvContent += "Employee," + MONTHS.join(',') + ",Annual Total\n";
      const grouped = getGroupedYtd();
      grouped.forEach(r => {
        const monthCols = MONTHS.map((_, i) => r.months[i + 1] || 0).join(',');
        csvContent += `"${r.employeeName}",${monthCols},${r.annualTotal}\n`;
      });
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${activeTab}_report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportPDF = () => {
    let url = `${import.meta.env.VITE_API_URL}/reports/${activeTab}?format=pdf`;
    if (activeTab === 'ytd') {
      url += `&year=${year}`;
      if (employeeId) url += `&employeeId=${employeeId}`;
    } else {
      url += `&month=${month}`;
    }
    // Assumes the backend generates the PDF stream
    window.open(url, '_blank');
  };

  const getGroupedYtd = () => {
    if (activeTab !== 'ytd' || !data) return [];
    const grouped = {};
    data.forEach(row => {
      const empId = row.employeeId;
      if (!grouped[empId]) {
        grouped[empId] = {
          employeeName: `${row.employee?.firstName} ${row.employee?.lastName}`,
          months: {},
          annualTotal: 0
        };
      }
      const monthNum = parseInt(row.month.split('-')[1], 10);
      grouped[empId].months[monthNum] = row.netSalary;
      grouped[empId].annualTotal += row.netSalary;
    });
    return Object.values(grouped);
  };

  // Aggregates
  let sumGross = 0, sumDed = 0, sumNet = 0, sumPf = 0, sumPt = 0;
  if (data && activeTab === 'payroll') {
    data.forEach(r => { sumGross += r.grossSalary; sumDed += r.totalDeductions; sumNet += r.netSalary; });
  } else if (data && activeTab === 'pf') {
    data.forEach(r => { sumPf += r.pfDeduction; });
  } else if (data && activeTab === 'prof-tax') {
    data.forEach(r => { sumPt += r.professionalTax; });
  }

  const groupedYtd = getGroupedYtd();

  return (
    <div className="px-8 py-8 animate-fade-in space-y-6">
      
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-gray-900">Payroll Reports</h1>
        <p className="mt-1 text-sm text-gray-500">Generate and export statutory and compliance reports</p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 border-b border-gray-200">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id 
                ? 'border-brand-600 text-brand-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Shared Filters */}
      <Card className="p-6 bg-gray-50 border border-gray-100">
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          {activeTab === 'ytd' ? (
            <>
              <div className="flex flex-col">
                <label className="text-xs font-semibold text-gray-500 mb-1 uppercase">Select Year</label>
                <input 
                  type="number" 
                  value={year}
                  onChange={e => setYear(e.target.value)}
                  className="border border-gray-300 rounded px-3 py-2 outline-none focus:border-brand-500"
                />
              </div>
              <div className="flex flex-col flex-1 max-w-xs">
                <label className="text-xs font-semibold text-gray-500 mb-1 uppercase">Employee ID (Optional)</label>
                <input 
                  type="text" 
                  value={employeeId}
                  onChange={e => setEmployeeId(e.target.value)}
                  placeholder="e.g. EMP-1234"
                  className="border border-gray-300 rounded px-3 py-2 outline-none focus:border-brand-500"
                />
              </div>
            </>
          ) : (
            <div className="flex flex-col">
              <label className="text-xs font-semibold text-gray-500 mb-1 uppercase">Select Month</label>
              <input 
                type="month" 
                value={month}
                onChange={e => setMonth(e.target.value)}
                className="border border-gray-300 rounded px-3 py-2 outline-none focus:border-brand-500"
              />
            </div>
          )}
          
          <button 
            onClick={fetchReport}
            disabled={loading}
            className="px-6 py-2 bg-gray-900 text-white rounded font-medium hover:bg-gray-800 transition disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Load Report'}
          </button>
        </div>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </Card>

      {/* Tables */}
      {data && (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            
            {activeTab === 'payroll' && (
              <table className="min-w-full divide-y divide-gray-200 text-left">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Employee</th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Basic</th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Gross</th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Total Deductions</th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Net</th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.map(r => (
                    <tr key={r.id} className="hover:bg-gray-50">
                      <td className="px-6 py-3 text-sm font-medium text-gray-900">{r.employee?.firstName} {r.employee?.lastName}</td>
                      <td className="px-6 py-3 text-sm text-gray-500">{formatINR(r.basicSalary)}</td>
                      <td className="px-6 py-3 text-sm text-gray-500">{formatINR(r.grossSalary)}</td>
                      <td className="px-6 py-3 text-sm text-gray-500">{formatINR(r.totalDeductions)}</td>
                      <td className="px-6 py-3 text-sm font-bold text-gray-900">{formatINR(r.netSalary)}</td>
                      <td className="px-6 py-3 text-sm"><span className="bg-gray-100 text-gray-800 px-2 py-0.5 rounded text-xs">{r.status}</span></td>
                    </tr>
                  ))}
                  {data.length === 0 && <tr><td colSpan="6" className="p-8 text-center text-gray-500">No records found.</td></tr>}
                </tbody>
                {data.length > 0 && (
                  <tfoot className="bg-gray-50 font-bold border-t-2 border-gray-200">
                    <tr>
                      <td className="px-6 py-4">TOTAL</td>
                      <td className="px-6 py-4">-</td>
                      <td className="px-6 py-4 text-gray-900">{formatINR(sumGross)}</td>
                      <td className="px-6 py-4 text-red-600">{formatINR(sumDed)}</td>
                      <td className="px-6 py-4 text-green-700">{formatINR(sumNet)}</td>
                      <td className="px-6 py-4">-</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            )}

            {activeTab === 'pf' && (
              <table className="min-w-full divide-y divide-gray-200 text-left">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Employee</th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Basic Salary</th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">PF (12%)</th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Month</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.map((r, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-6 py-3 text-sm font-medium text-gray-900">{r.employee?.firstName} {r.employee?.lastName}</td>
                      <td className="px-6 py-3 text-sm text-gray-500">{formatINR(r.basicSalary)}</td>
                      <td className="px-6 py-3 text-sm text-red-600 font-medium">{formatINR(r.pfDeduction)}</td>
                      <td className="px-6 py-3 text-sm text-gray-500">{r.month}</td>
                    </tr>
                  ))}
                  {data.length === 0 && <tr><td colSpan="4" className="p-8 text-center text-gray-500">No records found.</td></tr>}
                </tbody>
                {data.length > 0 && (
                  <tfoot className="bg-gray-50 font-bold border-t-2 border-gray-200">
                    <tr>
                      <td colSpan="2" className="px-6 py-4 text-right">TOTAL LIABILITY:</td>
                      <td className="px-6 py-4 text-red-700 text-lg">{formatINR(sumPf)}</td>
                      <td className="px-6 py-4"></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            )}

            {activeTab === 'prof-tax' && (
              <table className="min-w-full divide-y divide-gray-200 text-left">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Employee</th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Gross Salary</th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">PT Amount</th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Month</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.map((r, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-6 py-3 text-sm font-medium text-gray-900">{r.employee?.firstName} {r.employee?.lastName}</td>
                      <td className="px-6 py-3 text-sm text-gray-500">{formatINR(r.grossSalary)}</td>
                      <td className="px-6 py-3 text-sm text-red-600 font-medium">{formatINR(r.professionalTax)}</td>
                      <td className="px-6 py-3 text-sm text-gray-500">{r.month}</td>
                    </tr>
                  ))}
                  {data.length === 0 && <tr><td colSpan="4" className="p-8 text-center text-gray-500">No records found.</td></tr>}
                </tbody>
                {data.length > 0 && (
                  <tfoot className="bg-gray-50 font-bold border-t-2 border-gray-200">
                    <tr>
                      <td colSpan="2" className="px-6 py-4 text-right">TOTAL PT LIABILITY:</td>
                      <td className="px-6 py-4 text-red-700 text-lg">{formatINR(sumPt)}</td>
                      <td className="px-6 py-4"></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            )}

            {activeTab === 'ytd' && (
              <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 font-medium text-gray-500 uppercase">Employee</th>
                    {MONTHS.map(m => <th key={m} className="px-3 py-3 font-medium text-gray-500 uppercase text-center">{m}</th>)}
                    <th className="px-4 py-3 font-bold text-gray-900 uppercase text-right">Annual Total</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {groupedYtd.map((r, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">{r.employeeName}</td>
                      {MONTHS.map((_, mIdx) => (
                        <td key={mIdx} className="px-3 py-3 text-gray-500 text-center border-l border-gray-50">
                          {r.months[mIdx + 1] ? formatINR(r.months[mIdx + 1]) : '-'}
                        </td>
                      ))}
                      <td className="px-4 py-3 font-bold text-brand-700 text-right bg-brand-50/30">
                        {formatINR(r.annualTotal)}
                      </td>
                    </tr>
                  ))}
                  {groupedYtd.length === 0 && <tr><td colSpan="14" className="p-8 text-center text-gray-500">No records found.</td></tr>}
                </tbody>
              </table>
            )}

          </div>

          {/* Export Footer */}
          {((activeTab !== 'ytd' && data.length > 0) || (activeTab === 'ytd' && groupedYtd.length > 0)) && (
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
              <button 
                onClick={exportCSV}
                className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded hover:bg-white transition flex items-center gap-2 text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                Export CSV
              </button>
              <button 
                onClick={exportPDF}
                className="px-4 py-2 bg-brand-600 text-white font-medium rounded hover:bg-brand-700 transition flex items-center gap-2 text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
                Export PDF
              </button>
            </div>
          )}
        </Card>
      )}

    </div>
  );
}
