import {
  Users, UserCheck, CalendarClock, IndianRupee,
  Clock, AlertTriangle, FileText, ShieldCheck,
  ChevronRight, MoreHorizontal, ArrowUpRight,
  Calendar, Check, X,
} from 'lucide-react';
import { Card, Button, Avatar } from '../../../features/ui';
import { useAuth } from '../../../features/auth/AuthContext';

// ─────────────────────────────────────────────────────────────
// Mock data — swap with /api/v1/dashboard/admin/* once the
// dashboard service is implemented in Phase 3.
// ─────────────────────────────────────────────────────────────

const stats = [
  {
    label: 'Total Employees', value: '128',
    sub: '+3 new joiners this month', tone: 'up', icon: Users,
  },
  {
    label: 'Present Today', value: '112',
    sub: '87.5% attendance rate', tone: 'up', icon: UserCheck,
  },
  {
    label: 'Pending Leave Requests', value: '7',
    sub: '4 awaiting > 24h', tone: 'warn', icon: CalendarClock,
  },
  {
    label: 'Payroll Due', value: '₹4.82L',
    sub: 'Apr 2026 — due in 3 days', tone: 'warn', icon: IndianRupee,
  },
];

// Today's attendance breakdown
const attendance = [
  { label: 'Present',   count: 112, shade: 'bg-brand-500' },
  { label: 'Late',      count:   8, shade: 'bg-warning-500' },
  { label: 'Half Day',  count:   3, shade: 'bg-brand-300' },
  { label: 'On Leave',  count:   5, shade: 'bg-brand-200' },
];
const totalAttendance = attendance.reduce((s, a) => s + a.count, 0);

// Pending leave queue
const leaveQueue = [
  { name: 'Sarah Chen',   type: 'Casual Leave',     days: 3, when: 'May 5 – May 7' },
  { name: 'Mike Johnson', type: 'Sick Leave',       days: 2, when: 'May 4 – May 5' },
  { name: 'Priya Patel',  type: 'Paid Leave',       days: 5, when: 'May 12 – May 16' },
  { name: 'Alex Rivera',  type: 'Casual Leave',     days: 1, when: 'May 6' },
];

// Department headcount
const departments = [
  { label: 'Engineering', count: 48 },
  { label: 'Sales',       count: 24 },
  { label: 'Operations',  count: 18 },
  { label: 'Marketing',   count: 16 },
  { label: 'HR',          count: 12 },
  { label: 'Finance',     count: 10 },
];
const maxDept = Math.max(...departments.map((d) => d.count));

// Payroll summary
const payroll = {
  cycle: 'Apr 2026',
  amount: '₹4,82,500',
  generated: 120,
  total: 128,
  disputes: 2,
  lastRun: 'Apr 30, 2026',
};

