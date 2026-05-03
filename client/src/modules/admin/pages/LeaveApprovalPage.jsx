import { useEffect, useState } from 'react';
import { 
  Check, 
  X, 
  Clock, 
  Calendar, 
  MessageSquare
} from 'lucide-react';
import { Card, Button, Avatar } from '../../../features/ui';
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
      // Sync with HR module data handling
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
      await api.patch(`/leave/${id}/status`, { status, adminNote });
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

  return (
    <div className="px-8 py-10 space-y-10 min-h-screen bg-[#F8F9FA]">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight text-ink">Leave Approvals</h1>
        <p className="text-sm text-ink-muted font-medium">Review and manage employee leave requests</p>
      </div>

      {error && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>}

      {/* Pending Requests Section */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold text-ink">Pending Requests</h2>
          <span className="bg-[#E9ECEF] text-ink-muted px-2.5 py-0.5 rounded-full text-xs font-bold">
            {pending.length}
          </span>
        </div>
        
        {pending.length === 0 ? (
          <div className="p-16 text-center text-ink-soft italic border border-dashed border-border-strong rounded-2xl bg-white">
            No pending leave requests
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {pending.map((leave) => (
              <Card key={leave.id} className="p-6 border-border shadow-sm bg-white hover:shadow-md transition-all">
                <div className="flex flex-col justify-between h-full">
                  <div>
                    <div className="flex items-center gap-4">
                      <Avatar name={leave.employee?.user?.name} className="h-12 w-12 text-lg" />
                      <div>
                        <h3 className="font-bold text-ink">{leave.employee?.user?.name}</h3>
                        <p className="text-xs text-ink-muted font-medium">{leave.employee?.department || 'Engineering'}</p>
                      </div>
                    </div>

                    <div className="mt-6 grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-2 text-sm text-ink-muted">
                        <Calendar className="h-4 w-4 text-ink-soft" />
                        <span>{new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-ink-muted">
                        <Clock className="h-4 w-4 text-ink-soft" />
                        <span>{leave.days} Days ({leave.type.replace('_', ' ')})</span>
                      </div>
                    </div>

                    <div className="mt-3 p-3 bg-ink-50 rounded-lg border border-ink-100">
                      <div className="flex flex-col gap-3">
                        <div className="flex items-start gap-2">
                          <MessageSquare className="h-4 w-4 text-ink-muted mt-0.5 shrink-0" />
                          <p className="text-sm text-ink italic">"{leave.reason}"</p>
                        </div>
                        {leave.attachmentUrl && (
                          <div className="pt-2 mt-1 border-t border-ink-200">
                            <a 
                              href={`${import.meta.env.VITE_API_URL.replace('/api/v1', '')}/uploads/${leave.attachmentUrl}`} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="inline-flex items-center gap-2 px-3 py-1.5 bg-brand-50 text-brand-700 hover:bg-brand-100 rounded-md text-xs font-semibold transition-colors"
                            >
                              <Check className="h-3 w-3" />
                              View Medical Certificate / Evidence
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 flex gap-3">
                    <Button
                      className="flex-1 bg-[#198754] hover:bg-[#157347] text-white border-none font-bold py-2.5 rounded-xl"
                      onClick={() => handleStatusUpdate(leave.id, 'APPROVED')}
                      loading={submitting === leave.id}
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Approve
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 text-[#DC3545] border-red-100 hover:bg-red-50 font-bold py-2.5 rounded-xl"
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
        <h2 className="text-lg font-bold text-ink">Recently Processed</h2>
        <Card className="overflow-hidden border-border shadow-sm bg-white rounded-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white border-b border-border">
                  <th className="px-8 py-5 text-[13px] font-semibold text-ink-muted">Employee</th>
                  <th className="px-8 py-5 text-[13px] font-semibold text-ink-muted">Dates</th>
                  <th className="px-8 py-5 text-[13px] font-semibold text-ink-muted">Type</th>
                  <th className="px-8 py-5 text-[13px] font-semibold text-ink-muted">Status</th>
                  <th className="px-8 py-5 text-[13px] font-semibold text-ink-muted">Processed At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {processed.map((leave) => (
                  <tr key={leave.id} className="hover:bg-surface-muted transition-colors">
                    <td className="px-8 py-5">
                      <div className="font-bold text-ink">{leave.employee?.user?.name}</div>
                      <div className="text-[11px] text-ink-muted font-medium uppercase tracking-wider">{leave.employee?.department || 'Engineering'}</div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="text-ink font-bold">{new Date(leave.startDate).toLocaleDateString()}</div>
                      <div className="text-[11px] text-ink-muted font-medium">{leave.days} Days</div>
                    </td>
                    <td className="px-8 py-5 text-[13px] font-medium text-ink-muted">
                      {leave.type.replace('_', ' ')}
                    </td>
                    <td className="px-8 py-5">
                      <span className={`text-[12px] font-bold ${
                        leave.status === 'APPROVED' ? 'text-[#198754]' : 'text-[#DC3545]'
                      }`}>
                        {leave.status}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-[13px] text-ink-muted">
                      {leave.approvedAt ? new Date(leave.approvedAt).toLocaleDateString() : '-'}
                    </td>
                  </tr>
                ))}
                {processed.length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-8 py-20 text-center text-ink-soft italic">
                      No processed requests found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </section>
    </div>
  );
}



