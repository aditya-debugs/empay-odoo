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
              <Clock className="h-10 w-10 text-success-500" />
            </div>
          </Card>

          {/* Basic Salary Widget */}
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-ink-muted">Monthly Salary</p>
                <p className="text-2xl font-semibold mt-1">${dashboard?.employee?.basicSalary?.toLocaleString()}</p>
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

          {/* Last Transaction Info - Right Column */}
          <div className="space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-widest text-ink-soft">Latest Records</h2>
            <Card className="p-5 border-none shadow-sm bg-white divide-y divide-border">
              {dashboard?.lastPayslip ? (
                <>
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
                  <div>
                    <p className="text-sm text-ink-muted">Net Salary</p>
                    <p className="text-lg font-semibold mt-1">&#8377;{dashboard.lastPayslip.netSalary?.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-ink-muted">Status</p>
                    <p className="text-lg font-semibold mt-1 text-success-600">{dashboard.lastPayslip.status}</p>
                  </div>
                </>
              ) : null}
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

// Minimal Zap Icon helper for the worked hours widget
function Zap({ className }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
    </svg>
  );
}
