import { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { Card, Button } from '../../../features/ui';
import api from '../../../services/api';

export default function HRDisputesPage() {
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [selectedDispute, setSelectedDispute] = useState(null);
  const [resolutionText, setResolutionText] = useState('');
  const [resolving, setResolving] = useState(false);

  useEffect(() => { fetchDisputes(); }, []);

  const fetchDisputes = async () => {
    try {
      setLoading(true);
      const res = await api.get('/payslip-disputes');
      setDisputes(res.disputes);
    } catch (err) {
      setError(err.message || 'Failed to fetch disputes');
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (status) => {
    if (!resolutionText.trim()) { alert('Please provide a resolution note.'); return; }
    setResolving(true);
    try {
      await api.patch(`/payslip-disputes/${selectedDispute.id}/resolve`, {
        status,
        resolution: resolutionText,
      });
      setSelectedDispute(null);
      setResolutionText('');
      fetchDisputes();
    } catch (err) {
      alert(err.message || 'Failed to resolve dispute');
    } finally {
      setResolving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 px-8 py-8">
      <div>
        <h1 className="text-2xl font-bold text-ink-900">HR Disputes Queue</h1>
        <p className="text-ink-muted">Review and resolve HR-related issues raised by employees.</p>
      </div>

      {error && (
        <div className="rounded-xl bg-danger-50 px-4 py-3 text-sm text-danger-700">{error}</div>
      )}

      <Card className="flex flex-col overflow-hidden p-0">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-ink-50 text-ink-500 uppercase text-xs tracking-wider">
            <tr>
              <th className="px-5 py-3">Employee</th>
              <th className="px-5 py-3">Payslip Period</th>
              <th className="px-5 py-3">Issue Reason</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {loading ? (
              <tr><td colSpan={5} className="px-5 py-12 text-center text-ink-muted">Loading disputes...</td></tr>
            ) : disputes.length === 0 ? (
              <tr><td colSpan={5} className="px-5 py-12 text-center text-ink-muted">No HR disputes found.</td></tr>
            ) : (
              disputes.map((dispute) => (
                <tr key={dispute.id} className="hover:bg-surface-muted/40 transition-colors">
                  <td className="px-5 py-4 font-medium text-ink-900">{dispute.raisedBy?.name}</td>
                  <td className="px-5 py-4">
                    {dispute.payslip
                      ? `${new Date(dispute.payslip.year, dispute.payslip.month - 1).toLocaleString('en', { month: 'short' })} ${dispute.payslip.year} (v${dispute.payslip.version})`
                      : 'Unknown'}
                  </td>
                  <td className="px-5 py-4 truncate max-w-xs" title={dispute.reason}>{dispute.reason}</td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${
                      dispute.status === 'OPEN' ? 'bg-warning-50 text-warning-700' :
                      dispute.status === 'RESOLVED' ? 'bg-success-50 text-success-700' :
                      'bg-danger-50 text-danger-700'
                    }`}>
                      {dispute.status === 'OPEN' && <AlertCircle className="h-3 w-3" />}
                      {dispute.status === 'RESOLVED' && <CheckCircle className="h-3 w-3" />}
                      {dispute.status === 'REJECTED' && <XCircle className="h-3 w-3" />}
                      {dispute.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    {dispute.status === 'OPEN' ? (
                      <Button size="sm" onClick={() => { setSelectedDispute(dispute); setResolutionText(''); }}>
                        Review
                      </Button>
                    ) : (
                      <span className="text-xs text-ink-muted italic">Closed</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>

      {selectedDispute && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-lg p-6 shadow-xl">
            <h2 className="text-lg font-bold text-ink-900 mb-2">Resolve HR Dispute</h2>
            <div className="mb-4 text-sm text-ink-600 bg-ink-50 p-3 rounded-lg border border-ink-100">
              <strong>Employee says:</strong><br />
              {selectedDispute.reason}
            </div>
            <div className="flex flex-col gap-2 mb-6">
              <label className="text-sm font-medium text-ink-700">Resolution Note (Mandatory)</label>
              <textarea
                className="min-h-[100px] w-full rounded-xl border border-ink-200 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
                placeholder="Explain the resolution or why it was rejected..."
                value={resolutionText}
                onChange={(e) => setResolutionText(e.target.value)}
              />
            </div>
            <div className="flex items-center justify-end gap-3">
              <Button variant="ghost" onClick={() => setSelectedDispute(null)}>Cancel</Button>
              <Button variant="danger" loading={resolving} onClick={() => handleResolve('REJECTED')}>Reject</Button>
              <Button variant="primary" loading={resolving} onClick={() => handleResolve('RESOLVED')}>Resolve & Close</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}



