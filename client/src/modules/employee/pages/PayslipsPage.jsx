import { useEffect, useState } from 'react';
import { Card, Button } from '../../../features/ui';
import { Download, AlertCircle } from 'lucide-react';
import api from '../../../services/api';

export default function PayslipsPage() {
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [disputes, setDisputes] = useState([]);
  const [showDisputeForm, setShowDisputeForm] = useState(false);
  const [selectedPayslip, setSelectedPayslip] = useState(null);
  const [disputeReason, setDisputeReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadPayslips();
  }, []);

  const loadPayslips = async () => {
    setLoading(true);
    try {
      const [payslipsData, disputesData] = await Promise.all([
        api.get('/payslips/me'),
        api.get('/payslip-disputes/me').catch(() => ({ disputes: [] }))
      ]);
      setPayslips(payslipsData.payslips || []);
      setDisputes(disputesData.disputes || []);
    } catch (err) {
      setError(err.message || 'Failed to load payslips');
    } finally {
      setLoading(false);
    }
  };

  const handleRaiseDispute = async (e) => {
    e.preventDefault();
    if (!selectedPayslip) return;

    setSubmitting(true);
    try {
      await api.post('/payslip-disputes', {
        payslipId: selectedPayslip.id,
        reason: disputeReason
      });
      setDisputeReason('');
      setShowDisputeForm(false);
      setSelectedPayslip(null);
      await loadPayslips();
    } catch (err) {
      setError(err.message || 'Failed to raise dispute');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="px-8 py-8">
      <h1 className="text-3xl font-semibold tracking-tight">Payslips</h1>
      <p className="mt-1 text-sm text-ink-muted">View and download your payslips</p>

      {error && <div className="mt-4 p-3 bg-danger-50 text-danger-700 rounded-lg text-sm">{error}</div>}

      {/* Payslips List */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-4">Your Payslips</h2>
        {payslips.length === 0 ? (
          <Card className="p-8 text-center text-ink-muted">
            No payslips available yet
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {payslips.map((payslip) => (
              <Card key={payslip.id} className="p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold">
                      {new Date(payslip.createdAt).toLocaleString('default', { month: 'long', year: 'numeric' })}
                    </h3>
                    <p className="text-xs text-ink-muted mt-1">
                      Month: {payslip.month} | Year: {payslip.year}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    payslip.status === 'GENERATED' ? 'bg-success-100 text-success-700' : 'bg-warning-100 text-warning-700'
                  }`}>
                    {payslip.status}
                  </span>
                </div>

                <div className="space-y-3 mb-4 pb-4 border-b border-ink-200">
                  <div className="flex justify-between">
                    <span className="text-sm text-ink-muted">Basic Salary</span>
                    <span className="text-sm font-semibold">${payslip.basicSalary?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-ink-muted">Gross Salary</span>
                    <span className="text-sm font-semibold">${payslip.grossSalary?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-ink-muted">Total Deductions</span>
                    <span className="text-sm font-semibold text-danger-600">-${payslip.totalDeductions?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between bg-primary-50 p-2 rounded">
                    <span className="text-sm font-medium">Net Salary</span>
                    <span className="text-sm font-bold text-primary-600">${payslip.netSalary?.toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1"
                    leftIcon={<Download className="h-3 w-3" />}
                    disabled={!payslip.pdfUrl}
                  >
                    Download PDF
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="flex-1"
                    leftIcon={<AlertCircle className="h-3 w-3" />}
                    onClick={() => {
                      setSelectedPayslip(payslip);
                      setShowDisputeForm(true);
                    }}
                  >
                    Raise Dispute
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Disputes */}
      {disputes.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-4">Your Disputes</h2>
          <div className="space-y-4">
            {disputes.map((dispute) => (
              <Card key={dispute.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">Payslip Dispute</p>
                    <p className="text-sm text-ink-muted mt-1">{dispute.reason}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    dispute.status === 'RESOLVED' ? 'bg-success-100 text-success-700' :
                    dispute.status === 'UNDER_REVIEW' ? 'bg-warning-100 text-warning-700' :
                    'bg-info-100 text-info-700'
                  }`}>
                    {dispute.status}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Dispute Form Modal */}
      {showDisputeForm && selectedPayslip && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">
              Raise Dispute - {new Date(selectedPayslip.createdAt).toLocaleString('default', { month: 'long', year: 'numeric' })}
            </h3>

            <form onSubmit={handleRaiseDispute}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Reason for Dispute</label>
                <textarea
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  className="w-full px-3 py-2 border border-ink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  rows="4"
                  placeholder="Please explain the issue with this payslip..."
                  required
                />
              </div>

              <div className="flex gap-2">
                <Button
                  type="submit"
                  loading={submitting}
                  className="flex-1"
                >
                  Submit Dispute
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  className="flex-1"
                  onClick={() => {
                    setShowDisputeForm(false);
                    setSelectedPayslip(null);
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
