import { useEffect, useState } from 'react';
import { Card, Input, Avatar } from '../../../features/ui';
import { Search, Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import api from '../../../services/api';

export default function AttendanceDirectoryPage() {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    loadAttendance();
  }, [date, search]);

  const loadAttendance = async () => {
    setLoading(true);
    try {
      // In a real app, this would be a specific admin endpoint /attendance/today or similar
      // For now, we'll assume the /attendance endpoint handles multiple employees for admin
      const data = await api.get(`/attendance?date=${date}&search=${search}`);
      setAttendance(data.records || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-8 py-8 bg-surface min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Daily Attendance</h1>
          <p className="mt-1 text-sm text-ink-muted">Monitoring attendance for {new Date(date).toLocaleDateString()}</p>
        </div>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="px-3 py-2 border border-ink-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      <div className="mt-6 flex gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search employees..."
            leftIcon={<Search className="h-4 w-4" />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-3">
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
                  <span className={`h-2 w-2 rounded-full ${record.checkIn ? 'bg-success-500' : 'bg-danger-500'}`} />
                  <span className="text-xs text-ink-muted">
                    {record.checkIn ? `In: ${new Date(record.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Not present'}
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
  );
}
