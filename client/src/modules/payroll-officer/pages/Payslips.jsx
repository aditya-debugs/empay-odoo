import { useState, useEffect } from 'react';
import { Card, Input } from '../../../features/ui';
import { useAuth } from '../../../features/auth/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../../../services/api';
import { downloadPayslipPdf } from '../../../utils/payslipPdf';

export default function Payslips() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [monthFilter, setMonthFilter] = useState(new Date().toISOString().substring(0, 7));
  const [nameFilter, setNameFilter] = useState('');

  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [page, setPage] = useState(0);
  const ITEMS_PER_PAGE = 10;

  const [selectedPayslip, setSelectedPayslip] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);

  // Dispute state
  const [showDisputeForm, setShowDisputeForm] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');
  const [submittingDispute, setSubmittingDispute] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  useEffect(() => {
    if (user?.role === 'EMPLOYEE') {
      navigate('/employee/payslips', { replace: true });
    }
  }, [user, navigate]);

  const fetchPayslips = async () => {
    setLoading(true);
    setError(null);
    try {
      let url = '/payslips';
      if (monthFilter) {
        const [yyyy, mm] = monthFilter.split('-');
        url += `?year=${yyyy}&month=${parseInt(mm, 10)}`;
      }
      if (nameFilter) {
        url += `${url.includes('?') ? '&' : '?'}search=${encodeURIComponent(nameFilter)}`;
      }
      const res = await api.get(url);
      setPayslips(res.payslips || []);
      setPage(0);
    } catch (err) {
      setError(err.message || 'Failed to fetch payslips');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayslips();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthFilter, nameFilter]); // Refetch when filters change

  // Auto clear toast
  useEffect(() => {
    if (toastMessage) {
      const t = setTimeout(() => setToastMessage(null), 4000);
      return () => clearTimeout(t);
    }
  }, [toastMessage]);

  const filteredPayslips = payslips; // Filtering is now handled on the backend

  const paginatedPayslips = filteredPayslips.slice(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE);
  const totalPages = Math.ceil(filteredPayslips.length / ITEMS_PER_PAGE);

  const handleDownloadPdf = (id, e) => {
    if (e) e.stopPropagation();
    const p = payslips.find(item => item.id === id) || selectedPayslip;
    if (!p) return;
    setIsDownloading(true);
    try {
      downloadPayslipPdf(p);
      setToastMessage('PDF downloaded successfully!');
    } catch (err) {
      setToastMessage(`Error: ${err.message}`);
    } finally {
      setTimeout(() => setIsDownloading(false), 800);
    }
  };

  const handleRaiseDispute = async () => {
    if (!disputeReason.trim()) return;
    setSubmittingDispute(true);
    try {
      await api.post('/payslip-disputes', {
        payslipId: selectedPayslip.id,
        reason: disputeReason
      });
      setToastMessage('Dispute raised successfully.');
      setShowDisputeForm(false);
      setDisputeReason('');
    } catch (err) {
      setToastMessage(`Dispute failed: ${err.message}`);
    } finally {
      setSubmittingDispute(false);
    }
  };

  const formatINR = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val || 0);

  const getMonthName = (monthNum, yearNum) => {
    if (!monthNum || !yearNum) return '';
    return new Date(`${yearNum}-${String(monthNum).padStart(2, '0')}-01`).toLocaleString('default', { month: 'long', year: 'numeric' });
  };

  return (
    <div className="px-8 py-8 animate-fade-in space-y-6 relative">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-[70] bg-ink text-white px-4 py-3 rounded shadow-lg animate-fade-in">
          {toastMessage}
        </div>
      )}

      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-ink">Payslips</h1>
        <p className="mt-1 text-sm text-ink-muted">View and manage employee payslips</p>
      </div>

      <Card className="p-6">
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <Input 
            type="month" 
            value={monthFilter}
            onChange={e => {
              setMonthFilter(e.target.value);
              setPage(0);
            }}
            className="w-full sm:w-auto"
          />
          <Input 
            type="text" 
            value={nameFilter}
            onChange={e => {
              setNameFilter(e.target.value);
              setPage(0);
            }}
            placeholder="Search by employee name..."
            className="flex-1"
            leftIcon={
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            }
          />
        </div>
      </Card>

      {error ? (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg">{error}</div>
      ) : loading ? (
        <div className="space-y-4">
          <div className="h-12 bg-border rounded animate-pulse"></div>
          <div className="h-12 bg-border rounded animate-pulse"></div>
          <div className="h-12 bg-border rounded animate-pulse"></div>
        </div>
      ) : filteredPayslips.length === 0 ? (
        <div className="bg-white border border-border border-dashed rounded-lg py-16 flex flex-col items-center">
          <div className="w-24 h-24 bg-surface-muted rounded-full flex items-center justify-center mb-4">
            <svg className="w-10 h-10 text-ink-soft" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
          </div>
          <p className="text-ink-muted font-medium">No payslips found</p>
        </div>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-left">
              <thead className="bg-surface-muted">
                <tr>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Employee Name</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Period</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Gross</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Net Salary</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Generated</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedPayslips.map(p => {
                  const name = `${p.employee?.firstName || ''} ${p.employee?.lastName || ''}`.trim();
                  return (
                    <tr key={p.id} className="hover:bg-surface-muted transition">
                      <td className="px-6 py-4 text-sm font-medium text-ink">
                        {name}
                        {p.version > 1 && (
                          <span className="ml-2 px-2 py-0.5 text-xs font-bold bg-amber-100 text-amber-800 rounded-full">v{p.version}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        <span className="text-sm">{getMonthName(p.month, p.year)}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-ink-muted">{formatINR(p.grossSalary)}</td>
                      <td className="px-6 py-4 text-sm font-bold text-ink">{formatINR(p.netSalary)}</td>
                      <td className="px-6 py-4 text-sm text-ink-muted">{new Date(p.createdAt).toLocaleDateString()}</td>
                      <td className="px-6 py-4 text-sm font-medium space-x-3">
                        <button
                          onClick={() => setSelectedPayslip(p)}
                          className="text-brand-600 hover:text-brand-900"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="px-6 py-3 border-t border-gray-200 flex justify-between items-center bg-gray-50">
              <button
                disabled={page === 0}
                onClick={() => setPage(p => p - 1)}
                className="px-3 py-1 text-sm border rounded hover:bg-surface-muted disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-sm text-gray-500">Page {page + 1} of {totalPages}</span>
              <button
                disabled={page >= totalPages - 1}
                onClick={() => setPage(p => p + 1)}
                className="px-3 py-1 text-sm border rounded hover:bg-surface-muted disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </Card>
      )}

      {/* Modal */}
      {selectedPayslip && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 animate-fade-in p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl my-8 flex flex-col">
            <div className="p-6 border-b border-border flex justify-between items-center bg-surface-muted rounded-t-xl">
              <div>
                <h2 className="text-2xl font-bold text-ink">Payslip</h2>
                <p className="text-sm text-ink-muted mt-1">
                  {selectedPayslip.employee?.firstName} {selectedPayslip.employee?.lastName} — {getMonthName(selectedPayslip.month, selectedPayslip.year)}
                </p>
              </div>
              <button
                onClick={() => { setSelectedPayslip(null); setShowDisputeForm(false); }}
                className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-200 transition"
              >
                ✕
              </button>
            </div>

            <div className="p-6 flex-1 bg-white">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Earnings Section */}
                <div>
                  <h3 className="text-lg font-semibold text-ink mb-4 border-b border-border pb-2 uppercase tracking-wide text-xs">Earnings</h3>
                  <div className="space-y-3">
                    {Array.isArray(selectedPayslip.earnings) && selectedPayslip.earnings.map((e, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span className="text-ink-muted">{e.label}</span>
                        <span className="font-medium text-ink">{formatINR(e.amount)}</span>
                      </div>
                    ))}
                    <div className="pt-3 border-t border-border mt-3 flex justify-between font-bold text-ink">
                      <span>Gross Earnings</span>
                      <span>{formatINR(selectedPayslip.grossSalary)}</span>
                    </div>
                  </div>
                </div>

                {/* Deductions Section */}
                <div>
                  <h3 className="text-lg font-semibold text-ink mb-4 border-b border-border pb-2 uppercase tracking-wide text-xs">Deductions</h3>
                  <div className="space-y-3">
                    {Array.isArray(selectedPayslip.deductions) && selectedPayslip.deductions.map((d, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span className="text-ink-muted">{d.label}</span>
                        <span className="font-medium text-red-600">{formatINR(d.amount)}</span>
                      </div>
                    ))}
                    <div className="pt-3 border-t border-border mt-3 flex justify-between font-bold text-ink">
                      <span>Total Deductions</span>
                      <span className="text-red-600">{formatINR(selectedPayslip.totalDeductions)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-end">
                <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-right shadow-sm w-full md:w-1/2">
                  <span className="block text-sm text-green-800 font-semibold uppercase mb-1">Net Payable Salary</span>
                  <span className="text-4xl font-extrabold text-green-700">
                    {formatINR(selectedPayslip.netSalary)}
                  </span>
                </div>
              </div>

            </div>

            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center rounded-b-xl">
              <span className="text-xs text-gray-400 font-medium">Version {selectedPayslip.version} — System Generated</span>
              <button
                onClick={() => handleDownloadPdf(selectedPayslip.id)}
                disabled={isDownloading}
                className="px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded hover:bg-brand-700 transition disabled:opacity-50"
              >
                {isDownloading ? 'Opening…' : 'Download PDF'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}



