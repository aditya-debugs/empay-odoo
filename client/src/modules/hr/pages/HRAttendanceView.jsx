import { useEffect, useState } from 'react';
import { 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  CheckCircle2, 
  XCircle,
  AlertCircle,
  MessageSquare,
  Clock
} from 'lucide-react';
import { Card, Button, Input, Avatar, Tabs } from '../../../features/ui';
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
      setRegQueue(data);
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
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Attendance</h1>
        <div className="relative w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input 
            placeholder="Search employees, requests, payslips..." 
            className="pl-10 h-10 bg-gray-100 border-none rounded-full"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <Tabs tabs={tabs} activeKey={activeTab} onChange={setActiveTab} className="border-gray-200" />

      {activeTab === 'monitor' ? (
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="flex border border-gray-200 rounded-lg overflow-hidden bg-white">
              <button onClick={handlePrevDay} className="p-2 hover:bg-gray-50 border-r border-gray-200" title="Previous Day"><ChevronLeft className="h-5 w-5 text-gray-600" /></button>
              <button onClick={handleNextDay} className="p-2 hover:bg-gray-50" title="Next Day"><ChevronRight className="h-5 w-5 text-gray-600" /></button>
            </div>
            
            <div className="relative">
              <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input 
                type="date" 
                className="pl-10 w-48 border-gray-200 font-bold text-gray-700" 
                value={date} 
                onChange={(e) => setDate(e.target.value)} 
              />
            </div>
          </div>

          <div className="text-center py-4">
            <h2 className="text-lg font-bold text-gray-800">
              {new Date(date).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}
            </h2>
          </div>

          <Card className="overflow-hidden border-gray-100 shadow-sm bg-white rounded-2xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white border-b border-gray-100">
                  <th className="px-8 py-5 text-[13px] font-semibold text-gray-500 uppercase tracking-wider">Emp</th>
                  <th className="px-8 py-5 text-[13px] font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-8 py-5 text-[13px] font-semibold text-gray-500 uppercase tracking-wider">Check In</th>
                  <th className="px-8 py-5 text-[13px] font-semibold text-gray-500 uppercase tracking-wider">Check Out</th>
                  <th className="px-8 py-5 text-[13px] font-semibold text-gray-500 uppercase tracking-wider">Work Hours</th>
                  <th className="px-8 py-5 text-[13px] font-semibold text-gray-500 uppercase tracking-wider">Extra hours</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  [1,2,3].map(i => (
                    <tr key={i} className="animate-pulse"><td colSpan={6} className="h-20 bg-gray-50/50" /></tr>
                  ))
                ) : records.length > 0 ? records.map(record => {
                  const workHrs = record.hoursWorked || 0;
                  const extraHrs = Math.max(0, workHrs - 9);
                  return (
                    <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                          <Avatar name={record.employee.user.name} className="h-9 w-9" />
                          <div>
                            <p className="font-bold text-gray-900">{record.employee.user.name}</p>
                            <p className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">{record.employee.department}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <span className={`text-[10px] font-bold uppercase tracking-tight px-2 py-0.5 rounded border ${
                          record.status === 'PRESENT' ? 'bg-green-50 text-green-600 border-green-100' :
                          record.status === 'REGULARIZED' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                          'bg-red-50 text-red-600 border-red-100'
                        }`}>
                          {record.status}
                        </span>
                      </td>

                      <td className="px-8 py-5 text-[13px] font-bold text-gray-700">
                        {record.checkIn ? new Date(record.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : '—'}
                      </td>
                      <td className="px-8 py-5 text-[13px] font-bold text-gray-700">
                        {record.checkOut ? new Date(record.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : '—'}
                      </td>
                      <td className="px-8 py-5 text-[13px] font-bold text-gray-700">
                        {formatHours(workHrs)}
                      </td>
                      <td className="px-8 py-5 text-[13px] font-bold text-gray-700">
                        {formatHours(extraHrs)}
                      </td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan={6} className="px-8 py-20 text-center text-gray-400 italic">No attendance records for this date.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </Card>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-800">Pending Regularizations</h2>
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
                  <Card key={reg.id} className="p-6 border-gray-100 shadow-sm bg-white rounded-2xl hover:shadow-md transition-all">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="flex items-start gap-4">
                        <Avatar name={reg.attendance.employee.user.name} className="h-12 w-12" />
                        <div>
                          <h3 className="font-bold text-gray-900">{reg.attendance.employee.user.name}</h3>
                          <p className="text-sm font-bold text-blue-600 mt-1">
                            {new Date(reg.attendance.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                          </p>
                          <p className="mt-3 text-sm text-gray-600 italic bg-gray-50 p-4 rounded-xl border border-gray-100 shadow-inner">
                            "{reg.reason}"
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 self-end md:self-center">
                        <Button 
                          variant="ghost" 
                          className="text-red-500 font-bold hover:bg-red-50" 
                          onClick={() => handleRegAction(reg.id, 'REJECTED')} 
                          loading={processing === reg.id}
                        >
                          Reject Request
                        </Button>
                        <Button 
                          className="bg-[#198754] hover:bg-[#157347] text-white border-none font-bold px-8 py-2.5 rounded-xl shadow-lg shadow-green-500/10" 
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
              <Card className="p-20 text-center text-gray-400 italic bg-white rounded-2xl border-dashed border-gray-200">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-20 text-green-500" />
                <h3 className="text-lg font-bold text-gray-900 not-italic">All caught up!</h3>
                <p className="mt-1">No pending regularization requests found.</p>
              </Card>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
