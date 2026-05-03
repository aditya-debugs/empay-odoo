import { useEffect, useState } from 'react';
import { useAuth } from '../../../features/auth/AuthContext';
import { Card, Button } from '../../../features/ui';
import { Calendar, Clock, Users, User, AlertCircle } from 'lucide-react';
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
      await api.post(`/payslip-disputes`, {
        payslipId: dashboard.lastPayslip.id,
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

  if (loading) return <div className="flex h-screen items-center justify-center text-ink-muted">Loading System...</div>;
  if (error) return <div className="p-8 text-danger-700 bg-danger-50 rounded-xl m-8 border border-danger-100">{error}</div>;

  return (
    <div className="min-h-screen bg-surface-muted/30">
      {/* Header */}
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
        {/* Core Metrics Grid */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <MetricCard 
            label="Active Presence" 
            value={dashboard?.attendance?.present || 0} 
            unit="Days" 
            icon={<Clock className="h-5 w-5 text-brand-600" />} 
            bg="bg-brand-50"
          />
          <MetricCard 
            label="Recorded Absence" 
            value={dashboard?.attendance?.absent || 0} 
            unit="Days" 
            icon={<Calendar className="h-5 w-5 text-danger-600" />} 
            bg="bg-danger-50"
          />
          <MetricCard 
            label="Work Efficiency" 
            value={dashboard?.attendance?.totalHours || '0.0'} 
            unit="Hours" 
            icon={<Zap className="h-5 w-5 text-success-600" />} 
            bg="bg-success-50"
          />
          <MetricCard 
            label="Monthly Salary" 
            value={dashboard?.employee?.basicSalary ? `₹${dashboard.employee.basicSalary.toLocaleString('en-IN')}` : '₹0'} 
            unit="" 
            icon={<User className="h-5 w-5 text-primary-600" />} 
            bg="bg-primary-50"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Leave Balances */}
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

          {/* Last Payslip Sidebar */}
          <div className="space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-widest text-ink-soft">Latest Record</h2>
            <Card className="p-5 border-none shadow-sm bg-white">
              {dashboard?.lastPayslip ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs font-bold text-ink">Recent Payslip</p>
                      <p className="text-[10px] text-ink-soft">{dashboard.lastPayslip.month}/{dashboard.lastPayslip.year}</p>
                    </div>
                    <span className="px-2 py-0.5 bg-success-50 text-success-600 text-[9px] font-bold rounded-full uppercase">Verified</span>
                  </div>
                  <div className="flex justify-between items-end border-t border-border pt-4">
                    <div>
                      <p className="text-[10px] text-ink-soft uppercase tracking-wider">Net Payable</p>
                      <p className="text-xl font-black text-brand-600">₹{dashboard.lastPayslip.netSalary?.toLocaleString('en-IN')}</p>
                    </div>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="text-[10px] h-8 text-danger-600 hover:bg-danger-50"
                      onClick={() => setShowDisputeForm(true)}
                    >
                      Report Issue
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-ink-muted italic py-4 text-center">No payslip records yet.</p>
              )}
            </Card>
          </div>
        </div>

        {/* Recent Disputes */}
        {dashboard?.recentDisputes?.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-widest text-ink-soft">My Recent Inquiries</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {dashboard.recentDisputes.map((dispute) => (
                <Card key={dispute.id} className="p-4 flex items-center justify-between border-l-4 border-l-brand-500">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-brand-50 rounded-lg">
                      <AlertCircle className="h-4 w-4 text-brand-600" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-ink">Issue: {dispute.reason}</p>
                      <p className="text-[10px] text-ink-soft">Status: {dispute.status}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-medium text-ink-muted">{new Date(dispute.createdAt).toLocaleDateString()}</span>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Report Issue Modal */}
      {showDisputeForm && (
        <div className="fixed inset-0 bg-ink/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full p-6 shadow-2xl border-none animate-in zoom-in duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-danger-50 rounded-lg text-danger-600">
                <AlertCircle className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-ink">Report Payroll Issue</h3>
            </div>
            
            <p className="text-sm text-ink-soft mb-6">
              Reporting for <strong>{dashboard?.lastPayslip?.month}/{dashboard?.lastPayslip?.year}</strong>. 
              Our payroll team will review your concern.
            </p>

            <form onSubmit={handleReportIssue} className="space-y-4">
              <textarea
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                className="w-full px-4 py-3 bg-surface-muted border border-border-strong rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 h-32 resize-none"
                placeholder="Describe the issue explicitly..."
                required
              />

              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  className="flex-1 font-bold"
                  onClick={() => {
                    setShowDisputeForm(false);
                    setDisputeReason('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 font-bold shadow-lg"
                  loading={submitting}
                >
                  Submit Report
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}

function MetricCard({ label, value, unit, icon, bg }) {
  return (
    <Card className="p-5 border-none shadow-sm hover:shadow-md transition-all group">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-ink-soft">{label}</p>
          <div className="flex items-baseline gap-1 mt-1">
            <p className="text-xl font-bold text-ink">{value}</p>
            {unit && <p className="text-[10px] text-ink-soft">{unit}</p>}
          </div>
        </div>
        <div className={`p-2.5 ${bg} rounded-lg group-hover:scale-110 transition-transform`}>
          {icon}
        </div>
      </div>
    </Card>
  );
}

function Zap({ className }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
    </svg>
  );
}
