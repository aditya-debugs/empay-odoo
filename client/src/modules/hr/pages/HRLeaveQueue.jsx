import { useEffect, useState } from 'react';
import { 
  Check, 
  X, 
  Clock, 
  Calendar, 
  MessageSquare,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { Card, Button, Avatar, Tabs, Input } from '../../../features/ui';

function Select({ label, options, value, onChange, required, className = '' }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
      <select
        required={required}
        value={value}
        onChange={onChange}
        className={`w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none h-10 ${className}`}
      >
        {options?.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
import hrService from '../hrService';

export default function HRLeaveQueue() {
  const [activeTab, setActiveTab] = useState('queue');
  const [leaves, setLeaves] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(null);

  // Allocation form state
  const [allocForm, setAllocForm] = useState({
    employeeId: '',
    type: 'ANNUAL',
    year: new Date().getFullYear(),
    totalDays: 0
  });

  useEffect(() => {
    if (activeTab === 'queue') {
      loadQueue();
    } else {
      loadAllocations();
      loadEmployees();
    }
  }, [activeTab]);

  const loadQueue = async () => {
    setLoading(true);
    try {
      const data = await hrService.getLeaveQueue();
      setLeaves(data.leaves || data || []);
    } catch (err) {
      setError(err.message || 'Failed to load leave queue');
    } finally {
      setLoading(false);
    }
  };

  const loadAllocations = async () => {
    setLoading(true);
    try {
      const data = await hrService.getAllocations();
      setAllocations(data.allocations || data || []);
    } catch (err) {
      setError(err.message || 'Failed to load allocations');
    } finally {
      setLoading(false);
    }
  };

  const loadEmployees = async () => {
    try {
      const { records } = await hrService.listEmployees();
      setEmployees(records || []);
    } catch (err) {
      console.error('Failed to load employees', err);
    }
  };

  const handleAllocate = async (e) => {
    e.preventDefault();
    setSubmitting('allocate');
    try {
      await hrService.allocateLeave(allocForm);
      setAllocForm({ ...allocForm, totalDays: 0 }); // reset days
      await loadAllocations();
      alert('Leave allocated successfully!');
    } catch (err) {
      alert('Failed to allocate leave: ' + err.message);
    } finally {
      setSubmitting(null);
    }
  };

  const handleStatusUpdate = async (id, status) => {
    const adminNote = window.prompt(`Enter a note for ${status.toLowerCase()} (optional):`);
    if (adminNote === null) return;

    setSubmitting(id);
    try {
      await hrService.updateLeaveStatus(id, status, adminNote);
      await loadQueue();
    } catch (err) {
      alert('Error updating status: ' + err.message);
    } finally {
      setSubmitting(null);
    }
  };

  if (loading) return <div className="p-8 text-ink-muted animate-pulse">Loading leave queue...</div>;

  const pending = leaves.filter(l => l.status === 'PENDING');
  const processed = leaves.filter(l => l.status !== 'PENDING');

  const tabs = [
    { key: 'queue', label: 'Leave Requests Queue' },
    { key: 'allocation', label: 'Leave Balances & Allocation' }
  ];

  return (
    <div className="px-8 py-10 space-y-10 min-h-screen bg-[#F8F9FA]">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Leave Management</h1>
        <p className="text-sm text-gray-500 font-medium">Review requests and allocate leave balances</p>
      </div>

      <Tabs tabs={tabs} activeKey={activeTab} onChange={setActiveTab} className="border-gray-200" />

      {error && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>}

      {activeTab === 'queue' ? (
        <>
          {/* Pending Requests Section */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold text-gray-800">Pending Requests</h2>
          <span className="bg-[#E9ECEF] text-gray-700 px-2.5 py-0.5 rounded-full text-xs font-bold">
            {pending.length}
          </span>
        </div>
        
        {pending.length === 0 ? (
          <div className="p-16 text-center text-gray-400 italic border border-dashed border-gray-300 rounded-2xl bg-white">
            No pending leave requests
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {pending.map((leave) => (
              <Card key={leave.id} className="p-6 border-gray-100 shadow-sm bg-white hover:shadow-md transition-all">
                <div className="flex flex-col justify-between h-full">
                  <div>
                    <div className="flex items-center gap-4">
                      <Avatar name={leave.employee?.user?.name} className="h-12 w-12 text-lg" />
                      <div>
                        <h3 className="font-bold text-gray-900">{leave.employee?.user?.name}</h3>
                        <p className="text-xs text-gray-500 font-medium">{leave.employee?.department || 'Engineering'}</p>
                      </div>
                    </div>

                    <div className="mt-6 grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span>{new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span>{leave.days} Days ({leave.type.replace('_', ' ')})</span>
                      </div>
                    </div>

                    <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                      <div className="flex items-start gap-2">
                        <MessageSquare className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                        <p className="text-sm text-gray-700 italic">"{leave.reason}"</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 flex gap-3">
                    <Button
                      className="flex-1"
                      variant="primary"
                      onClick={() => handleStatusUpdate(leave.id, 'APPROVED')}
                      loading={submitting === leave.id}
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Approve
                    </Button>
                    <Button
                      variant="danger"
                      className="flex-1"
                      onClick={() => handleStatusUpdate(leave.id, 'REJECTED')}
                      loading={submitting === leave.id}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Recently Processed Section */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-gray-800">Recently Processed</h2>
        <Card className="overflow-hidden border-border shadow-sm bg-white p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-surface-muted border-b border-border">
                <tr>
                  <th className="px-6 py-4 text-[12px] font-semibold tracking-wider text-ink-muted uppercase">Employee</th>
                  <th className="px-6 py-4 text-[12px] font-semibold tracking-wider text-ink-muted uppercase">Dates</th>
                  <th className="px-6 py-4 text-[12px] font-semibold tracking-wider text-ink-muted uppercase">Type</th>
                  <th className="px-6 py-4 text-[12px] font-semibold tracking-wider text-ink-muted uppercase">Status</th>
                  <th className="px-6 py-4 text-[12px] font-semibold tracking-wider text-ink-muted uppercase">Processed At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {processed.map((leave) => (
                  <tr key={leave.id} className="hover:bg-surface-muted/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-ink">{leave.employee?.user?.name}</div>
                      <div className="text-[11px] text-ink-muted font-medium uppercase tracking-wider">{leave.employee?.department || 'Engineering'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-ink font-bold">{new Date(leave.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - {new Date(leave.endDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</div>
                      <div className="text-[11px] text-ink-muted font-medium">{leave.days} Days</div>
                    </td>
                    <td className="px-6 py-4 text-[13px] font-medium text-ink-muted">
                      {leave.type.replace('_', ' ')}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wide border ${
                        leave.status === 'APPROVED' ? 'bg-success-50 text-success-700 border-success-500/20' : 'bg-danger-50 text-danger-700 border-danger-500/20'
                      }`}>
                        {leave.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[13px] text-ink-muted font-medium">
                      {leave.approvedAt ? new Date(leave.approvedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '-'}
                    </td>
                  </tr>
                ))}
                {processed.length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-ink-muted">
                      <div className="flex flex-col items-center justify-center">
                        <Calendar className="h-8 w-8 mb-2 opacity-20" />
                        <p className="text-sm font-medium">No processed requests found</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </section>
      </>
      ) : (
        <div className="space-y-8">
          <Card className="p-6 bg-white border-gray-100 rounded-2xl shadow-sm">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Allocate Leave Balance</h2>
            <form onSubmit={handleAllocate} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
              <div className="md:col-span-2">
                <Select
                  label="Employee"
                  required
                  value={allocForm.employeeId}
                  onChange={(e) => setAllocForm({ ...allocForm, employeeId: e.target.value })}
                  options={[
                    { value: '', label: 'Select Employee...' },
                    ...employees.map(emp => ({ value: emp.id, label: emp.user?.name || emp.id }))
                  ]}
                />
              </div>
              <div>
                <Select
                  label="Leave Type"
                  required
                  value={allocForm.type}
                  onChange={(e) => setAllocForm({ ...allocForm, type: e.target.value })}
                  options={[
                    { value: 'ANNUAL', label: 'Annual Leave' },
                    { value: 'SICK', label: 'Sick Leave' },
                    { value: 'UNPAID', label: 'Unpaid Leave' },
                    { value: 'MATERNITY', label: 'Maternity/Paternity' }
                  ]}
                />
              </div>
              <div>
                <Input
                  label="Total Days"
                  type="number"
                  min="0"
                  step="0.5"
                  required
                  value={allocForm.totalDays}
                  onChange={(e) => setAllocForm({ ...allocForm, totalDays: parseFloat(e.target.value) })}
                />
              </div>
              <Button type="submit" variant="primary" loading={submitting === 'allocate'} className="h-10">
                Allocate
              </Button>
            </form>
          </Card>

          <Card className="overflow-hidden border-border shadow-sm bg-white p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-surface-muted border-b border-border">
                  <tr>
                    <th className="px-6 py-4 text-[12px] font-semibold tracking-wider text-ink-muted uppercase">Employee</th>
                    <th className="px-6 py-4 text-[12px] font-semibold tracking-wider text-ink-muted uppercase">Type / Year</th>
                    <th className="px-6 py-4 text-[12px] font-semibold tracking-wider text-ink-muted uppercase">Total Allocated</th>
                    <th className="px-6 py-4 text-[12px] font-semibold tracking-wider text-ink-muted uppercase">Used Days</th>
                    <th className="px-6 py-4 text-[12px] font-semibold tracking-wider text-ink-muted uppercase">Remaining</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {allocations.map((alloc) => {
                    const remaining = parseFloat(alloc.totalDays) - parseFloat(alloc.usedDays);
                    return (
                      <tr key={alloc.id} className="hover:bg-surface-muted/30 transition-colors">
                        <td className="px-6 py-4 font-bold text-ink">{alloc.employee?.user?.name}</td>
                        <td className="px-6 py-4">
                          <span className="font-bold text-ink-muted">{alloc.type.replace('_', ' ')}</span>
                          <span className="text-[11px] text-ink-soft ml-2">({alloc.year})</span>
                        </td>
                        <td className="px-6 py-4 font-bold text-ink">{alloc.totalDays}</td>
                        <td className="px-6 py-4 font-bold text-danger-500">{alloc.usedDays}</td>
                        <td className="px-6 py-4 font-bold text-success-600">{remaining}</td>
                      </tr>
                    );
                  })}
                  {allocations.length === 0 && !loading && (
                    <tr>
                      <td colSpan="5" className="px-6 py-12 text-center text-ink-muted">
                        <div className="flex flex-col items-center justify-center">
                          <Calendar className="h-8 w-8 mb-2 opacity-20" />
                          <p className="text-sm font-medium">No leave allocations found</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
