import { useEffect, useState } from 'react';
import { useAuth } from '../../../features/auth/AuthContext';
import { Card, Button } from '../../../features/ui';
import { Calendar, Clock, DollarSign, Users } from 'lucide-react';
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

  if (loading) return <div className="p-8">Loading...</div>;
  if (error) return <div className="p-8 text-danger-700">{error}</div>;

  return (
    <div className="px-8 py-8">
      <h1 className="text-3xl font-semibold tracking-tight">Welcome, {user?.name}</h1>
      <p className="mt-1 text-sm text-ink-muted">Employee Dashboard — {dashboard?.attendance?.month}</p>

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
          </Card>
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
  );
}
