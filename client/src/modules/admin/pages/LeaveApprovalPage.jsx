import { useEffect, useState } from 'react';
import { Card, Button, Avatar } from '../../../features/ui';
import { Check, X, Clock, Calendar, MessageSquare } from 'lucide-react';
import api from '../../../services/api';

export default function LeaveApprovalPage() {
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
      const data = await api.get('/leave/queue');
      setLeaves(data.leaves || []);
    } catch (err) {
      setError(err.message || 'Failed to load leave queue');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id, status) => {
    const adminNote = window.prompt(`Enter a note for ${status.toLowerCase()} (optional):`);
    if (adminNote === null) return; // Cancelled

    setSubmitting(id);
    try {
      await api.patch(`/leave/${id}/status`, { status, adminNote });
      await loadQueue();
    } catch (err) {
      alert('Error updating status: ' + err.message);
    } finally {
      setSubmitting(null);
    }
  };

  if (loading) return <div className="p-8">Loading queue...</div>;

  const pending = leaves.filter(l => l.status === 'PENDING');
  const processed = leaves.filter(l => l.status !== 'PENDING');

  return (
    <div className="px-8 py-8 bg-surface min-h-screen">
      <h1 className="text-3xl font-semibold tracking-tight">Leave Approvals</h1>
      <p className="mt-1 text-sm text-ink-muted">Review and manage employee leave requests</p>

      {error && <div className="mt-4 p-3 bg-danger-50 text-danger-700 rounded-lg text-sm">{error}</div>}

      <div className="mt-8 space-y-8">
        {/* Pending Requests */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-lg font-semibold">Pending Requests</h2>
            <span className="bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full text-xs font-medium">
              {pending.length}
            </span>
          </div>
          
          {pending.length === 0 ? (
            <Card className="p-8 text-center text-ink-muted italic border-dashed">
              No pending leave requests
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {pending.map((leave) => (
                <Card key={leave.id} className="p-5 flex flex-col justify-between hover:shadow-md transition-shadow">
                  <div>
                    <div className="flex items-center gap-3">
                      <Avatar name={leave.employee?.user?.name} size="md" />
                      <div>
                        <h3 className="font-semibold text-ink">{leave.employee?.user?.name}</h3>
                        <p className="text-xs text-ink-muted">{leave.employee?.department} • {leave.employee?.position}</p>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-2 text-sm text-ink-muted">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-ink-muted">
                        <Clock className="h-4 w-4" />
                        <span>{leave.days} Days ({leave.type.replace('_', ' ')})</span>
                      </div>
                    </div>

                    <div className="mt-3 p-3 bg-ink-50 rounded-lg border border-ink-100">
                      <div className="flex items-start gap-2">
                        <MessageSquare className="h-4 w-4 text-ink-muted mt-0.5 shrink-0" />
                        <p className="text-sm text-ink italic">"{leave.reason}"</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex gap-2">
                    <Button
                      className="flex-1 bg-success-600 hover:bg-success-700"
                      leftIcon={<Check className="h-4 w-4" />}
                      loading={submitting === leave.id}
                      onClick={() => handleStatusUpdate(leave.id, 'APPROVED')}
                    >
                      Approve
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 text-danger-600 border-danger-200 hover:bg-danger-50"
                      leftIcon={<X className="h-4 w-4" />}
                      loading={submitting === leave.id}
                      onClick={() => handleStatusUpdate(leave.id, 'REJECTED')}
                    >
                      Reject
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Recently Processed */}
        <section>
          <h2 className="text-lg font-semibold mb-4">Recently Processed</h2>
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-ink-50 border-b border-ink-200">
                  <tr>
                    <th className="px-6 py-3 font-semibold text-ink-muted">Employee</th>
                    <th className="px-6 py-3 font-semibold text-ink-muted">Dates</th>
                    <th className="px-6 py-3 font-semibold text-ink-muted">Type</th>
                    <th className="px-6 py-3 font-semibold text-ink-muted">Status</th>
                    <th className="px-6 py-3 font-semibold text-ink-muted">Processed At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100">
                  {processed.map((leave) => (
                    <tr key={leave.id} className="hover:bg-ink-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-ink">{leave.employee?.user?.name}</div>
                        <div className="text-xs text-ink-muted">{leave.employee?.department}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-ink">{new Date(leave.startDate).toLocaleDateString()}</div>
                        <div className="text-xs text-ink-muted">{leave.days} Days</div>
                      </td>
                      <td className="px-6 py-4 text-ink-muted">
                        {leave.type.replace('_', ' ')}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-[11px] font-medium ${
                          leave.status === 'APPROVED' ? 'bg-success-100 text-success-700' : 'bg-danger-100 text-danger-700'
                        }`}>
                          {leave.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-ink-muted text-xs">
                        {leave.approvedAt ? new Date(leave.approvedAt).toLocaleDateString() : '-'}
                      </td>
                    </tr>
                  ))}
                  {processed.length === 0 && (
                    <tr>
                      <td colSpan="5" className="px-6 py-10 text-center text-ink-muted italic">
                        No processed requests yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </section>
      </div>
    </div>
  );
}
