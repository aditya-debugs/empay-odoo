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
import { Card, Button, Avatar, Tabs, Input, Select } from '../../../features/ui';
import hrService from '../hrService';

export default function HRLeaveQueue() {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(null);

  useEffect(() => {
    loadQueue();
  }, []);

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

  if (loading)
    return (
      <div className="p-8 text-ink-muted animate-pulse font-medium">Loading leave queue...</div>
    );

  const pending = leaves.filter((l) => l.status === 'PENDING');
  const processed = leaves.filter((l) => l.status !== 'PENDING');

  return (
    <div className="px-8 py-10 space-y-10 min-h-screen bg-[#F8F9FA]">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Time Off Management</h1>
        <p className="text-sm text-gray-500 font-medium">Review and process leave requests</p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
          {error}
        </div>
      )}

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
              <Card
                key={leave.id}
                className="p-6 border-gray-100 shadow-sm bg-white hover:shadow-md transition-all"
              >
                <div className="flex flex-col justify-between h-full">
                  <div>
                    <div className="flex items-center gap-4">
                      <Avatar name={leave.employee?.user?.name} className="h-12 w-12 text-lg" />
                      <div>
                        <h3 className="font-bold text-gray-900">{leave.employee?.user?.name}</h3>
                        <p className="text-xs text-gray-500 font-medium">
                          {leave.employee?.department || 'Engineering'}
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span>
                          {new Date(leave.startDate).toLocaleDateString()} -{' '}
                          {new Date(leave.endDate).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span>
                          {leave.days} Days ({leave.type.replace('_', ' ')})
                        </span>
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
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white border-b border-gray-100">
                  <th className="px-8 py-5 text-[13px] font-semibold text-gray-500">Employee</th>
                  <th className="px-8 py-5 text-[13px] font-semibold text-gray-500">Dates</th>
                  <th className="px-8 py-5 text-[13px] font-semibold text-gray-500">Type</th>
                  <th className="px-8 py-5 text-[13px] font-semibold text-gray-500">Status</th>
                  <th className="px-8 py-5 text-[13px] font-semibold text-gray-500">Processed At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {processed.map((leave) => (
                  <tr key={leave.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-8 py-5">
                      <div className="font-bold text-gray-900">{leave.employee?.user?.name}</div>
                      <div className="text-[11px] text-gray-500 font-medium uppercase tracking-wider">{leave.employee?.department || 'Engineering'}</div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="text-gray-900 font-bold">{new Date(leave.startDate).toLocaleDateString()}</div>
                      <div className="text-[11px] text-gray-500 font-medium">{leave.days} Days</div>
                    </td>
                    <td className="px-6 py-4 text-[13px] font-medium text-ink-muted">
                      {leave.type.replace('_', ' ')}
                    </td>
                    <td className="px-8 py-5">
                      <span className={`text-[12px] font-bold ${
                        leave.status === 'APPROVED' ? 'text-[#198754]' : 'text-[#DC3545]'
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
              <Button type="submit" loading={submitting === 'allocate'} className="bg-[#198754] hover:bg-[#157347] text-white border-none font-bold h-[42px]">
                Allocate
              </Button>
            </form>
          </Card>

          <Card className="overflow-hidden border-gray-100 shadow-sm bg-white rounded-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white border-b border-gray-100">
                    <th className="px-8 py-5 text-[13px] font-semibold text-gray-500">Employee</th>
                    <th className="px-8 py-5 text-[13px] font-semibold text-gray-500">Type / Year</th>
                    <th className="px-8 py-5 text-[13px] font-semibold text-gray-500">Total Allocated</th>
                    <th className="px-8 py-5 text-[13px] font-semibold text-gray-500">Used Days</th>
                    <th className="px-8 py-5 text-[13px] font-semibold text-gray-500">Remaining</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {allocations.map((alloc) => {
                    const remaining = parseFloat(alloc.totalDays) - parseFloat(alloc.usedDays);
                    return (
                      <tr key={alloc.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-8 py-5 font-bold text-gray-900">{alloc.employee?.user?.name}</td>
                        <td className="px-8 py-5">
                          <span className="font-bold text-gray-700">{alloc.type.replace('_', ' ')}</span>
                          <span className="text-[11px] text-gray-500 ml-2">({alloc.year})</span>
                        </td>
                        <td className="px-8 py-5 font-medium text-gray-600">{alloc.totalDays}</td>
                        <td className="px-8 py-5 font-medium text-red-500">{alloc.usedDays}</td>
                        <td className="px-8 py-5 font-bold text-green-600">{remaining}</td>
                      </tr>
                    );
                  })}
                  {allocations.length === 0 && !loading && (
                    <tr>
                      <td colSpan="5" className="px-8 py-20 text-center text-gray-400 italic">
                        No leave allocations found.
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
