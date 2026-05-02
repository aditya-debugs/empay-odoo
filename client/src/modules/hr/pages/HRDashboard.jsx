import { useEffect, useState } from 'react';
import { Users, Calendar, CheckCircle2, AlertCircle, ArrowRight, UserPlus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, Button, Avatar } from '../../../features/ui';
import hrService from '../hrService';

export default function HRDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Calendar state
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [calendarCells, setCalendarCells] = useState([]);
  const [leavesByDate, setLeavesByDate] = useState({});
  const [selectedDate, setSelectedDate] = useState(null);
  const [loadingCalendar, setLoadingCalendar] = useState(false);

  useEffect(() => {
    hrService
      .getDashboard()
      .then(setData)
      .catch((err) => console.error('Failed to load dashboard', err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setCalendarCells(buildCalendarCells(calendarMonth));
    loadCalendarLeaves(calendarMonth);
  }, [calendarMonth]);

  if (loading)
    return (
      <div className="p-8 text-ink-muted animate-pulse font-medium">
        Loading dashboard summary...
      </div>
    );

  const { stats = {}, pendingLeaves = [], newJoiners = [] } = data || {};

  // Build calendar grid for month (returns array of {date, inMonth})
  function buildCalendarCells(monthDate) {
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    const startDay = first.getDay(); // 0..6
    const daysInMonth = last.getDate();

    const cells = [];
    // previous month filler
    for (let i = 0; i < startDay; i++) {
      const d = new Date(year, month, 1 - (startDay - i));
      cells.push({ date: d, inMonth: false });
    }
    // current month
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ date: new Date(year, month, d), inMonth: true });
    }
    // next month filler to complete weeks
    while (cells.length % 7 !== 0) {
      const lastDate = cells[cells.length - 1].date;
      const d = new Date(lastDate);
      d.setDate(d.getDate() + 1);
      cells.push({ date: d, inMonth: false });
    }
    return cells;
  }

  // Load leaves for month range and populate leavesByDate map
  async function loadCalendarLeaves(monthDate) {
    setLoadingCalendar(true);
    try {
      const start = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
      const end = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
      const startIso = start.toISOString().split('T')[0];
      const endIso = end.toISOString().split('T')[0];
      // NOTE: hrService.getUpcomingLeaves must be added (see instructions)
      const res = await hrService.getUpcomingLeaves(startIso, endIso);
      const arr = Array.isArray(res) ? res : res.leaves || res || [];
      const map = {};
      arr.forEach((l) => {
        const s = new Date(l.startDate);
        const e = new Date(l.endDate);
        const cursor = new Date(s);
        while (cursor <= e) {
          const key = cursor.toISOString().split('T')[0];
          map[key] = map[key] || [];
          map[key].push(l);
          cursor.setDate(cursor.getDate() + 1);
        }
      });
      setLeavesByDate(map);
      setCalendarCells(buildCalendarCells(monthDate));
    } catch (err) {
      console.error('Failed to load calendar leaves', err);
    } finally {
      setLoadingCalendar(false);
    }
  }

  // Approve/Reject and refresh dashboard + calendar
  const handleStatusUpdate = async (id, status) => {
    const adminNote = window.prompt(`Enter a note for ${status.toLowerCase()} (optional):`);
    if (adminNote === null) return;
    try {
      await hrService.updateLeaveStatus(id, status, adminNote);
      const refreshed = await hrService.getDashboard();
      setData(refreshed);
      await loadCalendarLeaves(calendarMonth);
    } catch (err) {
      alert('Error updating status: ' + (err.message || err));
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] px-8 py-10 space-y-10">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">HR Dashboard</h1>
        <p className="text-sm text-gray-500 font-medium">Overview of workforce and operations.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={<Users className="h-5 w-5 text-blue-500" />}
          label="Total Employees"
          value={stats.totalEmployees}
          subtext="ACTIVE IN SYSTEM"
          bgColor="bg-blue-50"
        />
        <StatCard
          icon={<CheckCircle2 className="h-5 w-5 text-[#198754]" />}
          label="Present Today"
          value={stats.presentToday}
          subtext={`${stats.totalEmployees ? ((stats.presentToday / stats.totalEmployees) * 100).toFixed(0) : 0}% ATTENDANCE`}
          bgColor="bg-green-50"
        />
        <StatCard
          icon={<AlertCircle className="h-5 w-5 text-red-500" />}
          label="Absent Today"
          value={stats.absentToday}
          subtext="UNACCOUNTED FOR"
          bgColor="bg-red-50"
        />
        <StatCard
          icon={<Calendar className="h-5 w-5 text-orange-500" />}
          label="Pending Leaves"
          value={stats.pendingLeavesCount}
          subtext="REQUESTS AWAITING REVIEW"
          bgColor="bg-orange-50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Upcoming Leaves Calendar (replaces previous Leave Requests queue) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-gray-400" />
              Upcoming Leaves (Calendar)
            </h2>
            <div className="flex items-center gap-3">
              <Button
                size="sm"
                variant="ghost"
                onClick={() =>
                  setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
                }
              >
                Prev
              </Button>
              <div className="text-sm font-semibold">
                {calendarMonth.toLocaleString(undefined, { month: 'long', year: 'numeric' })}
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() =>
                  setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
                }
              >
                Next
              </Button>
              <Link
                to="/hr/leaves"
                className="text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors"
              >
                View all <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          <Card className="p-6 border-gray-100 shadow-sm bg-white rounded-2xl">
            {/* Heat Map Legend */}
            <div className="mb-6 pb-4 border-b border-gray-100">
              <p className="text-xs font-semibold text-gray-600 mb-3">Leave Intensity Legend:</p>
              <div className="flex gap-6">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: 'rgba(34, 197, 94, 0.2)' }}
                  />
                  <span className="text-xs text-gray-600">1-2 employees</span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: 'rgba(34, 197, 94, 0.5)' }}
                  />
                  <span className="text-xs text-gray-600">3-7 employees</span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: 'rgba(34, 197, 94, 1)' }}
                  />
                  <span className="text-xs text-gray-600">8+ employees</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-2 text-xs font-semibold text-gray-600 mb-3 pb-3 border-b border-gray-200">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                <div key={d} className="text-center py-2">
                  {d}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
              {calendarCells.map((cell, idx) => {
                // Fix timezone issue: format date in local timezone without toISOString
                const pad = (n) => String(n).padStart(2, '0');
                const iso = `${cell.date.getFullYear()}-${pad(cell.date.getMonth() + 1)}-${pad(cell.date.getDate())}`;
                const leaves = leavesByDate[iso] || [];
                const inMonth = cell.inMonth;
                const isSelected = selectedDate === iso;
                // Calculate heat map intensity: light green for few leaves, dark green for many
                const leaveIntensity = Math.min(leaves.length / 10, 1);
                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedDate(inMonth ? iso : null)}
                    disabled={!inMonth}
                    className={`p-2 h-[65px] text-left rounded-lg transition-all border-2 flex flex-col items-center justify-center ${
                      isSelected
                        ? 'border-[#198754] bg-green-50'
                        : inMonth
                          ? 'border-gray-100 hover:border-gray-300 hover:bg-gray-50'
                          : 'border-transparent opacity-25'
                    }`}
                  >
                    <div
                      className={`text-sm font-bold ${inMonth ? 'text-gray-900' : 'text-gray-400'}`}
                    >
                      {cell.date.getDate()}
                    </div>
                    {leaves.length > 0 && (
                      <div className="flex flex-col items-center gap-1 mt-1">
                        <div
                          className="w-3 h-3 rounded-full transition-all shadow-sm"
                          style={{
                            backgroundColor: `rgba(34, 197, 94, ${Math.max(leaveIntensity, 0.2)})`,
                          }}
                          title={`${leaves.length} employee(s) on leave`}
                        />
                        <span className="text-[10px] font-semibold text-gray-600">
                          {leaves.length}
                        </span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="mt-6">
              {selectedDate ? (
                <div>
                  <h3 className="font-bold text-gray-900 text-base mb-4 pb-3 border-b border-gray-100">
                    📅 Leaves on{' '}
                    {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </h3>
                  <div className="space-y-3">
                    {(leavesByDate[selectedDate] || []).map((l) => (
                      <div
                        key={l.id}
                        className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-transparent rounded-lg border border-green-100 hover:border-green-300 transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar name={l.employee?.user?.name} className="h-10 w-10" />
                          <div>
                            <div className="font-bold text-gray-900">{l.employee?.user?.name}</div>
                            <div className="text-xs text-gray-600">
                              <span className="font-semibold text-green-700">
                                {l.type.replace('_', ' ')}
                              </span>{' '}
                              • <span>{l.days} days</span>
                            </div>
                            <div className="text-xs text-gray-500 italic">{l.status}</div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {l.status === 'PENDING' && (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-red-500"
                                onClick={() => handleStatusUpdate(l.id, 'REJECTED')}
                              >
                                Reject
                              </Button>
                              <Button
                                size="sm"
                                className="bg-[#198754] hover:bg-[#157347] text-white"
                                onClick={() => handleStatusUpdate(l.id, 'APPROVED')}
                              >
                                Approve
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                    {(leavesByDate[selectedDate] || []).length === 0 && (
                      <div className="py-8 text-center text-sm text-gray-400 italic">
                        ✓ No leaves on this date
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center text-sm text-gray-400 italic font-medium">
                  👆 Select a date to view leaves
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* New Joiners Widget */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-gray-400" />
              New Joiners
            </h2>
          </div>
          <Card className="p-6 space-y-6 border-gray-100 shadow-sm bg-white rounded-2xl">
            {newJoiners.length > 0 ? (
              <div className="space-y-6">
                {newJoiners.map((person) => (
                  <div key={person.id} className="flex items-center gap-4 group">
                    <Avatar
                      name={person.name}
                      className="h-10 w-10 ring-2 ring-gray-50 group-hover:ring-blue-100 transition-all font-bold"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-gray-900 truncate">{person.name}</p>
                      <p className="text-[11px] text-gray-500 font-medium truncate uppercase tracking-wider">
                        {person.position} • {person.department}
                      </p>
                    </div>
                    <div className="text-[10px] font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded">
                      {new Date(person.joinDate).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-sm text-gray-400 italic font-medium">
                No new joiners this month
              </div>
            )}
            <div className="pt-4 border-t border-gray-50">
              <Button
                variant="outline"
                className="w-full bg-white text-gray-900 border-gray-200 hover:bg-gray-50 shadow-sm font-bold"
                asChild
              >
                <Link to="/hr/employees/new">Add Employee</Link>
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, subtext, bgColor }) {
  return (
    <Card className="p-6 border-gray-100 shadow-sm bg-white rounded-2xl group hover:shadow-md transition-all">
      <div className="flex justify-between items-start mb-4">
        <div
          className={`h-12 w-12 rounded-2xl ${bgColor} flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm`}
        >
          {icon}
        </div>
        <div className="opacity-10 group-hover:opacity-20 transition-opacity">{icon}</div>
      </div>
      <div>
        <p className="text-sm font-bold text-gray-500 tracking-tight">{label}</p>
        <div className="flex items-baseline gap-2 mt-1">
          <span className="text-3xl font-bold text-gray-900 leading-none">{value}</span>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            {subtext}
          </span>
        </div>
      </div>
    </Card>
  );
}
