import { useEffect, useState } from 'react';
import { Card, Button, Input } from '../../../features/ui';
import { Clock, LogIn, LogOut, AlertCircle, CheckCircle2, MessageSquare } from 'lucide-react';
import api from '../../../services/api';

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
    setError('');
    setSuccess('');
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
    setError('');
    setSuccess('');
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
    setChecking(true);
    try {
      await api.post('/attendance/regularize', {
        date: showRegForm.date,
        reason: regReason
      });
      setSuccess('Regularization request submitted for ' + new Date(showRegForm.date).toLocaleDateString());
      setShowRegForm(null);
      setRegReason('');
      await loadAttendance();
    } catch (err) {
      setError(err.message || 'Failed to submit request');
    } finally {
      setChecking(false);
    }
  };

  if (loading) return <div className="p-8 text-ink-muted animate-pulse">Loading attendance records...</div>;

  return (
    <div className="px-8 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-white">Attendance History</h1>
        <p className="mt-1 text-sm text-ink-muted">Manage your daily presence and check-in logs.</p>
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

      {/* Regularization Form (Conditional) */}
      {showRegForm && (
        <Card className="p-6 border-blue-500/30 bg-blue-500/5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <MessageSquare className="h-4 w-4" /> Regularize Attendance: {new Date(showRegForm.date).toLocaleDateString()}
            </h3>
            <button onClick={() => setShowRegForm(null)} className="text-ink-muted hover:text-white">✕</button>
          </div>
          <form onSubmit={handleRegularize} className="space-y-4">
            <Input 
              placeholder="Why was this check-in missed? (e.g. On-site meeting, system error)" 
              value={regReason}
              onChange={e => setRegReason(e.target.value)}
              required
            />
            <div className="flex gap-2">
              <Button type="submit" size="sm" loading={checking}>Submit Request</Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => setShowRegForm(null)}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}

      {/* Attendance History */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <History className="h-5 w-5 text-ink-muted" /> Recent Activity
        </h2>
        
        <Card className="overflow-hidden border-white/5">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/[0.02] text-[10px] font-bold text-ink-muted uppercase tracking-widest border-b border-white/5">
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">In / Out</th>
                <th className="px-6 py-4">Duration</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {attendance.map((record) => (
                <tr key={record.id} className="hover:bg-white/[0.01] transition-colors group">
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-white">{new Date(record.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-xs text-white">
                      {record.checkIn ? new Date(record.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                      <span className="mx-2 text-ink-muted">→</span>
                      {record.checkOut ? new Date(record.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-white font-mono">{record.hoursWorked || '0.00'}h</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-tight border ${
                      record.status === 'PRESENT' ? 'bg-success-500/10 text-success-400 border-success-500/20' : 
                      record.status === 'REGULARIZED' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                      'bg-danger-500/10 text-danger-400 border-danger-500/20'
                    }`}>
                      {record.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {record.status === 'ABSENT' && (
                      <Button variant="ghost" size="sm" className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/5 text-xs h-7" onClick={() => setShowRegForm(record)}>
                        Regularize
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
              {attendance.length === 0 && (
                <tr>
                  <td colSpan="5" className="py-20 text-center text-ink-muted italic text-sm">
                    No attendance records found for your account.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  );
}
