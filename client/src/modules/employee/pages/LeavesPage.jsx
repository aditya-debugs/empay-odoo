import { useEffect, useState } from 'react';
import { Card, Button, Input } from '../../../features/ui';
import { Calendar, Plus, FileText, CheckCircle, Clock, AlertCircle, Camera, Search } from 'lucide-react';
import api from '../../../services/api';

export default function LeavesPage() {
  const [leaves, setLeaves] = useState([]);
  const [balances, setBalances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [localSearch, setLocalSearch] = useState('');

  const [formData, setFormData] = useState({
    type: 'PAID_LEAVE',
    startDate: '',
    endDate: '',
    reason: ''
  });

  const [selectedFileName, setSelectedFileName] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [leavesData, balancesData] = await Promise.all([
        api.get('/leave/me'),
        api.get('/leave/balance')
      ]);
      setLeaves(leavesData.leaves || []);
      setBalances(balancesData.balances || []);
    } catch (err) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFileName(file.name);
      setSelectedFile(file);
    }
  };

  const handleApplyLeave = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    // Frontend Validation
    if (!formData.startDate || !formData.endDate) {
      setError('Please select both a start date and an end date.');
      setSubmitting(false);
      return;
    }

    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    const startYear = start.getFullYear();
    const endYear = end.getFullYear();
    const currentYear = new Date().getFullYear();

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      setError('Invalid date entered. Please check and re-enter the dates.');
      setSubmitting(false);
      return;
    }

    if (startYear < 2000 || startYear > currentYear + 2) {
      setError(`Invalid start year "${startYear}". Please enter a valid year (e.g. ${currentYear}).`);
      setSubmitting(false);
      return;
    }

    if (endYear < 2000 || endYear > currentYear + 2) {
      setError(`Invalid end year "${endYear}". Please enter a valid year (e.g. ${currentYear}).`);
      setSubmitting(false);
      return;
    }

    if (end < start) {
      setError('Invalid Dates: End date cannot be earlier than start date.');
      setSubmitting(false);
      return;
    }

    if (formData.type === 'SICK_LEAVE' && !selectedFile) {
      setError('Validation Error: Medical certificate is mandatory for sick leave.');
      setSubmitting(false);
      return;
    }

    try {
      if (formData.type === 'SICK_LEAVE' && selectedFile) {
        const payload = new FormData();
        payload.append('type', formData.type);
        payload.append('startDate', formData.startDate);
        payload.append('endDate', formData.endDate);
        payload.append('reason', formData.reason);
        payload.append('attachment', selectedFile);
        await api.post('/leave/apply', payload);
      } else {
        await api.post('/leave/apply', formData);
      }

      setSuccess('Leave request submitted successfully and documented in database.');
      setFormData({ type: 'PAID_LEAVE', startDate: '', endDate: '', reason: '' });
      setSelectedFileName('');
      setSelectedFile(null);
      setShowForm(false);
      await loadData();
    } catch (err) {
      setError(err.message || 'Failed to submit leave request');
    } finally {
      setSubmitting(false);
    }
  };

  // Local Search Filtering
  const filteredLeaves = leaves.filter(l => 
    l.type.replace('_', ' ').toLowerCase().includes(localSearch.toLowerCase()) ||
    l.reason.toLowerCase().includes(localSearch.toLowerCase()) ||
    l.status.toLowerCase().includes(localSearch.toLowerCase())
  );

  if (loading) return <div className="flex h-full items-center justify-center text-ink-muted">Loading System...</div>;

  return (
    <div className="px-8 py-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">Time Off</h1>
          <p className="mt-1 text-xs font-medium text-ink-soft uppercase tracking-widest">Leave Management • Balance Tracking</p>
        </div>
        <div className="flex gap-3">
           <div className="relative w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-ink-soft" />
            <input
               type="text"
               placeholder="Search leave history..."
               value={localSearch}
               onChange={(e) => setLocalSearch(e.target.value)}
               className="w-full pl-9 pr-4 py-2 text-xs border border-border rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>
          <Button
            onClick={() => setShowForm(!showForm)}
            variant={showForm ? 'secondary' : 'primary'}
            className="text-xs font-semibold"
          >
            {showForm ? 'Cancel Application' : 'New Leave Request'}
          </Button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-danger-50 text-danger-700 rounded-lg text-sm border border-danger-100">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 p-3 bg-success-50 text-success-700 rounded-lg text-sm border border-success-100">
          <CheckCircle className="h-4 w-4" />
          {success}
        </div>
      )}

      {/* Leave Balances Visualization */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {balances.map((balance) => {
          const available = balance.totalDays - balance.usedDays;
          const percentage = (available / balance.totalDays) * 100;
          return (
            <Card key={balance.type} className="p-5 border-none shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-bold uppercase tracking-widest text-ink-soft">
                  {balance.type.replace('_', ' ')}
                </span>
                <Clock className="h-4 w-4 text-ink-muted/50" />
              </div>
              <div className="mt-4">
                <div className="text-xl font-semibold text-ink">{available} <span className="text-xs font-medium text-ink-muted">days left</span></div>
                <div className="mt-3 h-1 w-full bg-surface-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-brand-500 rounded-full" 
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <div className="mt-2 flex justify-between text-[9px] font-bold text-ink-soft uppercase tracking-tighter">
                  <span>Used: {balance.usedDays}</span>
                  <span>Total: {balance.totalDays}</span>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Apply Leave Form */}
      {showForm && (
        <Card className="p-6 border-border shadow-md">
          <h2 className="text-sm font-bold text-ink uppercase tracking-wider mb-6 pb-2 border-b border-border">Submit New Application</h2>
          <form onSubmit={handleApplyLeave} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest mb-2 text-ink-soft">Leave Category</label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="w-full h-10 px-4 bg-white border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-brand-500 transition-all cursor-pointer"
                >
                  <option value="PAID_LEAVE">Paid Leave</option>
                  <option value="UNPAID_LEAVE">Unpaid Leave</option>
                  <option value="SICK_LEAVE">Sick Leave</option>
                  <option value="CASUAL_LEAVE">Casual Leave</option>
                </select>
              </div>
              <Input
                label="Start Date"
                name="startDate"
                type="date"
                value={formData.startDate}
                onChange={handleInputChange}
                required
              />
              <Input
                label="End Date"
                name="endDate"
                type="date"
                value={formData.endDate}
                onChange={handleInputChange}
                required
              />
            </div>

            <Input
              label="Justification"
              name="reason"
              multiline
              rows={3}
              placeholder="Explain the context of your absence..."
              value={formData.reason}
              onChange={handleInputChange}
              required
            />

            {/* Native File/Photo Upload for Sick Leave */}
            {formData.type === 'SICK_LEAVE' && (
              <div className="p-5 bg-surface-muted/50 rounded-xl border border-dashed border-border-strong group hover:border-brand-500 transition-colors">
                <div className="flex flex-col items-center justify-center gap-3 text-center">
                   <div className="p-3 bg-white rounded-full shadow-sm text-brand-500 ring-4 ring-brand-50">
                    <Camera className="h-5 w-5" />
                   </div>
                   <div>
                     <h4 className="text-xs font-bold text-ink uppercase tracking-wide">Attach Medical Proof</h4>
                     <p className="text-[10px] text-ink-soft mt-1">Files will be safely stored in the system vault.</p>
                   </div>
                   <label className="relative cursor-pointer">
                      <span className="inline-flex items-center px-6 py-2 bg-brand-500 text-white rounded-lg text-xs font-bold hover:bg-brand-600 transition-shadow shadow-lg shadow-brand-500/20">
                        {selectedFileName ? 'Replace Document' : 'Upload File / Photo'}
                      </span>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*,.pdf"
                        onChange={handleFileChange}
                      />
                   </label>
                   {selectedFileName && (
                     <div className="mt-2 flex items-center gap-2 text-[10px] font-bold text-brand-600 bg-brand-50 px-3 py-1.5 rounded-full ring-1 ring-brand-200">
                       <FileText className="h-3 w-3" />
                       {selectedFileName} (Ready for attachment)
                     </div>
                   )}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="text-xs font-semibold"
                onClick={() => setShowForm(false)}
              >
                Go Back
              </Button>
              <Button
                type="submit"
                loading={submitting}
                className="px-8 text-xs font-semibold"
              >
                Validate & Sign
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* History Table */}
      <Card className="overflow-hidden border-border shadow-sm">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-surface-muted/20">
          <h2 className="text-sm font-semibold text-ink">Time Off Logs</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-surface-muted/30 text-ink-soft uppercase text-[9px] font-bold tracking-widest">
              <tr>
                <th className="py-3 px-6">Type</th>
                <th className="py-3 px-6">Period</th>
                <th className="py-3 px-6">Accrued Days</th>
                <th className="py-3 px-6">Status</th>
                <th className="py-3 px-6 text-right">Evidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredLeaves.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-16 text-ink-soft italic">
                    {localSearch ? `No results for "${localSearch}"` : 'Your leave history is currently empty.'}
                  </td>
                </tr>
              ) : (
                filteredLeaves.map((leave) => (
                  <tr key={leave.id} className="hover:bg-surface-muted/10 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-semibold text-ink">{leave.type.replace('_', ' ')}</div>
                      <div className="text-[10px] text-ink-soft truncate max-w-[200px] mt-0.5" title={leave.reason}>{leave.reason}</div>
                    </td>
                    <td className="py-4 px-6 text-ink-soft font-medium">
                      {new Date(leave.startDate).toLocaleDateString()} – {new Date(leave.endDate).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-6">
                      <span className="font-semibold text-ink">{leave.days}</span>
                      <span className="ml-1 text-ink-soft italic">Units</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                        leave.status === 'APPROVED' ? 'bg-success-50 text-success-600' :
                        leave.status === 'REJECTED' ? 'bg-danger-50 text-danger-600' :
                        'bg-warning-50 text-warning-600'
                      }`}>
                        {leave.status}
                      </span>
                      {leave.reviewNote && <div className="text-[10px] text-ink-soft mt-1 italic">Note: "{leave.reviewNote}"</div>}
                    </td>
                    <td className="py-4 px-6 text-right">
                      {leave.attachmentUrl ? (
                        <a href={`${import.meta.env.VITE_API_URL.replace('/api/v1', '')}/uploads/${leave.attachmentUrl}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-[10px] font-bold text-brand-600 hover:text-brand-700 cursor-pointer">
                           <FileText className="h-3 w-3" />
                           VIEW ATTACHMENT
                        </a>
                      ) : (
                        <span className="text-[9px] text-ink-soft">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
