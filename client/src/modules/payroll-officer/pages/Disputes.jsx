import { useState, useEffect, useMemo } from 'react';
import { Card } from '../../../features/ui';
import { useAuth } from '../../../features/auth/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../../../services/api';

const TABS = [
  { id: 'All', label: 'All' },
  { id: 'OPEN', label: 'Open' },
  { id: 'RESOLVED', label: 'Resolved' },
  { id: 'REVISED', label: 'Reissued' },
  { id: 'REJECTED', label: 'Rejected' },
];

export default function Disputes() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [activeTab, setActiveTab] = useState('All');
  
  // Modals state
  const [activeModal, setActiveModal] = useState(null); // 'resolve' | 'reject' | 'reissue'
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  useEffect(() => {
    if (user?.role === 'EMPLOYEE') {
      navigate('/employee/payslips', { replace: true });
    }
  }, [user, navigate]);

  const fetchDisputes = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/payslip-disputes');
      setDisputes(res.disputes || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch disputes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDisputes();
  }, []);

  useEffect(() => {
    if (toastMessage) {
      const t = setTimeout(() => setToastMessage(null), 4000);
      return () => clearTimeout(t);
    }
  }, [toastMessage]);

  const filteredDisputes = useMemo(() => {
    if (activeTab === 'All') return disputes;
    return disputes.filter(d => d.status === activeTab);
  }, [disputes, activeTab]);

  const openModal = (dispute, type) => {
    setSelectedDispute(dispute);
    setActiveModal(type);
    setNote('');
  };

  const closeModal = () => {
    setActiveModal(null);
    setSelectedDispute(null);
    setNote('');
  };

  const submitAction = async () => {
    if ((activeModal === 'resolve' || activeModal === 'reject') && !note.trim()) {
      return; // Required
    }
    
    setSubmitting(true);
    try {
      const statusMap = { resolve: 'RESOLVED', reject: 'REJECTED', reissue: 'RESOLVED' };
      await api.patch(`/payslip-disputes/${selectedDispute.id}/resolve`, {
        status: statusMap[activeModal],
        resolution: note,
      });
      setToastMessage(`Dispute ${activeModal}d successfully!`);
      closeModal();
      fetchDisputes();
    } catch (err) {
      setToastMessage(`Failed: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const openCount = disputes.filter(d => d.status === 'OPEN').length;
  const isOfficerOrAdmin = user?.role === 'PAYROLL_OFFICER' || user?.role === 'ADMIN';

  const getStatusBadge = (status) => {
    switch(status) {
      case 'OPEN': return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">OPEN</span>;
      case 'RESOLVED': return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">RESOLVED</span>;
      case 'REVISED': return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">REISSUED</span>;
      case 'REJECTED': return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">REJECTED</span>;
      default: return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  const getMonthName = (monthNum, yearNum) => {
    if (!monthNum || !yearNum) return '';
    return new Date(`${yearNum}-${String(monthNum).padStart(2, '0')}-01`).toLocaleString('default', { month: 'long', year: 'numeric' });
  };

  return (
    <div className="px-8 py-8 animate-fade-in space-y-6 relative">
      {toastMessage && (
        <div className="fixed top-4 right-4 z-[80] bg-gray-800 text-white px-4 py-3 rounded shadow-lg animate-fade-in">
          {toastMessage}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-gray-900">Payslip Disputes</h1>
          <p className="mt-1 text-sm text-gray-500">Manage and resolve employee payslip issues</p>
        </div>
        <div className="bg-red-50 text-red-700 px-4 py-2 rounded-lg font-bold border border-red-100">
          {openCount} Open Disputes
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 border-b border-gray-200">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id 
                ? 'border-brand-600 text-brand-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table */}
      {error ? (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg">{error}</div>
      ) : loading ? (
        <div className="space-y-4">
          <div className="h-12 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-12 bg-gray-200 rounded animate-pulse"></div>
        </div>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-left">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Employee</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Month</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Reason</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Raised On</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                  {isOfficerOrAdmin && <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredDisputes.map(d => {
                  const empName = d.payslip?.employee 
                    ? `${d.payslip.employee.firstName} ${d.payslip.employee.lastName}` 
                    : d.raisedBy?.name || 'Unknown';
                  const period = getMonthName(d.payslip?.month, d.payslip?.year) || 'Unknown';
                  const truncatedReason = d.reason?.length > 60 ? d.reason.substring(0, 60) + '...' : d.reason;

                  return (
                    <tr key={d.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{empName}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{period}</td>
                      <td className="px-6 py-4 text-sm text-gray-700 max-w-xs" title={d.reason}>{truncatedReason}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{new Date(d.createdAt).toLocaleDateString()}</td>
                      <td className="px-6 py-4">{getStatusBadge(d.status)}</td>
                      {isOfficerOrAdmin && (
                        <td className="px-6 py-4 text-right space-x-3 text-sm font-medium">
                          {d.status === 'OPEN' ? (
                            <>
                              <button onClick={() => openModal(d, 'resolve')} className="text-green-600 hover:text-green-900">Resolve</button>
                              <button onClick={() => openModal(d, 'reissue')} className="text-blue-600 hover:text-blue-900">Reissue</button>
                              <button onClick={() => openModal(d, 'reject')} className="text-red-600 hover:text-red-900">Reject</button>
                            </>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
                {filteredDisputes.length === 0 && (
                  <tr>
                    <td colSpan={isOfficerOrAdmin ? 6 : 5} className="px-6 py-8 text-center text-gray-500">
                      No disputes found in this category.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Modals */}
      {activeModal && selectedDispute && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 animate-fade-in p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 capitalize">{activeModal} Dispute</h2>
            </div>
            
            <div className="p-6">
              {activeModal === 'reissue' && (
                <div className="mb-4 bg-amber-50 text-amber-800 p-4 rounded-lg border border-amber-200 text-sm">
                  <strong>Warning:</strong> A new payslip version will be generated. The employee will be notified.
                </div>
              )}
              
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {activeModal === 'reissue' ? 'Resolution note (optional)' : 'Resolution note (required)'}
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-brand-500 focus:border-brand-500 outline-none"
                rows="4"
                placeholder="Explain the decision..."
              ></textarea>
            </div>

            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
              <button 
                onClick={closeModal} 
                disabled={submitting}
                className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-md transition font-medium"
              >
                Cancel
              </button>
              <button 
                onClick={submitAction}
                disabled={submitting || ((activeModal === 'resolve' || activeModal === 'reject') && !note.trim())}
                className={`px-4 py-2 text-white rounded-md transition font-medium disabled:opacity-50 ${
                  activeModal === 'resolve' ? 'bg-green-600 hover:bg-green-700' : 
                  activeModal === 'reissue' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {submitting ? 'Processing...' : `Confirm ${activeModal}`}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
