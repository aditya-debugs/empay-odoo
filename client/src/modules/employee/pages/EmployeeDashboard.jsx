import { useEffect, useState } from 'react';
import { useAuth } from '../../../features/auth/AuthContext';
import { Card, Button } from '../../../features/ui';
import { Calendar, Clock, DollarSign, Users, User } from 'lucide-react';
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

  if (loading) return <div className="p-8">Loading...</div>;
  if (error) return <div className="p-8 text-danger-700">{error}</div>;

  return (
    <div className="min-h-screen bg-surface">
      {/* Premium Header Section */}
      <div className="bg-brand-500 px-8 pt-8 pb-16 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Welcome, {user?.name}</h1>
            <p className="mt-1 text-sm text-brand-100 opacity-80">Employee Dashboard • {dashboard?.attendance?.month}</p>
          </div>
          <div className="h-12 w-12 rounded-full bg-brand-400/30 flex items-center justify-center border border-brand-300/20">
             <User className="h-6 w-6 text-white" />
          </div>
        </div>
      </div>

      <div className="px-8 -mt-8 space-y-8 pb-12">
        <div className="grid grid-cols-1 gap-6 mt-8 md:grid-cols-4">
          {/* Attendance Widget */}
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-ink-muted">Present Days</p>
                <p className="text-2xl font-semibold mt-1">{dashboard?.attendance?.present}</p>
              </div>
              <Clock className="h-10 w-10 text-primary-500" />
            </div>
          </Card>

          {/* Absent Days Widget */}
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-ink-muted">Absent Days</p>
                <p className="text-2xl font-semibold mt-1">{dashboard?.attendance?.absent}</p>
              </div>
              <Calendar className="h-10 w-10 text-danger-500" />
            </div>
          </Card>

          {/* Total Hours Widget */}
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-ink-muted">Hours Worked</p>
                <p className="text-2xl font-semibold mt-1">{dashboard?.attendance?.totalHours}</p>
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
              <DollarSign className="h-10 w-10 text-primary-500" />
            </div>
          </Card>
        </div>

        {/* Leave Balance */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Leave Balance</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {dashboard?.leaves?.map((leave) => (
              <Card key={leave.type} className="p-4">
                <p className="text-sm font-medium text-ink-muted">{leave.type.replace('_', ' ')}</p>
                <div className="mt-2 grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-xs text-ink-muted">Total</p>
                    <p className="text-lg font-semibold">{leave.total}</p>
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
        )}
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

// Simple AlertCircle icon since lucide might not be exported from ui
function AlertCircle({ className }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  );
}
