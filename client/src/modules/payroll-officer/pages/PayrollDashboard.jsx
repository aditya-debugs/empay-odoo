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
      navigate('/employee/payslips', { replace: true });
    }
  }, [user, navigate]);

  const fetchDashboard = () => {
    setLoading(true);
    setError(null);
    api.get('/dashboard/payroll')
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
        <div className="h-8 w-64 bg-border rounded animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-border rounded-lg animate-pulse"></div>
          ))}
        </div>
        <div className="h-64 bg-border rounded-lg animate-pulse mt-6"></div>
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
    <div className="px-7 py-8 space-y-7 min-h-screen bg-surface animate-fade-in">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">Payroll Dashboard</h1>
        <p className="mt-0.5 text-sm text-ink-muted">Monitor payroll processing and payslip status.</p>
      </div>

      {/* STAT CARDS ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger">
        <div className="rounded-[14px] border border-border bg-white p-5 shadow-[0_1px_3px_rgba(13,26,19,0.06)] hover:shadow-[0_4px_12px_rgba(13,26,19,0.09)] hover:-translate-y-0.5 transition-all duration-200 animate-fade-up">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success-50 mb-4">
            <span className="text-success-500 font-bold text-sm">✓</span>
          </div>
          <div className="text-[26px] font-bold text-ink leading-none">{data?.totalProcessed || 0}</div>
          <div className="mt-1 text-xs font-medium text-ink-muted">Total Processed</div>
          <span className="mt-2 inline-block px-2 py-0.5 text-[10px] font-semibold bg-success-50 text-success-600 rounded-full uppercase tracking-wide">Processed</span>
        </div>

        <div className="rounded-[14px] border border-border bg-white p-5 shadow-[0_1px_3px_rgba(13,26,19,0.06)] hover:shadow-[0_4px_12px_rgba(13,26,19,0.09)] hover:-translate-y-0.5 transition-all duration-200 animate-fade-up">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warning-50 mb-4">
            <span className="text-warning-500 font-bold text-sm">⏳</span>
          </div>
          <div className="text-[26px] font-bold text-ink leading-none">{data?.totalPending || 0}</div>
          <div className="mt-1 text-xs font-medium text-ink-muted">Total Pending</div>
          <span className="mt-2 inline-block px-2 py-0.5 text-[10px] font-semibold bg-warning-50 text-warning-600 rounded-full uppercase tracking-wide">Pending</span>
        </div>

        <div className="rounded-[14px] border border-border bg-white p-5 shadow-[0_1px_3px_rgba(13,26,19,0.06)] hover:shadow-[0_4px_12px_rgba(13,26,19,0.09)] hover:-translate-y-0.5 transition-all duration-200 animate-fade-up">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-50 mb-4">
            <span className="text-accent-500 font-bold text-sm">₹</span>
          </div>
          <div className="text-[22px] font-bold text-ink leading-none">₹{(data?.totalNetPayout || 0).toLocaleString('en-IN')}</div>
          <div className="mt-1 text-xs font-medium text-ink-muted">Total Net Payout</div>
          <span className="mt-2 inline-block text-[10px] text-ink-soft">This cycle</span>
        </div>

        <div className="rounded-[14px] border border-border bg-white p-5 shadow-[0_1px_3px_rgba(13,26,19,0.06)] hover:shadow-[0_4px_12px_rgba(13,26,19,0.09)] hover:-translate-y-0.5 transition-all duration-200 animate-fade-up">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 mb-4">
            <span className="text-brand-500 font-bold text-sm">M</span>
          </div>
          <div className="text-[14px] font-bold text-ink leading-none">This Month</div>
          <div className="mt-3">
            <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${
              thisMonthStatus === 'PROCESSED' ? 'bg-success-50 text-success-600' :
              thisMonthStatus === 'LOCKED' ? 'bg-surface-muted text-ink-muted' :
              'bg-warning-50 text-warning-600'
            }`}>
              {thisMonthStatus}
            </span>
          </div>
        </div>
      </div>

      {/* CHART */}
      <div className="rounded-[14px] border border-border bg-white p-6 shadow-[0_1px_3px_rgba(13,26,19,0.06)]">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-[14px] font-semibold text-ink">Monthly Payroll Overview</h2>
            <p className="text-xs text-ink-muted mt-0.5">Processed vs Pending over time</p>
          </div>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8E5" />
              <XAxis dataKey="displayMonth" axisLine={false} tickLine={false} tick={{ fill: '#8EA09A', fontSize: 11, fontFamily: 'Inter' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#8EA09A', fontSize: 11, fontFamily: 'Inter' }} />
              <Tooltip
                cursor={{ fill: '#EFF2F0' }}
                contentStyle={{
                  borderRadius: '10px', border: '1px solid #E2E8E5',
                  boxShadow: '0 4px 12px rgba(13,26,19,0.08)',
                  fontFamily: 'Inter', fontSize: '12px',
                }}
              />
              <Legend wrapperStyle={{ paddingTop: '16px', fontSize: '12px', fontFamily: 'Inter' }} />
              <Bar dataKey="Processed" fill="#0F4C3A" radius={[4, 4, 0, 0]} barSize={28} />
              <Bar dataKey="Pending" fill="#F0971A" radius={[4, 4, 0, 0]} barSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* DISPUTES WIDGET */}
      <div className="rounded-[14px] border border-border bg-white shadow-[0_1px_3px_rgba(13,26,19,0.06)] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <h2 className="text-[14px] font-semibold text-ink">Open Disputes</h2>
            {data?.openDisputesCount > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-danger-500 px-1.5 text-[10px] font-bold text-white">
                {data.openDisputesCount}
              </span>
            )}
          </div>
          <Link to="/payroll/disputes" className="text-xs font-semibold text-brand-500 hover:text-brand-700 transition-colors">
            View All →
          </Link>
        </div>

        {data?.recentDisputes && data.recentDisputes.length > 0 ? (
          <div className="divide-y divide-border">
            {data.recentDisputes.map(dispute => {
              const name = `${dispute.payslip?.employee?.firstName || 'Unknown'} ${dispute.payslip?.employee?.lastName || ''}`.trim();
              const period = `${dispute.payslip?.month}/${dispute.payslip?.year}`;
              return (
                <div key={dispute.id} className="flex items-start justify-between gap-4 px-6 py-4 hover:bg-surface-muted/30 transition-colors">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink">
                      {name} <span className="text-xs font-normal text-ink-soft">({period})</span>
                    </p>
                    <p className="text-xs text-ink-muted mt-0.5 line-clamp-1">{dispute.reason}</p>
                  </div>
                  <span className="shrink-0 text-[10px] font-bold px-2 py-1 bg-danger-50 text-danger-500 rounded-md uppercase">OPEN</span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-10 text-center">
            <p className="text-sm font-medium text-ink-muted">No open disputes</p>
            <p className="text-xs text-ink-soft mt-0.5">All clear!</p>
          </div>
        )}
      </div>
    </div>
  );
}



