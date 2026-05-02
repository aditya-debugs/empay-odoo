import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from 'recharts';
import { useAuth } from '../../../features/auth/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../../../services/api';

export default function PayrollDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user?.role === 'EMPLOYEE') {
      navigate('/payroll/payslips', { replace: true });
    } else if (user?.role === 'HR_OFFICER') {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const fetchDashboard = () => {
    setLoading(true);
    setError(null);
    api.get('/payroll/dashboard')
      .then(res => {
        setData(res);
      })
      .catch(err => {
        setError(err.message || 'Failed to load dashboard.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="px-8 py-8 space-y-6">
        <div className="h-8 w-64 bg-gray-200 rounded animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded-lg animate-pulse"></div>
          ))}
        </div>
        <div className="h-64 bg-gray-200 rounded-lg animate-pulse mt-6"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-8 py-8">
        <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-100 mb-4">
          {error}
        </div>
        <button 
          onClick={fetchDashboard}
          className="px-4 py-2 bg-brand-600 text-white rounded-md hover:bg-brand-700 transition"
        >
          Retry
        </button>
      </div>
    );
  }

  // Determine "This Month" status logically
  let thisMonthStatus = 'PENDING';
  if (data?.totalPending === 0 && data?.totalProcessed > 0) thisMonthStatus = 'PROCESSED';
  if (data?.totalProcessed === 0 && data?.totalPending === 0) thisMonthStatus = 'PENDING';

  // Format month strings for chart (e.g. "2024-05" -> "May")
  const chartData = data?.monthlyTrend?.map(d => {
    const [year, month] = d.month.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return {
      ...d,
      displayMonth: date.toLocaleString('default', { month: 'short' })
    };
  }) || [];

  return (
    <div className="px-8 py-8 animate-fade-in space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-semibold tracking-tight text-gray-900">Payroll Dashboard</h1>
      </div>

      {/* STAT CARDS ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-100 rounded-lg shadow-sm p-5 flex flex-col justify-between">
          <h3 className="text-sm font-medium text-gray-500">Total Processed</h3>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-3xl font-bold text-gray-900">{data?.totalProcessed || 0}</span>
            <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 rounded-full">Processed</span>
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-lg shadow-sm p-5 flex flex-col justify-between">
          <h3 className="text-sm font-medium text-gray-500">Total Pending</h3>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-3xl font-bold text-gray-900">{data?.totalPending || 0}</span>
            <span className="px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-800 rounded-full">Pending</span>
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-lg shadow-sm p-5 flex flex-col justify-between">
          <h3 className="text-sm font-medium text-gray-500">Total Net Payout</h3>
          <p className="mt-2 text-2xl font-bold text-gray-900">
            ₹{(data?.totalNetPayout || 0).toLocaleString('en-IN')}
          </p>
        </div>

        <div className="bg-white border border-gray-100 rounded-lg shadow-sm p-5 flex flex-col justify-between">
          <h3 className="text-sm font-medium text-gray-500">This Month</h3>
          <div className="mt-2">
            <span className={`px-3 py-1 text-sm font-semibold rounded-full ${
              thisMonthStatus === 'PROCESSED' ? 'bg-green-100 text-green-800' : 
              thisMonthStatus === 'LOCKED' ? 'bg-gray-100 text-gray-800' : 'bg-amber-100 text-amber-800'
            }`}>
              {thisMonthStatus}
            </span>
          </div>
        </div>
      </div>

      {/* CHART */}
      <div className="bg-white border border-gray-100 rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-6">Monthly Payroll Overview</h2>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              <XAxis dataKey="displayMonth" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
              <Tooltip 
                cursor={{ fill: '#f3f4f6' }}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              <Bar dataKey="Processed" fill="#10b981" radius={[4, 4, 0, 0]} barSize={32} />
              <Bar dataKey="Pending" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* DISPUTES WIDGET */}
      <div className="bg-white border border-gray-100 rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-medium text-gray-900">Open Disputes</h2>
            {data?.openDisputesCount > 0 && (
              <span className="bg-red-100 text-red-700 px-2.5 py-0.5 rounded-full text-xs font-bold">
                {data.openDisputesCount}
              </span>
            )}
          </div>
          <Link to="/payroll/disputes" className="text-sm font-medium text-brand-600 hover:text-brand-800 transition">
            View All &rarr;
          </Link>
        </div>

        {data?.recentDisputes && data.recentDisputes.length > 0 ? (
          <div className="space-y-3">
            {data.recentDisputes.map(dispute => {
              const name = `${dispute.payslip?.employee?.firstName || 'Unknown'} ${dispute.payslip?.employee?.lastName || ''}`.trim();
              const period = `${dispute.payslip?.month}/${dispute.payslip?.year}`;
              return (
                <div key={dispute.id} className="flex justify-between items-start p-3 hover:bg-gray-50 rounded-lg border border-gray-50 transition">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{name} <span className="text-gray-400 font-normal">({period})</span></p>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-1 max-w-md">{dispute.reason}</p>
                  </div>
                  <span className="text-xs font-semibold px-2 py-1 bg-red-50 text-red-600 rounded">OPEN</span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-sm text-gray-500">No open disputes currently.</p>
          </div>
        )}
      </div>
    </div>
  );
}
