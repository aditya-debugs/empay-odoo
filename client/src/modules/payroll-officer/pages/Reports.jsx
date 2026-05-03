import { useState, useEffect } from 'react';
import { Card, Input } from '../../../features/ui';
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

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function Reports() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('payroll');
  const [month, setMonth] = useState(() => new Date().toISOString().substring(0, 10));
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

  useEffect(() => {
    fetchReport();
  }, [activeTab, month, year]);

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
    if (!data) return;
    const doc = new jsPDF('l', 'mm', 'a4'); // Landscape for reports
    const title = TABS.find(t => t.id === activeTab)?.label || 'Report';
    const period = activeTab === 'ytd' ? `Year: ${year}` : `Month: ${month}`;

    doc.setFontSize(20);
    doc.text('EmPay — ' + title, 14, 15);
    doc.setFontSize(10);
    doc.text(period, 14, 22);

    let head = [];
    let body = [];

    const fmtPDF = (val) => 'Rs. ' + Number(val).toLocaleString('en-IN', { maximumFractionDigits: 0 });

    if (activeTab === 'payroll') {
      head = [['Employee', 'Basic', 'Gross', 'Deductions', 'Net', 'Status']];
      body = data.map(r => [
        `${r.employee?.firstName} ${r.employee?.lastName}`,
        fmtPDF(r.basicSalary),
        fmtPDF(r.grossSalary),
        fmtPDF(r.totalDeductions),
        fmtPDF(r.netSalary),
        r.status
      ]);
    } else if (activeTab === 'pf') {
      head = [['Employee', 'Gross Salary', 'PF Deduction', 'Status']];
      body = data.map(r => [
        `${r.employee?.firstName} ${r.employee?.lastName}`,
        fmtPDF(r.grossSalary),
        fmtPDF(r.pfDeduction),
        r.status
      ]);
    } else if (activeTab === 'prof-tax') {
      head = [['Employee', 'Gross Salary', 'Prof. Tax', 'Status']];
      body = data.map(r => [
        `${r.employee?.firstName} ${r.employee?.lastName}`,
        fmtPDF(r.grossSalary),
        fmtPDF(r.professionalTax),
        r.status
      ]);
    } else if (activeTab === 'ytd') {
      head = [['Employee', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Total']];
      body = groupedYtd.map(row => [
        row.employeeName,
        ...[1,2,3,4,5,6,7,8,9,10,11,12].map(m => row.months[m] ? fmtPDF(row.months[m]) : '-'),
        fmtPDF(row.annualTotal)
      ]);
    }

    autoTable(doc, {
      startY: 30,
      head: head,
      body: body,
      theme: 'grid',
      headStyles: { fillColor: [15, 76, 58], fontSize: 8 },
      bodyStyles: { fontSize: 8 }
    });

    doc.save(`${activeTab}_report_${activeTab === 'ytd' ? year : month}.pdf`);
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
        <h1 className="text-3xl font-semibold tracking-tight text-ink">Payroll Reports</h1>
        <p className="mt-1 text-sm text-ink-muted">Generate and export statutory and compliance reports</p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 border-b border-border">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id 
                ? 'border-brand-600 text-brand-600' 
                : 'border-transparent text-ink-muted hover:text-ink-muted hover:border-border-strong'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Shared Filters */}
      <Card className="p-6 bg-surface-muted border border-border">
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          {activeTab === 'ytd' ? (
            <>
              <div className="flex flex-col">
                <label className="text-xs font-semibold text-ink-muted mb-1 uppercase">Select Year</label>
                <input 
                  type="number" 
                  value={year}
                  onChange={e => setYear(e.target.value)}
                  className="border border-border-strong rounded px-3 py-2 outline-none focus:border-brand-500"
                />
              </div>
              <div className="flex flex-col flex-1 max-w-xs">
                <label className="text-xs font-semibold text-ink-muted mb-1 uppercase">Employee ID (Optional)</label>
                <input 
                  type="text" 
                  value={employeeId}
                  onChange={e => setEmployeeId(e.target.value)}
                  placeholder="e.g. EMP-1234"
                  className="border border-border-strong rounded px-3 py-2 outline-none focus:border-brand-500"
                />
              </div>
            </>
          ) : (
            <div className="flex flex-col">
              <label className="text-xs font-semibold text-ink-muted mb-1 uppercase">Select Month</label>
              <input 
                type="month" 
                value={month}
                onChange={e => setMonth(e.target.value)}
                className="border border-border-strong rounded px-3 py-2 outline-none focus:border-brand-500"
              />
            </div>
          )}
          
          <button 
            onClick={fetchReport}
            disabled={loading}
            className="px-6 py-2 bg-ink text-white rounded font-medium hover:bg-ink transition disabled:opacity-50"
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
                <thead className="bg-surface-muted">
                  <tr>
                    <th className="px-6 py-3 text-xs font-medium text-ink-muted uppercase">Employee</th>
                    <th className="px-6 py-3 text-xs font-medium text-ink-muted uppercase">Basic</th>
                    <th className="px-6 py-3 text-xs font-medium text-ink-muted uppercase">Gross</th>
                    <th className="px-6 py-3 text-xs font-medium text-ink-muted uppercase">Total Deductions</th>
                    <th className="px-6 py-3 text-xs font-medium text-ink-muted uppercase">Net</th>
                    <th className="px-6 py-3 text-xs font-medium text-ink-muted uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.map(r => (
                    <tr key={r.id} className="hover:bg-surface-muted">
                      <td className="px-6 py-3 text-sm font-medium text-ink">{r.employee?.firstName} {r.employee?.lastName}</td>
                      <td className="px-6 py-3 text-sm text-ink-muted">{formatINR(r.basicSalary)}</td>
                      <td className="px-6 py-3 text-sm text-ink-muted">{formatINR(r.grossSalary)}</td>
                      <td className="px-6 py-3 text-sm text-ink-muted">{formatINR(r.totalDeductions)}</td>
                      <td className="px-6 py-3 text-sm font-bold text-ink">{formatINR(r.netSalary)}</td>
                      <td className="px-6 py-3 text-sm"><span className="bg-surface-muted text-ink px-2 py-0.5 rounded text-xs">{r.status}</span></td>
                    </tr>
                  ))}
                  {data.length === 0 && <tr><td colSpan="6" className="p-8 text-center text-ink-muted">No records found.</td></tr>}
                </tbody>
                {data.length > 0 && (
                  <tfoot className="bg-surface-muted font-bold border-t-2 border-border">
                    <tr>
                      <td className="px-6 py-4">TOTAL</td>
                      <td className="px-6 py-4">-</td>
                      <td className="px-6 py-4 text-ink">{formatINR(sumGross)}</td>
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
                <thead className="bg-surface-muted">
                  <tr>
                    <th className="px-6 py-3 text-xs font-medium text-ink-muted uppercase">Employee</th>
                    <th className="px-6 py-3 text-xs font-medium text-ink-muted uppercase">Basic Salary</th>
                    <th className="px-6 py-3 text-xs font-medium text-ink-muted uppercase">PF (12%)</th>
                    <th className="px-6 py-3 text-xs font-medium text-ink-muted uppercase">Month</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.map((r, i) => (
                    <tr key={i} className="hover:bg-surface-muted">
                      <td className="px-6 py-3 text-sm font-medium text-ink">{r.employee?.firstName} {r.employee?.lastName}</td>
                      <td className="px-6 py-3 text-sm text-ink-muted">{formatINR(r.basicSalary)}</td>
                      <td className="px-6 py-3 text-sm text-red-600 font-medium">{formatINR(r.pfDeduction)}</td>
                      <td className="px-6 py-3 text-sm text-ink-muted">{r.month}</td>
                    </tr>
                  ))}
                  {data.length === 0 && <tr><td colSpan="4" className="p-8 text-center text-ink-muted">No records found.</td></tr>}
                </tbody>
                {data.length > 0 && (
                  <tfoot className="bg-surface-muted font-bold border-t-2 border-border">
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
                <thead className="bg-surface-muted">
                  <tr>
                    <th className="px-6 py-3 text-xs font-medium text-ink-muted uppercase">Employee</th>
                    <th className="px-6 py-3 text-xs font-medium text-ink-muted uppercase">Gross Salary</th>
                    <th className="px-6 py-3 text-xs font-medium text-ink-muted uppercase">PT Amount</th>
                    <th className="px-6 py-3 text-xs font-medium text-ink-muted uppercase">Month</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.map((r, i) => (
                    <tr key={i} className="hover:bg-surface-muted">
                      <td className="px-6 py-3 text-sm font-medium text-ink">{r.employee?.firstName} {r.employee?.lastName}</td>
                      <td className="px-6 py-3 text-sm text-ink-muted">{formatINR(r.grossSalary)}</td>
                      <td className="px-6 py-3 text-sm text-red-600 font-medium">{formatINR(r.professionalTax)}</td>
                      <td className="px-6 py-3 text-sm text-ink-muted">{r.month}</td>
                    </tr>
                  ))}
                  {data.length === 0 && <tr><td colSpan="4" className="p-8 text-center text-ink-muted">No records found.</td></tr>}
                </tbody>
                {data.length > 0 && (
                  <tfoot className="bg-surface-muted font-bold border-t-2 border-border">
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
                <thead className="bg-surface-muted">
                  <tr>
                    <th className="px-4 py-3 font-medium text-ink-muted uppercase">Employee</th>
                    {MONTHS.map(m => <th key={m} className="px-3 py-3 font-medium text-ink-muted uppercase text-center">{m}</th>)}
                    <th className="px-4 py-3 font-bold text-ink uppercase text-right">Annual Total</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {groupedYtd.map((r, i) => (
                    <tr key={i} className="hover:bg-surface-muted">
                      <td className="px-4 py-3 font-medium text-ink whitespace-nowrap">{r.employeeName}</td>
                      {MONTHS.map((_, mIdx) => (
                        <td key={mIdx} className="px-3 py-3 text-ink-muted text-center border-l border-border">
                          {r.months[mIdx + 1] ? formatINR(r.months[mIdx + 1]) : '-'}
                        </td>
                      ))}
                      <td className="px-4 py-3 font-bold text-brand-700 text-right bg-brand-50/30">
                        {formatINR(r.annualTotal)}
                      </td>
                    </tr>
                  ))}
                  {groupedYtd.length === 0 && <tr><td colSpan="14" className="p-8 text-center text-ink-muted">No records found.</td></tr>}
                </tbody>
              </table>
            )}

          </div>

          {/* Export Footer */}
          {((activeTab !== 'ytd' && data.length > 0) || (activeTab === 'ytd' && groupedYtd.length > 0)) && (
            <div className="px-6 py-4 bg-surface-muted border-t border-border flex justify-end gap-3">
              <button 
                onClick={exportCSV}
                className="px-4 py-2 border border-border-strong text-ink-muted font-medium rounded hover:bg-white transition flex items-center gap-2 text-sm"
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



