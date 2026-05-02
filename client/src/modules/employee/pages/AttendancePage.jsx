import { useEffect, useState } from 'react';
import { Card, Button, Input } from '../../../features/ui';
import { Clock, LogIn, LogOut, AlertCircle, CheckCircle2, MessageSquare } from 'lucide-react';
import api from '../../../services/api';

function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/50 p-4">
      <Card className="w-full max-w-md p-6 relative">
        <button onClick={onClose} className="absolute right-4 top-4 text-ink-muted hover:text-ink">
          <X className="h-5 w-5" />
        </button>
        <h2 className="text-lg font-bold text-ink mb-4">{title}</h2>
        {children}
      </Card>
    </div>
  );
}

export default function AttendancePage() {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [todayStatus, setTodayStatus] = useState(null);

  // Regularization state
  const [showRegForm, setShowRegForm] = useState(null); // Will hold the record to regularize
  const [regReason, setRegReason] = useState('');

  const [regModalOpen, setRegModalOpen] = useState(false);
  const [regDate, setRegDate] = useState('');
  const [regReason, setRegReason] = useState('');
  const [regSubmitting, setRegSubmitting] = useState(false);

  useEffect(() => {
    loadAttendance();
  }, []);

  const loadAttendance = async () => {
    setLoading(true);
    try {
      const data = await api.get('/attendance/me');
      setAttendance(data.records || []);

      const today = new Date().toISOString().split('T')[0];
      const todayRecord = data.records?.find(r => r.date.split('T')[0] === today);
      setTodayStatus(todayRecord);
    } catch (err) {
      setError(err.message || 'Failed to load attendance');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    setChecking(true);
    setError(''); setSuccess('');
    try {
      const response = await api.post('/attendance/check-in', {});
      setSuccess('Checked in successfully!');
      setTodayStatus(response.attendance);
      await loadAttendance();
    } catch (err) {
      setError(err.message || 'Failed to check in');
    } finally {
      setChecking(false);
    }
  };

  const handleCheckOut = async () => {
    setChecking(true);
    setError(''); setSuccess('');
    try {
      const response = await api.post('/attendance/check-out', {});
      setSuccess('Checked out successfully!');
      setTodayStatus(response.attendance);
      await loadAttendance();
    } catch (err) {
      setError(err.message || 'Failed to check out');
    } finally {
      setChecking(false);
    }
  };

  const handleRegularize = async (e) => {
    e.preventDefault();
    setRegSubmitting(true);
    setError(''); setSuccess('');
    try {
      await api.post('/attendance/regularize', { date: regDate, reason: regReason });
      setSuccess('Regularization request submitted successfully.');
      setRegModalOpen(false);
      setRegDate('');
      setRegReason('');
    } catch (err) {
      setError(err.message || 'Failed to submit regularization request');
    } finally {
      setRegSubmitting(false);
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="px-8 py-8 relative">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">My Attendance</h1>
          <p className="mt-1 text-sm text-ink-muted">Track your check-in and check-out times</p>
        </div>
        <Button variant="outline" leftIcon={<AlertCircle className="h-4 w-4" />} onClick={() => setRegModalOpen(true)}>
          Regularize Attendance
        </Button>
      </div>

      {error && <div className="p-3 bg-danger-500/10 border border-danger-500/50 rounded-xl text-danger-400 text-sm flex items-center gap-2">
        <AlertCircle className="h-4 w-4" /> {error}
      </div>}
      {success && <div className="p-3 bg-success-500/10 border border-success-500/50 rounded-xl text-success-400 text-sm flex items-center gap-2">
        <CheckCircle2 className="h-4 w-4" /> {success}
      </div>}

      {/* Check-in/Out Controls */}
      <Card className="p-6 bg-gradient-to-br from-blue-600/20 to-indigo-600/20 border-white/10 relative overflow-hidden group">
        <div className="absolute -right-12 -top-12 opacity-5 group-hover:opacity-10 transition-opacity">
          <Clock className="h-48 w-48 text-white" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
          <div>
            <p className="text-xs font-medium text-blue-400 uppercase tracking-wider">Status Today</p>
            <div className="flex items-center gap-3 mt-2">
              <div className={`h-3 w-3 rounded-full animate-pulse ${todayStatus?.checkIn ? 'bg-success-500' : 'bg-danger-500'}`} />
              <p className="text-xl font-bold text-white">
                {todayStatus?.checkIn ? (todayStatus?.checkOut ? 'Completed' : 'Active') : 'Not Started'}
              </p>
            </div>
            {todayStatus?.checkIn && (
              <p className="text-xs text-ink-muted mt-2">
                Started at {new Date(todayStatus.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            )}
          </div>

          <div>
            <p className="text-xs font-medium text-blue-400 uppercase tracking-wider">Time Tracked</p>
            <p className="text-3xl font-bold text-white mt-1">
              {todayStatus?.hoursWorked || '0.00'} <span className="text-sm font-normal text-ink-muted">hrs</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            {!todayStatus?.checkIn ? (
              <Button onClick={handleCheckIn} loading={checking} className="w-full bg-blue-600 hover:bg-blue-500 text-white border-none shadow-lg shadow-blue-500/20">
                <LogIn className="h-4 w-4 mr-2" /> Check In
              </Button>
            ) : !todayStatus?.checkOut ? (
              <Button onClick={handleCheckOut} loading={checking} className="w-full bg-white text-black hover:bg-white/90 border-none shadow-lg">
                <LogOut className="h-4 w-4 mr-2" /> Check Out
              </Button>
            ) : (
              <Button disabled className="w-full bg-white/5 text-ink-muted border-white/10">
                Work Finished
              </Button>
            )}
          </div>
        </div>
      </Card>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Recent Attendance</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-ink-200">
              <tr>
                <th className="text-left py-3 px-4 font-semibold">Date</th>
                <th className="text-left py-3 px-4 font-semibold">Check-in</th>
                <th className="text-left py-3 px-4 font-semibold">Check-out</th>
                <th className="text-left py-3 px-4 font-semibold">Hours</th>
                <th className="text-left py-3 px-4 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {attendance.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-8 text-ink-muted">No attendance records yet</td>
                </tr>
              ) : (
                attendance.map((record) => (
                  <tr key={record.id} className="border-b border-ink-100 hover:bg-ink-50">
                    <td className="py-3 px-4">{new Date(record.date).toLocaleDateString()}</td>
                    <td className="py-3 px-4">{record.checkIn ? new Date(record.checkIn).toLocaleTimeString() : '-'}</td>
                    <td className="py-3 px-4">{record.checkOut ? new Date(record.checkOut).toLocaleTimeString() : '-'}</td>
                    <td className="py-3 px-4">{record.hoursWorked || 0} hrs</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${record.status === 'PRESENT' ? 'bg-success-100 text-success-700' :
                          record.status === 'REGULARIZED' ? 'bg-brand-100 text-brand-700' :
                            'bg-danger-100 text-danger-700'
                        }`}>
                        {record.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </Card>
      </div>

      <Modal isOpen={regModalOpen} onClose={() => setRegModalOpen(false)} title="Request Regularization">
        <form onSubmit={handleRegularize} className="space-y-4">
          <Input
            label="Date of missed attendance"
            type="date"
            required
            value={regDate}
            onChange={(e) => setRegDate(e.target.value)}
            max={new Date().toISOString().split('T')[0]}
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-ink">Reason / Proof Details</label>
            <textarea
              required
              className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-ink focus:border-brand-500 focus:outline-none min-h-[100px]"
              placeholder="E.g., I was present but forgot to swipe in because..."
              value={regReason}
              onChange={(e) => setRegReason(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full" loading={regSubmitting}>Submit Request</Button>
        </form>
      </Modal>
    </div>
  );
}
