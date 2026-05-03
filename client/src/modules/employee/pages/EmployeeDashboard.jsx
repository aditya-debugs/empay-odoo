import { useEffect, useState } from 'react';
import { useAuth } from '../../../features/auth/AuthContext';
import { Card, Button, Avatar } from '../../../features/ui';
import { Calendar, Clock, FileText, ArrowRight, TrendingUp } from 'lucide-react';
import api from '../../../services/api';

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const data = await api.get('/dashboard/employee');
        setDashboard(data);
      } catch (err) {
        setError(err.message || 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="p-8 space-y-6 animate-pulse">
        <div className="h-24 rounded-2xl bg-surface-muted" />
        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-24 rounded-[14px] bg-surface-muted" />)}
        </div>
      </div>
    );
  }
  if (error) return <div className="p-8 text-danger-700 bg-danger-50 rounded-xl m-8 border border-danger-100">{error}</div>;

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const metrics = [
    {
      label: 'Days Present', value: dashboard?.attendance?.present || 0, unit: 'days',
      icon: Clock, iconBg: 'bg-success-50', iconColor: 'text-success-500',
    },
    {
      label: 'Days Absent', value: dashboard?.attendance?.absent || 0, unit: 'days',
      icon: Calendar, iconBg: 'bg-danger-50', iconColor: 'text-danger-500',
    },
    {
      label: 'Hours Logged', value: dashboard?.attendance?.totalHours || '0.0', unit: 'hrs',
      icon: TrendingUp, iconBg: 'bg-accent-50', iconColor: 'text-accent-500',
    },
  ];

  return (
    <div className="min-h-screen bg-surface">
      {/* Hero greeting banner */}
      <div className="relative overflow-hidden px-7 py-8" style={{ background: 'linear-gradient(135deg, #0F4C3A 0%, #0A3228 60%, #09302A 100%)' }}>
        <div className="absolute right-0 top-0 h-full w-1/3 opacity-10">
          <div className="absolute right-16 top-4 h-32 w-32 rounded-full border-2 border-white/30" />
          <div className="absolute right-0 top-8 h-48 w-48 rounded-full border border-white/20" />
          <div className="absolute -right-8 top-0 h-64 w-64 rounded-full border border-white/10" />
        </div>
        <div className="relative flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-white/50 uppercase tracking-widest">{greeting()},</p>
            <h1 className="mt-1 text-2xl font-bold text-white tracking-tight">{user?.name}</h1>
            <p className="mt-1 text-xs text-white/40 font-medium">
              {dashboard?.attendance?.month || new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
            </p>
          </div>
          <Avatar name={user?.name} size="xl" className="ring-2 ring-white/20 ring-offset-2 ring-offset-brand-600" />
        </div>
      </div>

      <div className="px-7 -mt-4 pb-10 space-y-6">
        {/* Metric cards */}
        <div className="grid grid-cols-3 gap-4 stagger">
          {metrics.map((m) => (
            <div key={m.label} className="rounded-[14px] border border-border bg-white p-4 shadow-[0_1px_3px_rgba(13,26,19,0.06)] hover:shadow-[0_4px_12px_rgba(13,26,19,0.09)] hover:-translate-y-0.5 transition-all duration-200 animate-fade-up">
              <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${m.iconBg} mb-3`}>
                <m.icon className={`h-4 w-4 ${m.iconColor}`} />
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-bold text-ink leading-none">{m.value}</span>
                {m.unit && <span className="text-[10px] text-ink-soft">{m.unit}</span>}
              </div>
              <div className="mt-0.5 text-xs text-ink-muted font-medium">{m.label}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Leave Balances */}
          <div className="lg:col-span-2">
            <Card className="overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                <div>
                  <h2 className="text-[14px] font-semibold text-ink">Leave Entitlements</h2>
                  <p className="text-xs text-ink-muted mt-0.5">Current balance overview</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  rightIcon={<ArrowRight className="h-3 w-3" />}
                  onClick={() => window.location.href = '/employee/leaves'}
                >
                  View all
                </Button>
              </div>
              <div className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
                {dashboard?.leaves?.map((leave) => {
                  const pct = leave.total > 0 ? Math.round((leave.used / leave.total) * 100) : 0;
                  return (
                    <div key={leave.type} className="rounded-xl border border-border p-4 hover:border-brand-200 hover:bg-brand-50/20 transition-all">
                      <div className="text-[10px] font-bold text-ink-soft uppercase tracking-widest mb-3">
                        {leave.type.replace(/_/g, ' ')}
                      </div>
                      <div className="flex items-end justify-between mb-2">
                        <div>
                          <div className="text-2xl font-bold text-ink leading-none">{leave.available}</div>
                          <div className="text-[10px] text-ink-soft mt-0.5">Available</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-semibold text-ink-muted">{leave.used}</div>
                          <div className="text-[10px] text-ink-soft">Used</div>
                        </div>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-surface-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-500 transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="mt-1 text-[10px] text-ink-soft text-right">{pct}% utilized</div>
                    </div>
                  );
                })}
                {!dashboard?.leaves?.length && (
                  <div className="col-span-3 py-8 text-center text-sm text-ink-soft">No leave data available</div>
                )}
              </div>
            </Card>
          </div>

          {/* Latest Payslip */}
          <div>
            <Card className="overflow-hidden h-full">
              <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                <div>
                  <h2 className="text-[14px] font-semibold text-ink">Latest Payslip</h2>
                  <p className="text-xs text-ink-muted mt-0.5">Most recent record</p>
                </div>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-success-50">
                  <FileText className="h-4 w-4 text-success-500" />
                </div>
              </div>

              <div className="p-5">
                {dashboard?.lastPayslip ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-ink-muted">Period</span>
                      <span className="text-xs font-semibold text-ink">
                        {dashboard.lastPayslip.month}/{dashboard.lastPayslip.year}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-ink-muted">Status</span>
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-success-50 text-success-600 uppercase">
                        {dashboard.lastPayslip.status}
                      </span>
                    </div>
                    <div className="mt-4 rounded-xl bg-surface-muted p-4">
                      <p className="text-xs text-ink-muted mb-1">Net Salary</p>
                      <p className="text-2xl font-bold text-ink">
                        ₹{dashboard.lastPayslip.netSalary?.toLocaleString('en-IN')}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => window.location.href = '/employee/payslips'}
                    >
                      View Payslips
                    </Button>
                  </div>
                ) : (
                  <div className="py-10 text-center">
                    <div className="h-10 w-10 rounded-xl bg-surface-muted flex items-center justify-center mx-auto mb-3">
                      <FileText className="h-5 w-5 text-ink-soft" />
                    </div>
                    <p className="text-sm text-ink-muted">No payslips yet</p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}



