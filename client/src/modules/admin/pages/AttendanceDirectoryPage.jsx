import { useEffect, useState } from 'react';
import { Card, Input, Avatar, Tabs, Button, DateInput } from '../../../features/ui';
import { Search, Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import api from '../../../services/api';

export default function AttendanceDirectoryPage() {
  const [attendance, setAttendance] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [activeTab, setActiveTab] = useState('daily');

  const tabs = [
    { key: 'daily', label: 'Daily Attendance' },
    { key: 'requests', label: 'Regularization Requests' }
  ];

  useEffect(() => {
    if (activeTab === 'daily') {
      loadAttendance();
    } else {
      loadRequests();
    }
  }, [date, search, activeTab]);

  const loadAttendance = async () => {
    setLoading(true);
    try {
      const data = await api.get(`/attendance?date=${date}&search=${search}`);
      setAttendance(data.records || []);
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
      loadRequests(); // refresh list
    } catch (err) {
      alert('Failed to review request');
    }
  };

  return (
    <div className="px-8 py-8 bg-surface min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Attendance</h1>
          <p className="mt-1 text-sm text-ink-muted">Monitor and regularize attendance</p>
        </div>
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

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {loading ? (
              <div className="col-span-full py-20 text-center text-ink-muted font-medium">Loading attendance data...</div>
            ) : attendance.length === 0 ? (
              <div className="col-span-full py-20 text-center text-ink-muted font-medium">No records found for this date</div>
            ) : (
              attendance.map((record) => (
                <Card key={record.id} className="p-4 flex items-center gap-4 hover:shadow-md transition-shadow">
                  <Avatar name={record.employee?.user?.name} size="md" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-ink truncate">{record.employee?.user?.name}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`h-2 w-2 rounded-full ${record.status === 'REGULARIZED' ? 'bg-brand-500' : record.checkIn ? 'bg-success-500' : 'bg-danger-500'}`} />
                      <span className="text-xs text-ink-muted">
                        {record.status === 'REGULARIZED' ? 'Regularized (Present)' : record.checkIn ? `In: ${new Date(record.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Not present'}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-ink">{record.hoursWorked || 0}h</div>
                    <div className="text-[10px] uppercase tracking-wider text-ink-muted">Worked</div>
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
              <div className="py-20 text-center text-ink-muted font-medium">No regularization requests found</div>
            ) : (
              requests.map((req) => (
                <Card key={req.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <Avatar name={req.attendance?.employee?.user?.name} size="md" />
                    <div>
                      <h3 className="font-semibold text-ink">{req.attendance?.employee?.user?.name}</h3>
                      <p className="text-sm text-ink-muted">Requested for date: {new Date(req.attendance?.date).toLocaleDateString()}</p>
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



