import { useEffect, useState } from 'react';
import { Card, Button, Input } from '../../../features/ui';
import { Calendar, Plus } from 'lucide-react';
import api from '../../../services/api';

export default function LeavesPage() {
  const [leaves, setLeaves] = useState([]);
  const [balances, setBalances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState({
    type: 'PAID_LEAVE',
    startDate: '',
    endDate: '',
    reason: ''
  });

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

  const handleApplyLeave = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      await api.post('/leave/apply', formData);
      setSuccess('Leave request submitted successfully');
      setFormData({ type: 'PAID_LEAVE', startDate: '', endDate: '', reason: '' });
      setShowForm(false);
      await loadData();
    } catch (err) {
      setError(err.message || 'Failed to submit leave request');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="px-8 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Time Off</h1>
          <p className="mt-1 text-sm text-ink-muted">Manage your leave requests and view balances</p>
        </div>
        <Button
          onClick={() => setShowForm(!showForm)}
          leftIcon={<Plus className="h-4 w-4" />}
        >
          Apply Leave
        </Button>
      </div>

      {error && <div className="mt-4 p-3 bg-danger-50 text-danger-700 rounded-lg text-sm">{error}</div>}
      {success && <div className="mt-4 p-3 bg-success-50 text-success-700 rounded-lg text-sm">{success}</div>}

      {/* Apply Leave Form */}
      {showForm && (
        <Card className="mt-6 p-6">
          <form onSubmit={handleApplyLeave} className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium mb-1">Leave Type</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-ink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="PAID_LEAVE">Paid Leave</option>
                <option value="UNPAID_LEAVE">Unpaid Leave</option>
                <option value="SICK_LEAVE">Sick Leave</option>
                <option value="CASUAL_LEAVE">Casual Leave</option>
              </select>
            </div>
            <div />
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
            <Input
              label="Reason"
              name="reason"
              value={formData.reason}
              onChange={handleInputChange}
              className="md:col-span-2"
              required
            />
            <div className="md:col-span-2 flex gap-2">
              <Button
                type="submit"
                loading={submitting}
                leftIcon={<Calendar className="h-4 w-4" />}
              >
                Submit Request
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Leave Balances */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Your Leave Balance</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {balances.map((balance) => (
            <Card key={balance.type} className="p-4">
              <p className="text-sm font-medium text-ink-muted">{balance.type.replace('_', ' ')}</p>
              <div className="mt-3 space-y-2">
                <div className="flex justify-between">
                  <span className="text-xs text-ink-muted">Total Days:</span>
                  <span className="text-sm font-semibold">{balance.totalDays}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-ink-muted">Used Days:</span>
                  <span className="text-sm font-semibold">{balance.usedDays}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-ink-muted">Available:</span>
                  <span className="text-sm font-semibold text-success-600">
                    {balance.totalDays - balance.usedDays}
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Leave History */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Leave History</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-ink-200">
              <tr>
                <th className="text-left py-3 px-4 font-semibold">Type</th>
                <th className="text-left py-3 px-4 font-semibold">From</th>
                <th className="text-left py-3 px-4 font-semibold">To</th>
                <th className="text-left py-3 px-4 font-semibold">Days</th>
                <th className="text-left py-3 px-4 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {leaves.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-8 text-ink-muted">
                    No leave records yet
                  </td>
                </tr>
              ) : (
                leaves.map((leave) => (
                  <tr key={leave.id} className="border-b border-ink-100 hover:bg-ink-50">
                    <td className="py-3 px-4">{leave.type.replace('_', ' ')}</td>
                    <td className="py-3 px-4">{new Date(leave.startDate).toLocaleDateString()}</td>
                    <td className="py-3 px-4">{new Date(leave.endDate).toLocaleDateString()}</td>
                    <td className="py-3 px-4">{leave.days} days</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        leave.status === 'APPROVED' ? 'bg-success-100 text-success-700' :
                        leave.status === 'REJECTED' ? 'bg-danger-100 text-danger-700' :
                        'bg-warning-100 text-warning-700'
                      }`}>
                        {leave.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
