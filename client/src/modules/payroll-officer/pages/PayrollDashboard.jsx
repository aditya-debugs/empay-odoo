import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useAuth } from '../../../features/auth/AuthContext';
import api from '../../../services/api';

export default function PayrollDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [costView, setCostView] = useState('monthly'); // 'monthly' or 'annually'
  const [countView, setCountView] = useState('monthly'); // 'monthly' or 'annually'

  const fmt = n => '₹' + Number(n).toLocaleString('en-IN', { minimumFractionDigits: 0 });
  const fmtMonth = m => {
    if (!m) return '';
    const parts = m.split('-');
    if (parts.length < 2) return m;
    const d = new Date(parts[0], parts[1] - 1);
    return d.toLocaleString('default', { month: 'short', year: 'numeric' });
  };
  const fmtCompact = n => '₹' + (n >= 1000 ? (n / 1000).toFixed(0) + 'K' : n);

  const fetchDashboard = () => {
    setLoading(true);
    setError(null);
    api.get('/dashboard')
      .then(res => {
        setData(res);
      })
      .catch(err => {
        console.error('Dashboard fetch error:', err);
        setError(err.message || 'Failed to load dashboard.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (user?.role === 'EMPLOYEE') {
      navigate('/employee/payslips', { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="px-8 py-8 grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-100 h-80">
            <div className="h-10 bg-gray-100 rounded-t-lg"></div>
            <div className="p-6 space-y-4">
              <div className="h-4 bg-gray-50 w-3/4 rounded"></div>
              <div className="h-4 bg-gray-50 w-1/2 rounded"></div>
              <div className="h-32 bg-gray-50 rounded mt-4"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-8 py-8">
        <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-100 mb-4 flex items-center justify-between">
          <span>Failed to load dashboard: {error}</span>
          <button 
            onClick={fetchDashboard}
            className="px-4 py-1.5 bg-red-600 text-white text-sm font-medium rounded hover:bg-red-700 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const filteredCostData = (data?.employerCostData || []).slice(costView === 'monthly' ? -3 : -6);
  const filteredCountData = (data?.employeeCountData || []).slice(countView === 'monthly' ? -3 : -6);

  const hasWarnings = data?.warnings?.employeesWithoutBank > 0 || data?.warnings?.employeesWithoutManager > 0;

  return (
    <div className="px-8 py-8 animate-fade-in space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* TOP-LEFT — WARNINGS CARD */}
        <div className="bg-white border border-gray-100 rounded-lg shadow-sm overflow-hidden h-full flex flex-col">
          <div className="bg-amber-50 border-b border-amber-100 px-6 py-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-amber-800">Warning</h2>
          </div>
          <div className="p-6 flex-grow flex flex-col justify-center">
            {hasWarnings ? (
              <div className="space-y-4">
                {data.warnings.employeesWithoutBank > 0 && (
                  <Link to="/payroll/employees" className="block text-amber-600 font-medium hover:underline">
                    ⚠ {data.warnings.employeesWithoutBank} Employee without Bank A/c
                  </Link>
                )}
                {data.warnings.employeesWithoutManager > 0 && (
                  <Link to="/payroll/employees" className="block text-amber-600 font-medium hover:underline">
                    ⚠ {data.warnings.employeesWithoutManager} Employee without Manager
                  </Link>
                )}
              </div>
            ) : (
              <p className="text-green-600 font-medium flex items-center gap-2">
                <span className="text-xl">✓</span> No warnings
              </p>
            )}
          </div>
        </div>

        {/* TOP-RIGHT — DISPUTES CARD */}
        <div className="bg-white border border-gray-100 rounded-lg shadow-sm overflow-hidden h-full flex flex-col">
          <div className="border-b border-gray-50 px-6 py-3 bg-red-50">
            <h2 className="text-sm font-bold uppercase tracking-wider text-red-800">Disputes</h2>
          </div>
          <div className="p-6 flex-grow">
            <div className="space-y-3">
              {data?.payruns && data.payruns.length > 0 ? (
                data.payruns.map((p, idx) => (
                  <Link 
                    key={idx} 
                    to={`/payroll/disputes?month=${p.month}`}
                    className="block p-3 rounded-lg bg-gray-50 border border-gray-100 text-gray-800 hover:bg-gray-100 transition font-medium"
                  >
                    <div className="flex justify-between items-center">
                      <span>Disputes for {fmtMonth(p.month)}</span>
                      <div className="flex gap-2">
                        {p.disputeCount > 0 ? (
                          <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded-full font-bold">{p.disputeCount} Open Disputes</span>
                        ) : (
                          <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-bold">✓ Clear</span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <p className="text-gray-500 text-sm">No disputes found.</p>
              )}
            </div>
          </div>
        </div>

        {/* BOTTOM-LEFT — EMPLOYER COST CHART */}
        <div className="bg-white border border-gray-100 rounded-lg shadow-sm p-6 flex flex-col h-96">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-medium text-gray-900">Employer cost</h2>
            <div className="flex items-center bg-gray-50 rounded-lg p-1 text-xs">
              <button 
                onClick={() => setCostView('annually')}
                className={`px-3 py-1 rounded-md transition ${costView === 'annually' ? 'bg-white shadow-sm text-gray-900 font-semibold' : 'text-gray-500'}`}
              >
                Annually
              </button>
              <button 
                onClick={() => setCostView('monthly')}
                className={`px-3 py-1 rounded-md transition ${costView === 'monthly' ? 'bg-white shadow-sm text-gray-900 font-semibold' : 'text-gray-500'}`}
              >
                Monthly
              </button>
            </div>
          </div>
          <div className="flex-grow h-0">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} debounce={50}>
              <BarChart data={filteredCostData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis 
                  dataKey="month" 
                  tickFormatter={fmtMonth} 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#6b7280', fontSize: 11 }} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tickFormatter={fmtCompact}
                  tick={{ fill: '#6b7280', fontSize: 11 }} 
                />
                <Tooltip 
                  cursor={{ fill: '#f9fafb' }}
                  labelFormatter={fmtMonth}
                  formatter={(val) => [fmt(val), 'Cost']}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="amount" fill="#7EC8E3" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* BOTTOM-RIGHT — EMPLOYEE COUNT CHART */}
        <div className="bg-white border border-gray-100 rounded-lg shadow-sm p-6 flex flex-col h-96">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-medium text-gray-900">Employee Count</h2>
            <div className="flex items-center bg-gray-50 rounded-lg p-1 text-xs">
              <button 
                onClick={() => setCountView('annually')}
                className={`px-3 py-1 rounded-md transition ${countView === 'annually' ? 'bg-white shadow-sm text-gray-900 font-semibold' : 'text-gray-500'}`}
              >
                Annually
              </button>
              <button 
                onClick={() => setCountView('monthly')}
                className={`px-3 py-1 rounded-md transition ${countView === 'monthly' ? 'bg-white shadow-sm text-gray-900 font-semibold' : 'text-gray-500'}`}
              >
                Monthly
              </button>
            </div>
          </div>
          <div className="flex-grow h-0">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} debounce={50}>
              <BarChart data={filteredCountData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis 
                  dataKey="month" 
                  tickFormatter={fmtMonth} 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#6b7280', fontSize: 11 }} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#6b7280', fontSize: 11 }} 
                />
                <Tooltip 
                  cursor={{ fill: '#f9fafb' }}
                  labelFormatter={fmtMonth}
                  formatter={(val) => [val, 'Employees']}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="count" fill="#A8D8EA" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}
