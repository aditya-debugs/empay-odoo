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
  const [showDisputeForm, setShowDisputeForm] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchDashboard();
  }, []);
  
  const fetchDashboard = async () => {
    try {
      const data = await api.get('/dashboard/employee');
      setDashboard(data);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleReportIssue = async (e) => {
    e.preventDefault();
    if (!dashboard?.lastPayslip) return;

    setSubmitting(true);
    try {
      await api.post(`/payslips/${dashboard.lastPayslip.id}/dispute`, {
        reason: disputeReason
      });
      setDisputeReason('');
      setShowDisputeForm(false);
      await fetchDashboard();
    } catch (err) {
      alert(err.message || 'Failed to report issue');
    } finally {
      setSubmitting(false);
    }
  };

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
                    <div className="text-right">
                       <p className="text-[10px] text-ink-soft">Utilized: {leave.used}</p>
                       <div className="w-16 h-1 bg-surface-muted rounded-full mt-1">
                          <div className="h-full bg-brand-500 rounded-full" style={{ width: `${(leave.used / leave.total) * 100}%` }} />
                       </div>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-ink-muted">Used</p>
                    <p className="text-lg font-semibold">{leave.used}</p>
                  </div>
                  <div>
                    <p className="text-xs text-ink-muted">Available</p>
                    <p className="text-lg font-semibold text-success-600">{leave.available}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Last Payslip */}
        {dashboard?.lastPayslip && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">Last Payslip</h2>
            <Card className="p-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <p className="text-sm text-ink-muted">Month</p>
                  <p className="text-lg font-semibold mt-1">{dashboard.lastPayslip.month}/{dashboard.lastPayslip.year}</p>
                </div>
                <div>
                  <p className="text-sm text-ink-muted">Net Salary</p>
                  <p className="text-lg font-semibold mt-1">${dashboard.lastPayslip.netSalary?.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-ink-muted">Status</p>
                  <p className="text-lg font-semibold mt-1 text-success-600">{dashboard.lastPayslip.status}</p>
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <Button 
                  size="sm" 
                  variant="secondary" 
                  className="text-danger-600 hover:bg-danger-50 border-danger-100"
                  onClick={() => setShowDisputeForm(true)}
                >
                  Report Issue
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* My Recent Issues */}
        {dashboard?.recentDisputes?.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">My Recent Issues</h2>
            <div className="space-y-4">
              {dashboard.recentDisputes.map((dispute) => (
                <Card key={dispute.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg ${
                        dispute.status === 'RESOLVED' ? 'bg-success-50 text-success-600' : 
                        dispute.status === 'REJECTED' ? 'bg-danger-50 text-danger-600' :
                        'bg-warning-50 text-warning-600'
                      }`}>
                        <AlertCircle className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium">Issue for {dispute.month}/{dispute.year}</p>
                        <p className="text-xs text-ink-muted line-clamp-1">{dispute.reason}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium uppercase tracking-wider ${
                        dispute.status === 'RESOLVED' ? 'bg-success-100 text-success-700' :
                        dispute.status === 'REJECTED' ? 'bg-danger-100 text-danger-700' :
                        'bg-warning-100 text-warning-700'
                      }`}>
                        {dispute.status.replace('_', ' ')}
                      </span>
                      <p className="text-[10px] text-ink-muted mt-1">
                        {new Date(dispute.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Employee Directory Preview */}
        {dashboard?.recentEmployees && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">Team Members</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-6">
              {dashboard.recentEmployees.map((emp) => (
                <Card key={emp.id} className="p-4 text-center">
                  <div className="h-12 w-12 rounded-full bg-primary-100 mx-auto flex items-center justify-center mb-2">
                    <Users className="h-6 w-6 text-primary-600" />
                  </div>
                  <p className="font-medium text-sm">{emp.user?.name}</p>
                  <p className="text-xs text-ink-muted mt-1">{emp.position}</p>
                </Card>
              ))}
            </div>
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

      {/* Report Issue Modal */}
      {showDisputeForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4">
          <Card className="max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-danger-50 rounded-lg text-danger-600">
                <AlertCircle className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Report Payroll Issue</h3>
            </div>
            
            <p className="text-sm text-gray-600 mb-6">
              Reporting for <strong>{dashboard?.lastPayslip?.month}/{dashboard?.lastPayslip?.year}</strong>. 
              Our payroll team will review your concern and get back to you.
            </p>

            <form onSubmit={handleReportIssue}>
              <div className="mb-6">
                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
                  Describe the issue
                </label>
                <textarea
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all resize-none h-32 text-gray-800 placeholder:text-gray-400"
                  placeholder="e.g. Salary was calculated incorrectly for 2 days..."
                  required
                />
              </div>

              <div className="flex gap-3">
                <Button
                  type="submit"
                  className="flex-1 bg-brand-600 hover:bg-brand-700 text-white font-bold py-3"
                  loading={submitting}
                >
                  Submit Report
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  className="px-6 font-bold text-gray-600 border-gray-200"
                  onClick={() => {
                    setShowDisputeForm(false);
                    setDisputeReason('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}



