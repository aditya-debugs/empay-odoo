import { useEffect, useState, useRef, useCallback } from 'react';
import { Card, Button } from '../../../features/ui';
import { Clock, LogIn, LogOut, CheckCircle, AlertCircle, History, Search, Zap, List } from 'lucide-react';
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
  const [localSearch, setLocalSearch] = useState('');
  
  const [liveSessionMs, setLiveSessionMs] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const timerRef = useRef(null);

  const clearActiveTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsTimerRunning(false);
  }, []);

  const startActiveTimer = useCallback((startTime) => {
    clearActiveTimer();
    setIsTimerRunning(true);
    timerRef.current = setInterval(() => {
      const now = Date.now();
      setLiveSessionMs(Math.max(0, now - startTime));
    }, 100);
  }, [clearActiveTimer]);

  const loadAttendance = useCallback(async (isInitial = false) => {
    if (isInitial) setLoading(true);
    try {
      const data = await api.get('/attendance/me');
      const records = data.records || [];
      setAttendance(records);
      
      const todayString = new Date().toISOString().split('T')[0];
      const todayRecord = records.find(r => r.date.split('T')[0] === todayString);
      setTodayStatus(todayRecord);

      // Status check from newest logs (DESC)
      if (todayRecord?.logs && todayRecord.logs.length > 0) {
        const latest = todayRecord.logs[0];
        if (latest.type === 'IN') {
           const startTime = new Date(latest.timestamp).getTime();
           startActiveTimer(startTime);
        } else {
           clearActiveTimer();
           setLiveSessionMs(0);
        }
      } else {
        clearActiveTimer();
        setLiveSessionMs(0);
      }
    } catch (err) {
      setError('System Error: Could not synchronize attendance history.');
    } finally {
      if (isInitial) setLoading(false);
    }
  }, [clearActiveTimer, startActiveTimer]);

  useEffect(() => {
    loadAttendance(true);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [loadAttendance]);

  const handleAction = async (actionType) => {
    if (checking) return;
    setChecking(true);
    setError('');
    setSuccess('');

    if (actionType === 'OUT') {
      clearActiveTimer();
    }

    try {
      const endpoint = actionType === 'IN' ? '/attendance/check-in' : '/attendance/check-out';
      await api.post(endpoint, {});
      setSuccess(`${actionType === 'IN' ? 'Shift Started' : 'Shift Stopped'}. Duration precision recorded.`);
      
      // Safety delay for DB consistency
      setTimeout(() => loadAttendance(false), 600);
    } catch (err) {
      setError(err.message || 'Operation failed');
      loadAttendance(false);
    } finally {
      setChecking(false);
    }
  };

  const finishedMs = parseFloat(todayStatus?.hoursWorked || 0) * 1000 * 60 * 60;
  const totalMs = finishedMs + liveSessionMs;
  
  const formatTime = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const formattedTotal = formatTime(totalMs);
  const formattedLive = formatTime(liveSessionMs);
  const formattedFinished = formatTime(finishedMs);

  const filteredHistory = attendance.filter(r => 
    new Date(r.date).toLocaleDateString().includes(localSearch) ||
    r.status.toLowerCase().includes(localSearch.toLowerCase())
  );

  const lastProcessedAction = todayStatus?.logs?.[0];

  if (loading) return <div className="flex h-full items-center justify-center text-ink-muted">Validating Shift History...</div>;

  return (
    <div className="px-8 py-8 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">Daily Timesheet</h1>
          <p className="text-[10px] font-bold text-ink-soft uppercase tracking-widest mt-1">Personnel Portal • Session-Based Accumulation</p>
        </div>
        <div className="relative w-64 group">
           <Search className="absolute left-3 top-2.5 h-4 w-4 text-ink-soft group-focus-within:text-brand-500" />
           <input
              type="text"
              placeholder="Search shift records..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs border border-border rounded-lg bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500/10 focus:border-brand-500 font-medium"
           />
        </div>
      </header>

      {error && <div className="p-3 bg-danger-50 text-danger-700 rounded-lg text-xs border border-danger-100 flex items-center gap-2"><AlertCircle className="h-4 w-4" />{error}</div>}
      {success && <div className="p-3 bg-success-50 text-success-700 rounded-lg text-xs border border-success-100 flex items-center gap-2 font-bold animate-in fade-in fill-mode-both"><CheckCircle className="h-4 w-4" />{success}</div>}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Real-time Tracking Panel */}
        <Card className="lg:col-span-8 p-0 border-border shadow-lg overflow-hidden bg-white">
           <div className="px-6 py-4 flex justify-between items-center border-b border-border bg-surface-muted/30">
              <div className="flex items-center gap-3">
                 <div className={`p-2.5 rounded-xl transition-all ${isTimerRunning ? 'bg-brand-600 text-white shadow-xl shadow-brand-500/30' : 'bg-surface-muted text-ink-muted shadow-inner'}`}>
                    <Clock className="h-4 w-4" />
                 </div>
                 <div className="flex flex-col">
                    <span className="text-[9px] font-bold text-ink-soft uppercase tracking-widest leading-none mb-1">Punch Status</span>
                    <span className="text-[11px] font-bold text-ink uppercase tracking-wider">
                        {isTimerRunning ? 'Shift in Progress' : 'Shift Not Started'}
                    </span>
                 </div>
              </div>
              {isTimerRunning && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-full border border-brand-100 shadow-sm">
                   <div className="h-1.5 w-1.5 rounded-full bg-brand-500 animate-ping" />
                   <span className="text-[10px] font-bold text-brand-600 uppercase">Live Tracking Enabled</span>
                </div>
              )}
           </div>

           <div className="p-12 flex flex-col items-center justify-center">
              <span className="text-[10px] font-bold text-ink-soft uppercase tracking-[0.4em] mb-4">Cumulative Work Hours Accomplished</span>
              <div className="flex items-baseline gap-2 group cursor-default">
                 <span className="text-6xl font-bold text-ink tabular-nums tracking-tighter transition-all group-hover:text-brand-600 font-mono">{formattedTotal}</span>
              </div>
              
              <div className="w-full h-1.5 bg-surface-muted rounded-full mt-10 max-w-md overflow-hidden shadow-inner border border-border/50">
                 <div 
                    className="h-full bg-brand-500 transition-all duration-1000 shadow-[0_0_10px_rgba(59,130,246,0.5)]" 
                    style={{ width: `${Math.min(100, (totalMs / (9 * 3600000)) * 100)}%` }}
                 />
              </div>

              <div className="grid grid-cols-2 gap-4 w-full mt-10 max-w-md">
                <Button
                  size="xl"
                  onClick={() => handleAction('IN')}
                  loading={checking && !isTimerRunning}
                  disabled={isTimerRunning || checking}
                  className="h-16 font-black uppercase tracking-widest text-[11px] shadow-lg shadow-brand-500/10 active:scale-95 transition-all"
                >
                   Punch In
                </Button>
                <Button
                  size="xl"
                  variant="secondary"
                  onClick={() => handleAction('OUT')}
                  loading={checking && isTimerRunning}
                  disabled={!isTimerRunning || checking}
                  className={`h-16 font-black uppercase tracking-widest text-[11px] active:scale-95 transition-all ${isTimerRunning ? 'ring-2 ring-brand-500 border-brand-500' : ''}`}
                >
                   Punch Out
                </Button>
              </div>
           </div>
        </Card>

        {/* Breakdown & Audit Card */}
        <Card className="lg:col-span-4 p-8 border-border shadow-sm flex flex-col justify-between bg-surface-muted/10 border-none shadow-brand-500/5">
           <div className="space-y-8">
              <h3 className="text-[10px] font-bold text-ink-soft uppercase tracking-widest border-b border-border pb-3">Audit Details</h3>
              
              <div className="space-y-4">
                 <div className="p-5 bg-white rounded-2xl border border-border shadow-sm">
                    <span className="text-[10px] font-bold text-ink-soft uppercase tracking-widest block mb-2">Saved History</span>
                    <div className="flex items-baseline gap-1">
                        <span className="text-xl font-bold text-ink font-mono">{formattedFinished}</span>
                    </div>
                 </div>

                 <div className="p-5 bg-brand-50/50 rounded-2xl border border-brand-100 ring-1 ring-brand-100 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-2 opacity-5 scale-150 rotate-12 group-hover:rotate-0 transition-transform">
                        <Zap className="h-12 w-12 text-brand-500" />
                    </div>
                    <span className="text-[10px] font-bold text-brand-700 uppercase tracking-widest block mb-2">Live Session</span>
                    <div className="flex items-baseline gap-1">
                        <span className="text-xl font-bold text-brand-700 font-mono">{formattedLive}</span>
                    </div>
                 </div>
              </div>

              {lastProcessedAction && (
                <div className="flex items-center gap-3 p-4 bg-surface-muted/30 rounded-xl border border-dashed border-border">
                    <div className="p-2 bg-white rounded-lg text-ink-muted">
                        <List className="h-3 w-3" />
                    </div>
                    <div>
                        <p className="text-[9px] font-bold text-ink-soft uppercase tracking-widest">Last Recorded Action</p>
                        <p className="text-[10px] font-bold text-ink uppercase mt-0.5">{lastProcessedAction.type} at {new Date(lastProcessedAction.timestamp).toLocaleTimeString()}</p>
                    </div>
                </div>
              )}
           </div>

           <div className="mt-8">
              <p className="text-[9px] text-ink-soft leading-relaxed font-bold uppercase tracking-tight text-center italic opacity-60">
                Resumes automatically: Your daily total is maintained as the sum of every verified session.
              </p>
           </div>
        </Card>
      </div>

      <Card className="border-border shadow-sm overflow-hidden bg-white">
        <div className="px-6 py-4 bg-surface-muted/10 border-b border-border flex items-center gap-2">
          <History className="h-3 w-3 text-ink-soft" />
          <h2 className="text-[10px] font-bold text-ink-soft uppercase tracking-widest">Log Timeline (Today)</h2>
        </div>
        <div className="p-6 max-h-64 overflow-y-auto">
          <div className="space-y-4 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-px before:bg-border">
            {todayStatus?.logs?.map((log, idx) => (
              <div key={idx} className="relative pl-8 animate-in fade-in slide-in-from-left-2 duration-300" style={{ animationDelay: `${idx*100}ms` }}>
                <div className={`absolute left-0 top-1.5 h-2.5 w-2.5 rounded-full border-2 border-white shadow-sm ring-2 ring-transparent transition-all ${log.type === 'IN' ? 'bg-success-500' : 'bg-danger-500'}`} />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded shadow-sm ${log.type === 'IN' ? 'bg-success-50 text-success-700 ring-1 ring-success-100' : 'bg-danger-50 text-danger-700 ring-1 ring-danger-100'}`}>{log.type}</span>
                    <span className="text-[11px] text-ink font-bold uppercase tracking-tight opacity-70">Shift Marker Verified</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-3 w-3 text-ink-muted" />
                    <span className="text-[10px] font-bold text-ink-muted font-mono">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                  </div>
                </div>
              </div>
            ))}
            {!todayStatus?.logs?.length && <div className="text-center py-10 text-[10px] font-bold text-ink-soft uppercase tracking-widest italic">Initialize session to view log history</div>}
          </div>
        </div>
      </Card>
      
      {/* Historical Records Table */}
      <Card className="overflow-hidden border-border shadow-lg bg-white">
        <table className="w-full text-xs text-left">
          <thead className="bg-surface-muted/40 text-ink-soft font-bold uppercase text-[9px] tracking-widest border-b border-border">
            <tr>
              <th className="py-5 px-8">Payroll Period / Date</th>
              <th className="py-5 px-8">Aggregated Work Effort</th>
              <th className="py-5 px-8 text-right">Verification</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredHistory.map((record) => (
              <tr key={record.id} className="hover:bg-brand-50/10 transition-colors group">
                <td className="py-5 px-8 font-bold text-ink group-hover:text-brand-600 transition-colors">{new Date(record.date).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</td>
                <td className="py-5 px-8">
                    <div className="flex items-center gap-2">
                        <span className="font-black text-brand-600 text-sm tracking-tight font-mono">
                          {(() => {
                            const secs = Math.floor(parseFloat(record.hoursWorked || 0) * 3600);
                            const h = Math.floor(secs / 3600);
                            const m = Math.floor((secs % 3600) / 60);
                            const s = secs % 60;
                            return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
                          })()}
                        </span>
                        <span className="text-[9px] font-black text-ink-soft uppercase shadow-sm border border-brand-100 bg-brand-50 rounded px-1 min-w-[24px] text-center">HRS</span>
                    </div>
                </td>
                <td className="py-5 px-8 text-right">
                   <span className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase shadow-sm border ${
                    record.status === 'PRESENT' ? 'bg-success-50 text-success-600 border-success-100' : 'bg-danger-50 text-danger-600 border-danger-100'
                  }`}>
                    {record.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
