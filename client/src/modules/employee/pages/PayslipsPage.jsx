import { useEffect, useState } from 'react';
import { Card, Button } from '../../../features/ui';
import { Download, AlertCircle, FileText, CheckCircle } from 'lucide-react';
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
  const [downloadingId, setDownloadingId] = useState(null);

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

  const handleDownload = (payslip) => {
    setDownloadingId(payslip.id);
    
    // For Hackathon Demonstration: Generate a "Professional" looking virtual payslip PDF
    // In a real app, this would be a URL to a pre-generated file on S3/Cloud Storage.
    setTimeout(() => {
      const content = `
        -----------------------------------------------------
        ${payslip.employee?.companyName || 'EmPay Organization'} - OFFICIAL PAYSLIP
        -----------------------------------------------------
        Period: ${payslip.month}/${payslip.year}
        Employee: ${payslip.employee?.firstName} ${payslip.employee?.lastName}
        
        EARNINGS:
        Basic Salary:       $${payslip.basicSalary}
        Gross Salary:       $${payslip.grossSalary}
        
        DEDUCTIONS:
        Total Deductions:   -$${payslip.totalDeductions}
        
        -----------------------------------------------------
        NET SALARY PAYABLE: $${payslip.netSalary}
        -----------------------------------------------------
        Status: ${payslip.status}
        Generated At: ${new Date(payslip.createdAt).toLocaleString()}
      `;
      
      const blob = new Blob([content], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Payslip_${payslip.month}_${payslip.year}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setDownloadingId(null);
    }, 800);
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

  if (loading) return <div className="flex h-full items-center justify-center">Loading...</div>;

  return (
    <div className="px-8 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">Salary Payslips</h1>
        <p className="mt-1 text-xs font-medium text-ink-soft uppercase tracking-widest">Financial Records • Official Downloads</p>
      </div>

      {error && <div className="p-3 bg-danger-50 text-danger-700 rounded-xl text-sm border border-danger-100">{error}</div>}

      {/* Grid of Payslips - Now more professional */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {payslips.length === 0 ? (
          <div className="col-span-full py-20 text-center text-ink-soft italic">
            No official payslips have been issued for your account yet.
          </div>
        ) : (
          payslips.map((payslip) => (
            <Card key={payslip.id} className="p-0 overflow-hidden hover:shadow-lg transition-all border-none relative group">
              <div className="bg-surface-muted/50 px-6 py-4 border-b border-border flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-brand-500" />
                  <span className="text-sm font-bold text-ink">
                    {new Date(0, payslip.month - 1).toLocaleString('default', { month: 'long' })} {payslip.year}
                  </span>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-tight ${
                  payslip.status === 'GENERATED' ? 'bg-success-50 text-success-600' : 'bg-warning-50 text-warning-600'
                }`}>
                  {payslip.status}
                </span>
              </div>

              <div className="p-6 space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-ink-soft">Gross Earnings</span>
                    <span className="font-bold text-ink">${payslip.grossSalary?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs text-danger-600/80">
                    <span>Total Deductions</span>
                    <span className="font-bold">-${payslip.totalDeductions?.toLocaleString()}</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-border flex justify-between items-baseline">
                   <span className="text-xs font-bold text-ink-muted uppercase tracking-wider">Net Payable</span>
                   <span className="text-xl font-black text-brand-600">${payslip.netSalary?.toLocaleString()}</span>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    className="flex-1 text-xs font-bold"
                    leftIcon={<Download className="h-3 w-3" />}
                    onClick={() => handleDownload(payslip)}
                    loading={downloadingId === payslip.id}
                  >
                    Download PDF
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="flex-1 text-xs font-bold"
                    leftIcon={<AlertCircle className="h-3 w-3" />}
                    onClick={() => {
                      setSelectedPayslip(payslip);
                      setShowDisputeForm(true);
                    }}
                  >
                    Raise Dispute
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Disputes Section */}
      {disputes.length > 0 && (
        <div className="pt-8">
           <h2 className="text-sm font-bold uppercase tracking-widest text-ink-soft mb-4">Pending Disputes</h2>
           <div className="space-y-3">
            {disputes.map((dispute) => (
              <Card key={dispute.id} className="p-4 border-l-4 border-l-warning-500">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-warning-50 rounded-lg">
                      <AlertCircle className="h-4 w-4 text-warning-600" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-ink">Inquiry for Period {dispute.payslip?.month}/{dispute.payslip?.year}</p>
                      <p className="text-[10px] text-ink-soft mt-0.5 italic">"{dispute.reason}"</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-[9px] font-bold uppercase ${
                    dispute.status === 'RESOLVED' ? 'bg-success-100 text-success-700' :
                    dispute.status === 'UNDER_REVIEW' ? 'bg-warning-100 text-warning-700' :
                    'bg-brand-50 text-brand-600'
                  }`}>
                    {dispute.status}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Dispute Modal */}
      {showDisputeForm && selectedPayslip && (
        <div className="fixed inset-0 bg-ink/30 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <Card className="p-6 max-w-md w-full shadow-2xl border-none">
            <h3 className="text-lg font-bold text-ink mb-1">Raise a Dispute</h3>
            <p className="text-xs text-ink-soft mb-6">Period: {new Date(0, selectedPayslip.month - 1).toLocaleString('default', { month: 'long' })} {selectedPayslip.year}</p>

            <form onSubmit={handleRaiseDispute} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-ink-muted mb-2">Dispute Category</label>
                <select
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-border-strong rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 mb-3 font-semibold text-ink"
                  required
                >
                  <option value="" disabled>Select accurate reason...</option>
                  <optgroup label="Financial / Payroll">
                    <option value="Mismatched Work Hours">Mismatched Work Hours</option>
                    <option value="Unrecorded Overtime">Unrecorded Overtime</option>
                    <option value="Balance Disputes">Balance Disputes</option>
                    <option value="Missing Benefits/Allowances">Missing Benefits/Allowances</option>
                  </optgroup>
                  <optgroup label="HR / Admin">
                    <option value="Incorrect Leave Type">Incorrect Leave Type</option>
                    <option value="Approval Lag">Approval Lag</option>
                    <option value="Inaccessible History">Inaccessible History</option>
                  </optgroup>
                </select>
              </div>

              {disputeReason && (
                <div className={`p-3 rounded-lg border flex items-center justify-between shadow-inner ${
                  ['Mismatched Work Hours', 'Unrecorded Overtime', 'Balance Disputes', 'Missing Benefits/Allowances'].includes(disputeReason)
                    ? 'bg-warning-50 border-warning-200 text-warning-800'
                    : 'bg-brand-50 border-brand-200 text-brand-800'
                }`}>
                   <span className="text-[10px] font-bold uppercase tracking-widest">Auto-Routing To:</span>
                   <span className="text-xs font-black uppercase">
                     {['Mismatched Work Hours', 'Unrecorded Overtime', 'Balance Disputes', 'Missing Benefits/Allowances'].includes(disputeReason)
                       ? 'Payroll Officer'
                       : 'HR & Admin Head'}
                   </span>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-ink-muted mb-2 mt-4">Additional Details (Optional)</label>
                <textarea
                  className="w-full px-4 py-3 bg-surface-muted border border-border-strong rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  rows="3"
                  placeholder="Provide explicit clarification to assist the reviewer..."
                  id="disputeDetails"
                />
              </div>

              <div className="flex gap-2 pt-4 border-t border-border mt-2">
                 <Button
                  type="button"
                  variant="secondary"
                  className="flex-1 font-bold"
                  onClick={() => {
                    setShowDisputeForm(false);
                    setSelectedPayslip(null);
                    setDisputeReason('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  loading={submitting}
                  className="flex-1 font-bold shadow-lg"
                  disabled={!disputeReason}
                >
                  Submit Official Dispute
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
