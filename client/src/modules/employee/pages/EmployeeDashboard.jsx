import { useEffect, useState } from 'react';
import { useAuth } from '../../../features/auth/AuthContext';
import { Card, Button } from '../../../features/ui';
import { Calendar, Clock, Users, User, ArrowUpRight } from 'lucide-react';
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

  if (loading) return <div className="flex h-screen items-center justify-center text-ink-muted">Loading System...</div>;
  if (error) return <div className="p-8 text-danger-700 bg-danger-50 rounded-xl m-8 border border-danger-100">{error}</div>;

  return (
    <div className="min-h-screen bg-surface-muted/30">
      {/* Refined Header - Professional Sizing */}
      <div className="bg-brand-600 px-8 py-10 text-white">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Bonjour, {user?.name}</h1>
            <p className="mt-1 text-xs font-medium text-brand-100 uppercase tracking-widest opacity-90">
              Overview Portal • {dashboard?.attendance?.month || 'Current Month'}
            </p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
             <User className="h-5 w-5 text-white" />
          </div>
        </div>
      </div>

      <div className="px-8 -mt-6 pb-12 max-w-7xl mx-auto space-y-6">
        {/* Core Metrics Grid - Normal Font Sizes */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* Attendance Widget */}
          <Card className="p-5 border-none shadow-sm hover:shadow-md transition-all group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-ink-soft">Active Presence</p>
                <div className="flex items-baseline gap-1 mt-1">
                  <p className="text-xl font-bold text-ink">{dashboard?.attendance?.present || 0}</p>
                  <p className="text-[10px] text-ink-soft">Days</p>
                </div>
              </div>
              <div className="p-2.5 bg-brand-50 rounded-lg group-hover:scale-110 transition-transform">
                <Clock className="h-5 w-5 text-brand-600" />
              </div>
            </div>
          </Card>

          {/* Absent Days Widget */}
          <Card className="p-5 border-none shadow-sm hover:shadow-md transition-all group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-ink-soft">Recorded Absence</p>
                <div className="flex items-baseline gap-1 mt-1">
                  <p className="text-xl font-bold text-ink">{dashboard?.attendance?.absent || 0}</p>
                  <p className="text-[10px] text-ink-soft">Days</p>
                </div>
              </div>
              <div className="p-2.5 bg-danger-50 rounded-lg group-hover:scale-110 transition-transform">
                <Calendar className="h-5 w-5 text-danger-600" />
              </div>
            </div>
          </Card>

          {/* Total Hours Widget */}
          <Card className="p-5 border-none shadow-sm hover:shadow-md transition-all group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-ink-soft">Work Efficiency</p>
                <div className="flex items-baseline gap-1 mt-1">
                  <p className="text-xl font-bold text-ink">{dashboard?.attendance?.totalHours || '0.0'}</p>
                  <p className="text-[10px] text-ink-soft">Hours Logged</p>
                </div>
              </div>
              <div className="p-2.5 bg-success-50 rounded-lg group-hover:scale-110 transition-transform">
                <Zap className="h-5 w-5 text-success-600" />
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Leave Balances - Left 2 Columns */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-widest text-ink-soft">Leave Entitlements</h2>
              <Button variant="ghost" size="sm" className="text-[10px] h-7" onClick={() => window.location.href='/employee/leaves'}>View Full Schedule</Button>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {dashboard?.leaves?.map((leave) => (
                <Card key={leave.type} className="p-4 border-none shadow-sm bg-white hover:ring-1 hover:ring-brand-500/20 transition-all">
                  <p className="text-[10px] font-bold text-ink-muted uppercase border-b border-border pb-2 mb-3">{leave.type.replace('_', ' ')}</p>
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-[10px] text-ink-soft">Available</p>
                      <p className="text-lg font-bold text-ink">{leave.available}</p>
                    </div>
                    <div className="text-right">
                       <p className="text-[10px] text-ink-soft">Utilized: {leave.used}</p>
                       <div className="w-16 h-1 bg-surface-muted rounded-full mt-1">
                          <div className="h-full bg-brand-500 rounded-full" style={{ width: `${(leave.used / leave.total) * 100}%` }} />
                       </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Last Transaction Info - Right Column */}
          <div className="space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-widest text-ink-soft">Latest Records</h2>
            <Card className="p-5 border-none shadow-sm bg-white divide-y divide-border">
              {dashboard?.lastPayslip ? (
                <div className="pb-4">
                  <div className="flex justify-between items-start mb-4">
                    <p className="text-xs font-bold text-ink">Recent Payslip</p>
                    <span className="px-2 py-0.5 bg-success-50 text-success-600 text-[9px] font-bold rounded-full uppercase tracking-tighter">Verified</span>
                  </div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-ink-soft">Period</span>
                    <span className="font-bold text-ink">{dashboard.lastPayslip.month}/{dashboard.lastPayslip.year}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-ink-soft">Status</span>
                    <span className="font-bold text-brand-600 uppercase text-[10px]">{dashboard.lastPayslip.status}</span>
                  </div>
                </div>
              ) : (
                <div className="pb-4 text-xs text-ink-soft italic">No payslips issued yet.</div>
              )}

              <div className="pt-4 space-y-3">
                <p className="text-xs font-bold text-ink mb-3">Quick Directory</p>
                <div className="flex -space-x-2 overflow-hidden items-center">
                  {dashboard?.recentEmployees?.slice(0, 5).map((emp, i) => (
                    <div key={emp.id} className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-brand-100 flex items-center justify-center overflow-hidden" title={emp.user?.name}>
                       <span className="text-[10px] font-bold text-brand-700">{emp.user?.name?.[0]}</span>
                    </div>
                  ))}
                  {dashboard?.recentEmployees?.length > 5 && (
                    <div className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-surface-muted flex items-center justify-center">
                       <span className="text-[10px] font-bold text-ink-soft">+{dashboard.recentEmployees.length - 5}</span>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

// Minimal Zap Icon helper for the worked hours widget
function Zap({ className }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
    </svg>
  );
}
