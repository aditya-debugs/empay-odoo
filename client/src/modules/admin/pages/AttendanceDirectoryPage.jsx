import { useEffect, useRef, useState } from 'react';
import { Card, Input, Avatar, Tabs, Button, DateInput, AttendanceStatusBadge } from '../../../features/ui';
import { Search, RefreshCw, CheckCircle2 } from 'lucide-react';
import api from '../../../services/api';

const REFRESH_INTERVAL_MS = 30_000; // auto-refresh every 30 seconds for real-time attendance

export default function AttendanceDirectoryPage() {
  const [attendance, setAttendance] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [activeTab, setActiveTab] = useState('daily');
  const [lastRefreshed, setLastRefreshed] = useState(null);
  const timerRef = useRef(null);

  const tabs = [
    { key: 'daily', label: 'Daily Attendance' },
    { key: 'requests', label: 'Regularization Requests' }
  ];

  useEffect(() => {
    if (activeTab === 'daily') {
      loadAttendance();
      // Auto-refresh only for today's date
      if (date === new Date().toISOString().split('T')[0]) {
        timerRef.current = setInterval(loadAttendance, REFRESH_INTERVAL_MS);
      }
    } else {
      loadRequests();
    }
    return () => clearInterval(timerRef.current);
  }, [date, search, activeTab]);

  const loadAttendance = async () => {
    setLoading(true);
    try {
      const data = await api.get(`/attendance?date=${date}&search=${encodeURIComponent(search)}`);
      setAttendance(data.records || []);
      setLastRefreshed(new Date());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadRequests = async () => {
    setLoading(true);
    try {
      const data = await api.get(`/attendance/regularize`);
      setRequests(data.requests || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const reviewRequest = async (id, status) => {
    try {
      await api.patch(`/attendance/regularize/${id}`, { status });
      loadRequests();
    } catch (err) {
      alert('Failed to review request');
    }
  };

  // Summary counts
  const summary = attendance.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="px-8 py-8 bg-surface min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Attendance</h1>
          <p className="mt-1 text-sm text-ink-muted">Monitor and manage attendance in real time</p>
        </div>
        {activeTab === 'daily' && lastRefreshed && (
          <div className="flex items-center gap-2 text-xs text-ink-muted">
            <span>Last updated: {lastRefreshed.toLocaleTimeString()}</span>
            <button
              onClick={loadAttendance}
              className="flex items-center gap-1 text-xs text-brand-600 font-semibold hover:underline"
            >
              <RefreshCw className="h-3 w-3" /> Refresh
            </button>
          </div>
        )}
      </div>

      <div className="mt-6">
        <Tabs tabs={tabs} activeKey={activeTab} onChange={setActiveTab} />
      </div>

      {activeTab === 'daily' && (
        <div className="mt-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div className="flex-1 max-w-md">
              <Input
                placeholder="Search employees..."
                leftIcon={<Search className="h-4 w-4" />}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <DateInput
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-48"
            />
          </div>

          {/* Summary strip */}
          {!loading && attendance.length > 0 && (
            <div className="mb-6 flex flex-wrap gap-3">
              {[
                { key: 'PRESENT', label: 'Present' },
                { key: 'REGULARIZED', label: 'Regularized' },
                { key: 'ON_LEAVE', label: 'On Leave' },
                { key: 'ABSENT', label: 'Absent' },
              ].map(({ key, label }) => (
                <div key={key} className="flex items-center gap-2 rounded-full border border-border bg-white px-4 py-1.5 shadow-sm">
                  <AttendanceStatusBadge status={key} />
                  <span className="text-sm font-semibold text-ink">{summary[key] || 0}</span>
                  <span className="text-xs text-ink-muted">{label}</span>
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
            {loading ? (
              [1,2,3,4,5,6].map(i => (
                <div key={i} className="h-24 bg-white rounded-2xl animate-pulse border border-border" />
              ))
            ) : attendance.length === 0 ? (
              <div className="col-span-full py-20 text-center text-ink-muted font-medium">No employees found</div>
            ) : (
              attendance.map((record) => (
                <Card key={record.id} className="p-4 flex items-center gap-4 hover:shadow-md transition-shadow">
                  <Avatar name={record.employee?.user?.name} size="md" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-ink truncate">{record.employee?.user?.name}</h3>
                    <div className="text-xs text-ink-muted mt-0.5">{record.employee?.department || '—'}</div>
                    <div className="flex items-center gap-2 mt-1.5">
                      <AttendanceStatusBadge status={record.status} mode="badge" />
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-bold text-ink">
                      {record.checkIn
                        ? new Date(record.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : '—'}
                    </div>
                    <div className="text-[10px] uppercase tracking-wider text-ink-muted">
                      {record.checkIn ? 'Check-in' : record.status === 'ON_LEAVE' ? 'On Leave' : 'No check-in'}
                    </div>
                    {parseFloat(record.hoursWorked) > 0 && (
                        <div className="text-xs text-ink-muted mt-0.5">{parseFloat(record.hoursWorked).toFixed(1)}h</div>
                      )}
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'requests' && (
        <div className="mt-6">
          <div className="space-y-4">
            {loading ? (
              <div className="py-20 text-center text-ink-muted font-medium">Loading requests...</div>
            ) : requests.length === 0 ? (
              <div className="py-20 text-center">
                <CheckCircle2 className="h-10 w-10 mx-auto mb-3 text-green-400 opacity-60" />
                <p className="text-ink-muted font-medium">No regularization requests found</p>
              </div>
            ) : (
              requests.map((req) => (
                <Card key={req.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <Avatar name={req.attendance?.employee?.user?.name} size="md" />
                    <div>
                      <h3 className="font-semibold text-ink">{req.attendance?.employee?.user?.name}</h3>
                      <p className="text-sm text-ink-muted">
                        Requested for: {req.attendance?.date ? new Date(req.attendance.date).toLocaleDateString() : '—'}
                      </p>
                      <div className="mt-2 text-sm bg-surface-muted p-3 rounded-lg border border-border">
                        <strong>Reason:</strong> {req.reason}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    {req.status === 'PENDING' ? (
                      <div className="flex gap-2">
                        <Button variant="outline" onClick={() => reviewRequest(req.id, 'REJECTED')} className="text-danger-600 border-danger-200 hover:bg-danger-50">Reject</Button>
                        <Button onClick={() => reviewRequest(req.id, 'APPROVED')} className="bg-success-600 hover:bg-success-700">Approve</Button>
                      </div>
                    ) : (
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${req.status === 'APPROVED' ? 'bg-success-50 text-success-700' : 'bg-danger-50 text-danger-700'}`}>
                        {req.status}
                      </span>
                    )}
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
