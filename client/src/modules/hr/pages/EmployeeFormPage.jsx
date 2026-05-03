import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Save, 
  Mail, 
  User, 
  Briefcase, 
  Calendar,
  Phone,
  Key,
  DollarSign,
  CheckCircle2,
  Clock,
  History,
  AlertCircle
} from 'lucide-react';
import { Card, Button, Input, Avatar, Tabs, DateInput } from '../../../features/ui';
import { useAuth } from '../../../features/auth/AuthContext';
import hrService from '../hrService';

export default function EmployeeFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEdit = Boolean(id);

  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [sendingCreds, setSendingCreds] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    workEmail: '',
    personalPhone: '',
    gender: 'MALE',
    department: '',
    position: '',
    role: 'EMPLOYEE',
    joinDate: new Date().toISOString().split('T')[0],
    employmentType: 'FULL_TIME',
    basicSalary: '',
    hra: '',
    specialAllowance: '',
    employeeId: ''
  });

  const [attendance, setAttendance] = useState([]);
  const [leaves, setLeaves] = useState([]);

  useEffect(() => {
    if (isEdit) {
      setLoading(true);
      Promise.all([
        hrService.getEmployee(id),
        hrService.getEmployeeAttendance(id),
        hrService.getEmployeeLeaves(id)
      ])
      .then(([data, attData, leaveData]) => {
        setForm({
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          workEmail: data.email || '',
          personalPhone: data.personalPhone || '',
          gender: data.gender || 'MALE',
          department: data.department || '',
          position: data.position || '',
          role: data.role || 'EMPLOYEE',
          joinDate: data.joinDate ? new Date(data.joinDate).toISOString().split('T')[0] : '',
          employmentType: data.employmentType || 'FULL_TIME',
          basicSalary: data.basicSalary || '',
          hra: data.hra || '',
          specialAllowance: data.specialAllowance || '',
          employeeId: data.employeeId || ''
        });
        setAttendance(attData.records || []);
        setLeaves(leaveData.leaves || []);
      })
      .catch(() => setError('Failed to load employee data'))
      .finally(() => setLoading(false));
    }
  }, [id, isEdit]);

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      if (isEdit) {
        await hrService.updateEmployee(id, form);
        setSuccess('Employee profile updated successfully');
      } else {
        const result = await hrService.createEmployee(form);
        setSuccess('Employee created successfully!');
        setTimeout(() => navigate(`/hr/employees/${result.user.id}`), 2000);
      }
    } catch (err) {
      setError(err.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  }

  async function onSendCredentials() {
    setSendingCreds(true);
    try {
      await hrService.sendCredentials(id);
      setSuccess('Credentials sent to employee via email');
    } catch (err) {
      setError('Failed to send credentials');
    } finally {
      setSendingCreds(false);
    }
  }

  if (loading) return <div className="p-8 animate-pulse text-ink-muted">Loading employee...</div>;

  const tabs = [
    { key: 'profile', label: 'Profile Info' },
    { key: 'attendance', label: 'Attendance' },
    { key: 'leaves', label: 'Time Off' },
  ];

  return (
    <div className="px-8 py-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link to="/hr/employees" className="inline-flex items-center text-sm text-ink-muted hover:text-white transition-colors">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Directory
        </Link>
        {isEdit && (
          <Button variant="outline" size="sm" onClick={onSendCredentials} loading={sendingCreds}>
            <Key className="h-4 w-4 mr-2" />
            Send Credentials
          </Button>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
        <Avatar name={form.firstName} className="h-20 w-20 text-2xl ring-4 ring-white/5" />
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-white">
            {isEdit ? `${form.firstName} ${form.lastName}` : 'New Employee'}
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            {isEdit ? `${form.position} • ${form.department}` : 'Fill in the details to create a new profile.'}
          </p>
        </div>
      </div>

      <Tabs tabs={tabs} activeKey={activeTab} onChange={setActiveTab} className="border-white/5" />

      {activeTab === 'profile' && (
        <form onSubmit={onSubmit} className="space-y-6">
          {error && <div className="p-3 bg-danger-500/10 border border-danger-500/50 rounded-xl text-danger-400 text-sm">{error}</div>}
          {success && <div className="p-3 bg-success-500/10 border border-success-500/50 rounded-xl text-success-400 text-sm flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            {success}
          </div>}

          <Card className="p-6 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="First Name" value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})} required />
              <Input label="Last Name" value={form.lastName} onChange={e => setForm({...form, lastName: e.target.value})} required />
              <Input label="Work Email" type="email" value={form.workEmail} onChange={e => setForm({...form, workEmail: e.target.value})} required disabled={isEdit} />
              <Input label="Phone Number" value={form.personalPhone} onChange={e => setForm({...form, personalPhone: e.target.value})} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-8 border-t border-white/5">
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-ink-muted flex items-center gap-2">
                  <Briefcase className="h-4 w-4" /> Employment Details
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  <Input label="Department" value={form.department} onChange={e => setForm({...form, department: e.target.value})} required />
                  <Input label="Position / Designation" value={form.position} onChange={e => setForm({...form, position: e.target.value})} required />
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-ink-muted px-1">System Role</label>
                    <select 
                      className="flex h-10 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      value={form.role}
                      onChange={e => setForm({...form, role: e.target.value})}
                      disabled={isEdit}
                    >
                      <option value="EMPLOYEE">Employee</option>
                      <option value="HR_OFFICER">HR Officer</option>
                      <option value="PAYROLL_OFFICER">Payroll Officer</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-medium text-ink-muted flex items-center gap-2">
                  <User className="h-4 w-4" /> Personal Details
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-ink-muted px-1">Gender</label>
                    <select className="flex h-10 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50" value={form.gender} onChange={e => setForm({...form, gender: e.target.value})}>
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                  <DateInput label="Join Date" value={form.joinDate} onChange={e => setForm({...form, joinDate: e.target.value})} required />
                </div>
              </div>
            </div>

            {user.role !== 'HR_OFFICER' && (
              <div className="space-y-4 pt-8 border-t border-white/5">
                <h3 className="text-sm font-medium text-ink-muted flex items-center gap-2">
                  <DollarSign className="h-4 w-4" /> Pay & Salary Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input label="Basic Salary" type="number" value={form.basicSalary} onChange={e => setForm({...form, basicSalary: e.target.value})} />
                  <Input label="HRA" type="number" value={form.hra} onChange={e => setForm({...form, hra: e.target.value})} />
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-6 border-t border-white/5">
              <Button type="button" variant="ghost" onClick={() => navigate('/hr/employees')}>Cancel</Button>
              <Button type="submit" loading={submitting}><Save className="h-4 w-4 mr-2" />{isEdit ? 'Update Profile' : 'Create Employee'}</Button>
            </div>
          </Card>
        </form>
      )}

      {activeTab === 'attendance' && (
        <Card className="overflow-hidden">
          <div className="p-6 border-b border-white/5 flex items-center justify-between">
            <h3 className="font-medium text-white flex items-center gap-2">
              <History className="h-4 w-4 text-ink-muted" /> Recent Attendance
            </h3>
          </div>
          <table className="w-full text-left">
            <thead className="bg-white/[0.02] text-xs font-semibold text-ink-muted uppercase">
              <tr>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Clock In</th>
                <th className="px-6 py-3">Clock Out</th>
                <th className="px-6 py-3">Hours</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {attendance.map(record => (
                <tr key={record.id} className="text-sm">
                  <td className="px-6 py-4 text-white font-medium">{new Date(record.date).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                      record.status === 'PRESENT' ? 'bg-success-500/10 text-success-400 border-success-500/20' :
                      record.status === 'REGULARIZED' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                      'bg-danger-500/10 text-danger-400 border-danger-500/20'
                    }`}>
                      {record.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-ink-muted">{record.checkIn ? new Date(record.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                  <td className="px-6 py-4 text-ink-muted">{record.checkOut ? new Date(record.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                  <td className="px-6 py-4 text-white">{record.hoursWorked || '0.0'}</td>
                </tr>
              ))}
              {attendance.length === 0 && (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-ink-muted italic">No attendance records found.</td></tr>
              )}
            </tbody>
          </table>
        </Card>
      )}

      {activeTab === 'leaves' && (
        <Card className="overflow-hidden">
          <div className="p-6 border-b border-white/5">
            <h3 className="font-medium text-white flex items-center gap-2">
              <Calendar className="h-4 w-4 text-ink-muted" /> Time Off History
            </h3>
          </div>
          <div className="divide-y divide-white/5">
            {leaves.map(leave => (
              <div key={leave.id} className="p-6 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white">{leave.type.replace('_', ' ')}</p>
                  <p className="text-xs text-ink-muted">
                    {new Date(leave.startDate).toLocaleDateString()} — {new Date(leave.endDate).toLocaleDateString()}
                    <span className="ml-2 font-medium text-white">({leave.days} days)</span>
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  leave.status === 'APPROVED' ? 'bg-success-500/10 text-success-400' :
                  leave.status === 'PENDING' ? 'bg-warning-500/10 text-warning-400' :
                  'bg-danger-500/10 text-danger-400'
                }`}>
                  {leave.status}
                </span>
              </div>
            ))}
            {leaves.length === 0 && (
              <div className="p-12 text-center text-ink-muted italic text-sm">No leave history found.</div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}



