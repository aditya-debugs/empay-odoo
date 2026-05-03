import { useEffect, useState } from 'react';
import { Users, Calendar, CheckCircle2, AlertCircle, ArrowRight, UserPlus, Check, X } from 'lucide-react';
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

  const attendancePct = stats.totalEmployees
    ? Math.round((stats.presentToday / stats.totalEmployees) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-surface px-7 py-8 space-y-7">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">HR Dashboard</h1>
        <p className="mt-0.5 text-sm text-ink-muted">Overview of workforce and operations.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger">
        <StatCard
          icon={<Users className="h-5 w-5 text-brand-500" />}
          label="Total Employees"
          value={stats.totalEmployees}
          subtext="Active in system"
          iconBg="bg-brand-50"
        />
        <StatCard
          icon={<CheckCircle2 className="h-5 w-5 text-success-500" />}
          label="Present Today"
          value={stats.presentToday}
          subtext={`${attendancePct}% attendance rate`}
          iconBg="bg-success-50"
        />
        <StatCard
          icon={<AlertCircle className="h-5 w-5 text-danger-500" />}
          label="Absent Today"
          value={stats.absentToday}
          subtext="Unaccounted"
          iconBg="bg-danger-50"
        />
        <StatCard
          icon={<Calendar className="h-5 w-5 text-warning-500" />}
          label="Pending Leaves"
          value={stats.pendingLeavesCount}
          subtext="Awaiting review"
          iconBg="bg-warning-50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Leave Queue */}
        <div className="lg:col-span-2">
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div>
                <h2 className="text-[14px] font-semibold text-ink">Leave Requests</h2>
                <p className="text-xs text-ink-muted mt-0.5">{pendingLeaves.length} pending approval</p>
              </div>
              <Link
                to="/hr/leaves"
                className="flex items-center gap-1 text-xs font-semibold text-brand-500 hover:text-brand-700 transition-colors"
              >
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            {pendingLeaves.length > 0 ? (
              <div className="divide-y divide-border">
                {pendingLeaves.map(leave => (
                  <div key={leave.id} className="flex items-center justify-between gap-4 px-5 py-3.5 hover:bg-surface-muted/30 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar name={leave.employee.user.name} size="md" />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-ink truncate">{leave.employee.user.name}</p>
                        <p className="text-xs text-ink-muted truncate">
                          {leave.type.replace(/_/g, ' ')}
                          <span className="mx-1.5 text-border-strong">•</span>
                          <span className="font-medium text-brand-500">{leave.days} days</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleStatusUpdate(leave.id, 'REJECTED')}
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-border text-ink-muted hover:border-danger-200 hover:bg-danger-50 hover:text-danger-500 transition-all"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(leave.id, 'APPROVED')}
                        className="flex h-7 w-7 items-center justify-center rounded-lg bg-success-500 text-white hover:bg-success-600 transition-colors shadow-sm"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-14">
                <div className="h-12 w-12 rounded-2xl bg-surface-muted flex items-center justify-center mb-3">
                  <Calendar className="h-6 w-6 text-ink-soft" />
                </div>
                <p className="text-sm font-medium text-ink-muted">No pending leave requests</p>
                <p className="text-xs text-ink-soft mt-0.5">All caught up!</p>
              </div>
            )}
          </Card>
        </div>

        {/* New Joiners Widget */}
        <div>
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div>
                <h2 className="text-[14px] font-semibold text-ink">New Joiners</h2>
                <p className="text-xs text-ink-muted mt-0.5">This month</p>
              </div>
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-50">
                <UserPlus className="h-3.5 w-3.5 text-brand-500" />
              </div>
            </div>

            <div className="p-5">
              {newJoiners.length > 0 ? (
                <div className="space-y-4">
                  {newJoiners.map((person) => (
                    <div key={person.id} className="flex items-center gap-3 group">
                      <Avatar name={person.name} size="md" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-ink truncate">{person.name}</p>
                        <p className="text-[11px] text-ink-muted truncate uppercase tracking-wider">
                          {person.position}
                        </p>
                      </div>
                      <div className="text-[10px] font-semibold text-ink-soft bg-surface-muted px-2 py-1 rounded-md shrink-0">
                        {new Date(person.joinDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-sm text-ink-soft italic">
                  No new joiners this month
                </div>
              )}

              <div className="mt-5 pt-4 border-t border-border">
                <Link
                  to="/hr/employees/new"
                  className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-brand-500 px-4 py-2 text-xs font-semibold text-white hover:bg-brand-600 transition-colors shadow-sm"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  Add Employee
                </Link>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, subtext, iconBg }) {
  return (
    <Card hover className="p-5 animate-fade-up">
      <div className="flex items-start justify-between mb-4">
        <div className={`h-10 w-10 rounded-xl ${iconBg} flex items-center justify-center`}>
          {icon}
        </div>
      </div>
      <div>
        <div className="text-[26px] font-bold text-ink leading-none">{value ?? '—'}</div>
        <div className="mt-1 text-xs font-medium text-ink-muted">{label}</div>
        <div className="mt-0.5 text-[10px] text-ink-soft uppercase tracking-widest font-semibold">{subtext}</div>
      </div>
    </Card>
  );
}



