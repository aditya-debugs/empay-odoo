import { useState, useEffect } from 'react';
import { Download, FileText, Calendar, Users, Briefcase } from 'lucide-react';
import { Card, Button } from '../../../features/ui';
import api from '../../../services/api';

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('attendance');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [department, setDepartment] = useState('');
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  const fetchReport = async () => {
    setLoading(true);
    try {
      let endpoint = '';
      let params = new URLSearchParams();
      
      if (department) params.append('department', department);

      if (activeTab === 'attendance' || activeTab === 'leave') {
        endpoint = `/reports/${activeTab}`;
        // Simple month filtering for demo
        const start = new Date(year, month - 1, 1).toISOString();
        const end = new Date(year, month, 0).toISOString();
        params.append('startDate', start);
        params.append('endDate', end);
      } else if (activeTab === 'payroll') {
        endpoint = `/reports/payroll`;
        params.append('month', month);
        params.append('year', year);
      } else if (activeTab === 'headcount') {
        endpoint = `/reports/headcount`;
      }

      const res = await api.get(`${endpoint}?${params.toString()}`);
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [activeTab, department, month, year]);

  const exportCSV = () => {
    if (!data.length) return;
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(obj => 
      Object.values(obj).map(v => typeof v === 'object' ? JSON.stringify(v) : v).join(',')
    ).join('\n');
    
    const blob = new Blob([headers + '\n' + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeTab}_report_${year}_${month}.csv`;
    a.click();
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">Reports</h1>
          <p className="text-ink-muted">Generate and export system reports</p>
        </div>
        <Button onClick={exportCSV} leftIcon={<Download className="h-4 w-4" />} variant="outline">
          Export CSV
        </Button>
      </div>

      <div className="flex flex-col gap-4 md:flex-row">
        {/* Sidebar Tabs */}
        <Card className="w-full md:w-64 flex-shrink-0 p-2 space-y-1">
          <TabButton active={activeTab === 'attendance'} onClick={() => setActiveTab('attendance')} icon={Calendar} label="Attendance" />
          <TabButton active={activeTab === 'leave'} onClick={() => setActiveTab('leave')} icon={Briefcase} label="Leave Summary" />
          <TabButton active={activeTab === 'payroll'} onClick={() => setActiveTab('payroll')} icon={FileText} label="Payroll & Tax" />
          <TabButton active={activeTab === 'headcount'} onClick={() => setActiveTab('headcount')} icon={Users} label="Headcount" />
        </Card>

        {/* Content Area */}
        <Card className="flex-1 p-6 flex flex-col gap-6 overflow-x-auto">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-4 border-b border-ink-200 pb-4">
            <Select value={department} onChange={(e) => setDepartment(e.target.value)}>
              <option value="">All Departments</option>
              <option value="Engineering">Engineering</option>
              <option value="HR">HR</option>
              <option value="Finance">Finance</option>
            </Select>
            
            {activeTab !== 'headcount' && (
              <>
                <Select value={month} onChange={(e) => setMonth(e.target.value)}>
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>{new Date(0, i).toLocaleString('en', { month: 'long' })}</option>
                  ))}
                </Select>
                <Select value={year} onChange={(e) => setYear(e.target.value)}>
                  {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                </Select>
              </>
            )}
          </div>

          {/* Table */}
          {loading ? (
            <div className="py-12 text-center text-ink-muted">Loading report data...</div>
          ) : data.length === 0 ? (
            <div className="py-12 text-center text-ink-muted">No data found for the selected filters.</div>
          ) : (
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-ink-50 text-ink-500 uppercase">
                <tr>
                  {activeTab === 'attendance' && (
                    <>
                      <th className="px-4 py-3">Employee</th>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Hours</th>
                    </>
                  )}
                  {activeTab === 'leave' && (
                    <>
                      <th className="px-4 py-3">Employee</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Dates</th>
                      <th className="px-4 py-3">Status</th>
                    </>
                  )}
                  {activeTab === 'payroll' && (
                    <>
                      <th className="px-4 py-3">Employee</th>
                      <th className="px-4 py-3">Period</th>
                      <th className="px-4 py-3">Gross</th>
                      <th className="px-4 py-3">Net Pay</th>
                    </>
                  )}
                  {activeTab === 'headcount' && (
                    <>
                      <th className="px-4 py-3">Department</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Count</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {data.map((row, idx) => (
                  <tr key={idx} className="hover:bg-ink-50">
                    {activeTab === 'attendance' && (
                      <>
                        <td className="px-4 py-3 font-medium">{row.employee?.user?.name || '-'}</td>
                        <td className="px-4 py-3">{new Date(row.date).toLocaleDateString()}</td>
                        <td className="px-4 py-3">{row.status}</td>
                        <td className="px-4 py-3">{row.hoursWorked || '-'}</td>
                      </>
                    )}
                    {activeTab === 'leave' && (
                      <>
                        <td className="px-4 py-3 font-medium">{row.employee?.user?.name || '-'}</td>
                        <td className="px-4 py-3">{row.type}</td>
                        <td className="px-4 py-3">{new Date(row.startDate).toLocaleDateString()} - {new Date(row.endDate).toLocaleDateString()}</td>
                        <td className="px-4 py-3">{row.status}</td>
                      </>
                    )}
                    {activeTab === 'payroll' && (
                      <>
                        <td className="px-4 py-3 font-medium">{row.employee?.user?.name || '-'}</td>
                        <td className="px-4 py-3">{row.month}/{row.year}</td>
                        <td className="px-4 py-3">₹{row.grossSalary}</td>
                        <td className="px-4 py-3 font-bold text-primary-600">₹{row.netSalary}</td>
                      </>
                    )}
                    {activeTab === 'headcount' && (
                      <>
                        <td className="px-4 py-3 font-medium">{row.department || 'Unassigned'}</td>
                        <td className="px-4 py-3">{row.status}</td>
                        <td className="px-4 py-3">{row._count?.id || 0}</td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon: Icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
        active ? 'bg-primary-50 text-primary-700' : 'text-ink-600 hover:bg-ink-50'
      }`}
    >
      <Icon className={`h-4 w-4 ${active ? 'text-primary-600' : 'text-ink-400'}`} />
      {label}
    </button>
  );
}

function Select({ value, onChange, children }) {
  return (
    <select
      value={value}
      onChange={onChange}
      className="h-10 rounded-xl border border-ink-200 bg-white px-3 text-sm text-ink outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
    >
      {children}
    </select>
  );
}