// Recent activity
const activity = [
  { who: 'Sarah Chen',    what: 'applied for Casual Leave (3 days)',          when: '2h ago',  icon: CalendarClock, tone: 'bg-brand-100 text-brand-700' },
  { who: 'System',        what: 'marked April 2026 payroll as complete',      when: '1d ago',  icon: ShieldCheck,   tone: 'bg-success-50 text-success-700' },
  { who: 'HR — Anita',    what: 'added new employee John Doe to Engineering', when: '2d ago',  icon: Users,         tone: 'bg-brand-100 text-brand-700' },
  { who: 'Mike Johnson',  what: 'opened a payslip dispute',                   when: '3d ago',  icon: AlertTriangle, tone: 'bg-danger-50 text-danger-700' },
  { who: 'Admin — You',   what: 'approved attendance override for Lisa Wong', when: '5d ago',  icon: Clock,         tone: 'bg-warning-50 text-warning-500' },
];

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const { user } = useAuth();

  return (
    <div className="bg-brand-500 pb-10">
      {/* HEADER */}
      <div className="px-8 pt-8 pb-12 text-white">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-brand-100">Good morning,</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">{user?.name}</h1>
          </div>
          <div className="flex items-center gap-2">
            <button className="inline-flex items-center gap-2 rounded-full bg-brand-700 px-3 py-2 text-sm hover:bg-brand-800">
              <Calendar className="h-4 w-4" />
              <span>2026</span>
            </button>
            <Button variant="outline" size="md" className="bg-white">Export Data</Button>
          </div>
        </div>
      </div>

      <div className="-mt-8 space-y-4 px-6">
        {/* STAT CARDS — 4 HRMS-focused metrics */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((s) => <StatCard key={s.label} {...s} />)}
        </div>

        {/* THREE-COLUMN PANELS */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Attendance Today */}
          <Card className="p-5">
            <PanelHeader title="Attendance Today" subtitle={`${totalAttendance} of 128 marked`} />
            <div className="mt-4 flex h-2.5 w-full overflow-hidden rounded-full">
              {attendance.map((a) => (
                <div key={a.label} className={a.shade} style={{ width: `${(a.count / totalAttendance) * 100}%` }} />
              ))}
            </div>
            <ul className="mt-4 space-y-2.5">
              {attendance.map((a) => (
                <li key={a.label} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${a.shade}`} />
                    <span className="text-ink-muted">{a.label}</span>
                  </div>
                  <span className="font-medium text-ink">{a.count}</span>
                </li>
              ))}
            </ul>
          </Card>

          {/* Leave Approval Queue */}
          <Card className="p-5">
            <PanelHeader
              title="Leave Approval Queue"
              subtitle="7 pending"
              action={
                <button className="inline-flex items-center gap-1 text-xs font-medium text-brand-500 hover:text-brand-700">
                  View all <ChevronRight className="h-3 w-3" />
                </button>
              }
            />
            <ul className="mt-3 space-y-2.5">
              {leaveQueue.map((l) => (
                <li key={l.name} className="flex items-center gap-3 rounded-xl border border-border p-2.5">
                  <Avatar name={l.name} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-ink truncate">{l.name}</div>
                    <div className="text-xs text-ink-muted truncate">
                      {l.type} · {l.days}d · {l.when}
                    </div>
                  </div>
                  <button className="rounded-full p-1.5 text-success-700 hover:bg-success-50" aria-label="Approve">
                    <Check className="h-4 w-4" />
                  </button>
                  <button className="rounded-full p-1.5 text-danger-500 hover:bg-danger-50" aria-label="Reject">
                    <X className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          </Card>

          {/* Department Headcount */}
          <Card className="p-5">
            <PanelHeader title="Department Headcount" subtitle="Total 128 employees" />
            <ul className="mt-4 space-y-3">
              {departments.map((d) => (
                <li key={d.label}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-ink-muted">{d.label}</span>
                    <span className="font-medium text-ink">{d.count}</span>
                  </div>
                  <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-surface-muted">
                    <div className="h-full rounded-full bg-brand-500" style={{ width: `${(d.count / maxDept) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        {/* TWO-COLUMN BOTTOM */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Payroll Summary */}
          <Card className="p-5">
            <PanelHeader title="Payroll Summary" subtitle={payroll.cycle} />
            <div className="mt-4 grid grid-cols-2 gap-4">
              <KeyMetric label="To be processed" value={payroll.amount} icon={IndianRupee} />
              <KeyMetric label="Last payroll run" value={payroll.lastRun} icon={ShieldCheck} />
              <KeyMetric label="Payslips generated" value={`${payroll.generated} / ${payroll.total}`} icon={FileText} />
              <KeyMetric label="Open disputes" value={String(payroll.disputes)} icon={AlertTriangle} tone="danger" />
            </div>
            <div className="mt-5">
              <div className="flex items-center justify-between text-xs text-ink-muted">
                <span>Generation progress</span>
                <span>{Math.round((payroll.generated / payroll.total) * 100)}%</span>
              </div>
              <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-surface-muted">
                <div
                  className="h-full rounded-full bg-brand-500"
                  style={{ width: `${(payroll.generated / payroll.total) * 100}%` }}
                />
              </div>
            </div>
          </Card>

          {/* Recent Activity */}
          <Card className="p-5">
            <PanelHeader title="Recent Activity" subtitle="Last 7 days" />
            <ul className="mt-4 space-y-3">
              {activity.map((a, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className={`mt-0.5 flex h-8 w-8 items-center justify-center rounded-full ${a.tone}`}>
                    <a.icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-ink">
                      <span className="font-medium">{a.who}</span> {a.what}
                    </div>
                    <div className="text-xs text-ink-muted">{a.when}</div>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Internals
// ─────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, tone, icon: Icon }) {
  const toneClass =
    tone === 'up'   ? 'bg-success-50 text-success-700' :
    tone === 'warn' ? 'bg-warning-50 text-warning-500' :
                      'bg-danger-50 text-danger-700';
  return (
    <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="rounded-2xl bg-surface-muted p-2.5">
          <Icon className="h-5 w-5 text-brand-500" />
        </div>
        <button className="rounded-full p-1 text-brand-500 hover:bg-surface-muted">
          <ArrowUpRight className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-5">
        <div className="text-2xl font-semibold tracking-tight">{value}</div>
        <div className="mt-0.5 text-xs text-ink-muted">{label}</div>
        <div className={`mt-2 inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ${toneClass}`}>
          {sub}
        </div>
      </div>
    </div>
  );
}

function PanelHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-start justify-between gap-2">
      <div>
        <h3 className="text-base font-semibold text-ink">{title}</h3>
        {subtitle && <p className="mt-0.5 text-xs text-ink-muted">{subtitle}</p>}
      </div>
      {action || (
        <button className="rounded-full p-1.5 hover:bg-surface-muted">
          <MoreHorizontal className="h-4 w-4 text-ink-muted" />
        </button>
      )}
    </div>
  );
}

function KeyMetric({ label, value, icon: Icon, tone = 'default' }) {
  const wellTone = tone === 'danger' ? 'bg-danger-50 text-danger-700' : 'bg-surface-muted text-brand-500';
  return (
    <div className="rounded-xl border border-border p-3">
      <div className="flex items-center gap-2">
        <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${wellTone}`}>
          <Icon className="h-3.5 w-3.5" />
        </div>
        <span className="text-xs text-ink-muted">{label}</span>
      </div>
      <div className="mt-2 text-lg font-semibold tracking-tight text-ink">{value}</div>
    </div>
  );
}
