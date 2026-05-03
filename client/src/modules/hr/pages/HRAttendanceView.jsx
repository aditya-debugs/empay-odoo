import { useEffect, useState } from 'react';
import { 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  Clock
} from 'lucide-react';
import { Card, Button, Input, Avatar, Tabs, DateInput, AttendanceStatusBadge } from '../../../features/ui';
import hrService from '../hrService';

export default function HRAttendanceView() {
  const [activeTab, setActiveTab] = useState('monitor');
  const [records, setRecords] = useState([]);
  const [regQueue, setRegQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [search, setSearch] = useState('');
  const [processing, setProcessing] = useState(null);

  useEffect(() => {
    if (activeTab === 'monitor') {
      fetchAttendance();
    } else {
      fetchRegularizationQueue();
    }
  }, [date, activeTab]);

  async function fetchAttendance(q = search) {
    try {
      setLoading(true);
      const { records } = await hrService.getAttendance({ date, search: q });
      setRecords(records);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchRegularizationQueue() {
    try {
      setLoading(true);
      const data = await hrService.getRegularizationQueue();
      setRegQueue(data.requests || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleRegAction(id, status) {
    setProcessing(id);
    try {
      await hrService.updateRegularizationStatus(id, status);
      fetchRegularizationQueue();
    } catch (err) {
      alert('Action failed: ' + err.message);
    } finally {
      setProcessing(null);
    }
  }

  const handlePrevDay = () => {
    const d = new Date(date);
    d.setDate(d.getDate() - 1);
    setDate(d.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const d = new Date(date);
    d.setDate(d.getDate() + 1);
    setDate(d.toISOString().split('T')[0]);
  };

  const tabs = [
    { key: 'monitor', label: 'Attendance List view' },
    { key: 'regularization', label: 'Regularization Requests' }
  ];

  const formatHours = (hrs) => {
    if (!hrs) return '00:00';
    const h = Math.floor(hrs);
    const m = Math.round((hrs - h) * 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  return (
    <div className="px-8 py-10 space-y-8 min-h-screen bg-[#F8F9FA]">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-ink">Attendance</h1>
        <div className="relative w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-soft" />
          <Input 
            placeholder="Search employees, requests, payslips..." 
            className="pl-10 h-10 bg-surface-muted border-none rounded-full"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <Tabs tabs={tabs} activeKey={activeTab} onChange={setActiveTab} className="border-border" />

      {activeTab === 'monitor' ? (
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="flex border border-border rounded-lg overflow-hidden bg-white">
              <button onClick={handlePrevDay} className="p-2 hover:bg-surface-muted border-r border-border" title="Previous Day"><ChevronLeft className="h-5 w-5 text-ink-muted" /></button>
              <button onClick={handleNextDay} className="p-2 hover:bg-surface-muted" title="Next Day"><ChevronRight className="h-5 w-5 text-ink-muted" /></button>
            </div>
            
            <DateInput
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-48"
            />
          </div>

          <div className="text-center py-4">
            <h2 className="text-lg font-bold text-ink">
              {new Date(date).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}
            </h2>
          </div>

          <Card className="overflow-hidden border-border shadow-sm bg-white p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-surface-muted border-b border-border">
                  <tr>
                    <th className="px-6 py-4 text-[12px] font-semibold tracking-wider text-ink-muted uppercase">Emp</th>
                    <th className="px-6 py-4 text-[12px] font-semibold tracking-wider text-ink-muted uppercase">Status</th>
                    <th className="px-6 py-4 text-[12px] font-semibold tracking-wider text-ink-muted uppercase">Check In</th>
                    <th className="px-6 py-4 text-[12px] font-semibold tracking-wider text-ink-muted uppercase">Check Out</th>
                    <th className="px-6 py-4 text-[12px] font-semibold tracking-wider text-ink-muted uppercase">Work Hours</th>
                    <th className="px-6 py-4 text-[12px] font-semibold tracking-wider text-ink-muted uppercase">Extra hours</th>
                  </tr>
                </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  [1,2,3].map(i => (
                    <tr key={i} className="animate-pulse"><td colSpan={6} className="h-20 bg-surface-muted/50" /></tr>
                  ))
                ) : records.length > 0 ? records.map(record => {
                  const workHrs = record.hoursWorked || 0;
                  const extraHrs = Math.max(0, workHrs - 9);
                  return (
                    <tr key={record.id} className="hover:bg-surface-muted/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar name={record.employee.user.name} className="h-9 w-9" />
                          <div>
                            <p className="font-bold text-ink">{record.employee.user.name}</p>
                            <p className="text-[10px] text-ink-muted uppercase tracking-wider font-medium">{record.employee.department}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <AttendanceStatusBadge status={record.status} mode="badge" />
                      </td>

                      <td className="px-6 py-4 text-[13px] font-bold text-ink">
                        {record.checkIn ? new Date(record.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : '—'}
                      </td>
                      <td className="px-6 py-4 text-[13px] font-bold text-ink">
                        {record.checkOut ? new Date(record.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : '—'}
                      </td>
                      <td className="px-6 py-4 text-[13px] font-bold text-ink">
                        {formatHours(workHrs)}
                      </td>
                      <td className="px-6 py-4 text-[13px] font-bold text-ink">
                        {formatHours(extraHrs)}
                      </td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-ink-muted">
                      <div className="flex flex-col items-center justify-center">
                        <Clock className="h-8 w-8 mb-2 opacity-20" />
                        <p className="text-sm font-medium">No attendance records for this date</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            </div>
          </Card>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-ink">Pending Regularizations</h2>
            <Button variant="ghost" size="sm" onClick={fetchRegularizationQueue} className="text-blue-600 font-bold">
              Refresh Queue
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {loading ? (
              [1,2].map(i => <div key={i} className="h-32 bg-white rounded-2xl animate-pulse" />)
            ) : regQueue.length > 0 ? (
              regQueue
                .filter(reg => reg.attendance.employee.user.name.toLowerCase().includes(search.toLowerCase()))
                .map(reg => (
                  <Card key={reg.id} className="p-6 border-border shadow-sm bg-white rounded-2xl hover:shadow-md transition-all">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="flex items-start gap-4">
                        <Avatar name={reg.attendance.employee.user.name} className="h-12 w-12" />
                        <div>
                          <h3 className="font-bold text-ink">{reg.attendance.employee.user.name}</h3>
                          <p className="text-sm font-bold text-blue-600 mt-1">
                            {new Date(reg.attendance.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                          </p>
                          <p className="mt-3 text-sm text-ink-muted italic bg-surface-muted p-4 rounded-xl border border-border shadow-inner">
                            "{reg.reason}"
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 self-end md:self-center">
                        <Button 
                          variant="danger" 
                          onClick={() => handleRegAction(reg.id, 'REJECTED')} 
                          loading={processing === reg.id}
                        >
                          Reject Request
                        </Button>
                        <Button 
                          variant="primary"
                          onClick={() => handleRegAction(reg.id, 'APPROVED')} 
                          loading={processing === reg.id}
                        >
                          Approve & Correct
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))
            ) : (
              <Card className="p-20 text-center text-ink-soft italic bg-white rounded-2xl border-dashed border-border">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-20 text-green-500" />
                <h3 className="text-lg font-bold text-ink not-italic">All caught up!</h3>
                <p className="mt-1">No pending regularization requests found.</p>
              </Card>
            )}
          </div>
        </div>
      )}

    </div>
  );
}



