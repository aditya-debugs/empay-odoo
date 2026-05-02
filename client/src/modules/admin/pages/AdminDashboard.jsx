import {
  Users, Briefcase, UserPlus, UserMinus, Plus,
  ArrowUpRight, ChevronLeft, ChevronRight,
  Calendar, MoreHorizontal, RefreshCw,
} from 'lucide-react';
import { Card, Button, Avatar } from '../../../features/ui';
import { useAuth } from '../../../features/auth/AuthContext';

// ─────────────────────────────────────────────────────────────
// Mock data — swap with /api/v1/dashboard/admin/* once the
// backend service is implemented.
// ─────────────────────────────────────────────────────────────

const stats = [
  { label: 'Total Employees',    value: '310',    delta: '+3.72%', up: true,  icon: Users },
  { label: 'Total Applicants',   value: '1,244',  delta: '+5.02%', up: true,  icon: Briefcase },
  { label: 'New Employees',      value: '1,298',  delta: '-1.72%', up: false, icon: UserPlus },
  { label: 'Resigned Employees', value: '1,298',  delta: '-3.72%', up: false, icon: UserMinus },
];

const activeJobs = [
  { title: 'Senior Product Designer', mode: 'On-Site', color: 'bg-rose-100 text-rose-600' },
  { title: 'NodeJs Developer',         mode: 'On-Site', color: 'bg-emerald-100 text-emerald-700' },
  { title: 'ReactJs Developer',        mode: 'On-Site', color: 'bg-sky-100 text-sky-600' },
  { title: 'Wordpress Developer',      mode: 'On-Site', color: 'bg-blue-100 text-blue-600' },
];

const interviews = [
  { name: 'Ruben Philips',     role: 'UX/UI Designer',     when: 'Mon 12, 2026 — 10:00 AM' },
  { name: 'Emery Donin',       role: 'ReactJs Developer',  when: 'Mon 12, 2026 — 11:30 AM' },
  { name: 'Charlie Korsgaard', role: 'MongoDB Architect',  when: 'Tue 13, 2026 — 09:00 AM' },
  { name: 'Ryan Vaccaro',      role: 'NodeJs Developer',   when: 'Tue 13, 2026 — 02:00 PM' },
];

const employment = [
  { label: 'Permanent Employees',  count: 1820, shade: 'bg-brand-500' },
  { label: 'Contract Employees',   count:  612, shade: 'bg-brand-400' },
  { label: 'Temporary Employees',  count:  287, shade: 'bg-brand-300' },
  { label: 'Freelancers',          count:  256, shade: 'bg-brand-200' },
  { label: 'Interns',              count:  134, shade: 'bg-brand-100' },
];
const totalEmployment = employment.reduce((s, e) => s + e.count, 0);

// 7-row × 24-col heatmap of attendance density
const heatmap = Array.from({ length: 7 * 24 }, () => {
  const r = Math.random();
  if (r < 0.45) return 0;
  if (r < 0.7) return 1;
  if (r < 0.88) return 2;
  return 3;
});
const heatShades = ['bg-surface-muted', 'bg-brand-200', 'bg-brand-400', 'bg-brand-500'];

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const { user } = useAuth();

  return (
    <div className="bg-brand-500 pb-10">
      {/* HEADER — greeting + actions */}
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

      {/* Floating content area */}
      <div className="-mt-8 space-y-4 px-6">
        {/* STAT CARDS ROW */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
          {stats.map((s) => (
            <StatCard key={s.label} {...s} />
          ))}
          <button className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-brand-300 bg-brand-50 p-5 text-brand-700 transition-colors hover:bg-brand-100">
            <div className="rounded-full bg-brand-500 p-2 text-white">
              <Plus className="h-4 w-4" />
            </div>
            <span className="text-sm font-medium">Add new widget</span>
          </button>
        </div>

        {/* THREE-COLUMN PANELS */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Active Jobs */}
          <Card className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-semibold">Active Jobs</h3>
                <p className="mt-2 text-3xl font-semibold tracking-tight">24 <span className="text-sm font-normal text-ink-muted">Jobs</span></p>
              </div>
              <button className="rounded-full p-1.5 hover:bg-surface-muted">
                <RefreshCw className="h-4 w-4 text-ink-muted" />
              </button>
            </div>
            <div className="mt-3 flex justify-end gap-1">
              <button className="rounded-full p-1.5 hover:bg-surface-muted">
                <ChevronLeft className="h-4 w-4 text-ink-muted" />
              </button>
              <button className="rounded-full p-1.5 hover:bg-surface-muted">
                <ChevronRight className="h-4 w-4 text-ink-muted" />
              </button>
            </div>
            <ul className="mt-2 space-y-3">
              {activeJobs.map((j) => (
                <li key={j.title} className="flex items-center gap-3">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${j.color}`}>
                    <Briefcase className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-ink">{j.title}</div>
                    <div className="text-xs text-ink-muted">{j.mode}</div>
                  </div>
                </li>
              ))}
            </ul>
          </Card>

          {/* Upcoming Interviews */}
          <Card className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-semibold">Upcoming Interviews</h3>
                <p className="mt-2 text-3xl font-semibold tracking-tight">12 <span className="text-sm font-normal text-ink-muted">Interviews</span></p>
              </div>
              <button className="rounded-full p-1.5 hover:bg-surface-muted">
                <MoreHorizontal className="h-4 w-4 text-ink-muted" />
              </button>
            </div>
            <div className="mt-3 flex justify-end gap-1">
              <button className="rounded-full p-1.5 hover:bg-surface-muted">
                <ChevronLeft className="h-4 w-4 text-ink-muted" />
              </button>
              <button className="rounded-full p-1.5 hover:bg-surface-muted">
                <ChevronRight className="h-4 w-4 text-ink-muted" />
              </button>
            </div>
            <ul className="mt-2 space-y-3">
              {interviews.map((iv) => (
                <li key={iv.name} className="flex items-center gap-3">
                  <Avatar name={iv.name} size="md" />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-ink">{iv.name}</div>
                    <div className="text-xs text-ink-muted">{iv.role}</div>
                  </div>
                  <span className="rounded-full bg-surface-muted px-2.5 py-1 text-[11px] text-ink-muted whitespace-nowrap">
                    {iv.when}
                  </span>
                </li>
              ))}
            </ul>
          </Card>

          {/* Employment Status */}
          <Card className="p-5">
            <div className="flex items-start justify-between">
              <h3 className="text-base font-semibold">Employment Status</h3>
              <button className="rounded-full p-1.5 hover:bg-surface-muted">
                <MoreHorizontal className="h-4 w-4 text-ink-muted" />
              </button>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-sm text-ink-muted">Total Employees</span>
              <span className="text-2xl font-semibold tracking-tight">{totalEmployment.toLocaleString()}</span>
            </div>
            {/* Stacked bar */}
            <div className="mt-3 flex h-2.5 w-full overflow-hidden rounded-full">
              {employment.map((e) => (
                <div
                  key={e.label}
                  className={e.shade}
                  style={{ width: `${(e.count / totalEmployment) * 100}%` }}
                />
              ))}
            </div>
            {/* Legend */}
            <ul className="mt-4 space-y-2.5">
              {employment.map((e) => (
                <li key={e.label} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${e.shade}`} />
                    <span className="text-ink-muted">{e.label}</span>
                  </div>
                  <span className="font-medium text-ink">{e.count.toLocaleString()}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        {/* BOTTOM ROW — KPI + Attendance heatmap */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card className="p-5">
            <div className="flex items-start justify-between">
              <h3 className="text-base font-semibold">Average Team KPI</h3>
              <button className="rounded-full p-1.5 hover:bg-surface-muted">
                <MoreHorizontal className="h-4 w-4 text-ink-muted" />
              </button>
            </div>
            <div className="mt-4">
              <div className="text-5xl font-semibold tracking-tight">89.06<span className="text-2xl text-ink-muted">%</span></div>
              <div className="mt-1 text-xs text-ink-muted">100% target</div>
            </div>
            {/* progress bar */}
            <div className="mt-6 h-2 w-full overflow-hidden rounded-full bg-surface-muted">
              <div className="h-full rounded-full bg-brand-500" style={{ width: '89.06%' }} />
            </div>
            <div className="mt-2 flex justify-between text-xs text-ink-muted">
              <span>0%</span>
              <span className="font-medium text-brand-700">89.06%</span>
              <span>100%</span>
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-start justify-between">
              <h3 className="text-base font-semibold">Attendance Overview</h3>
              <button className="rounded-full p-1.5 hover:bg-surface-muted">
                <MoreHorizontal className="h-4 w-4 text-ink-muted" />
              </button>
            </div>
            <div className="mt-4 grid grid-cols-[auto_1fr] gap-3">
              <div className="flex flex-col justify-between py-1 text-[10px] text-ink-soft">
                {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((d) => <span key={d}>{d}</span>)}
              </div>
              <div className="grid grid-flow-col gap-1" style={{ gridTemplateRows: 'repeat(7, minmax(0, 1fr))' }}>
                {heatmap.map((v, i) => (
                  <div key={i} className={`h-3.5 w-3.5 rounded-sm ${heatShades[v]}`} />
                ))}
              </div>
            </div>
            <div className="mt-4 flex items-center justify-end gap-2 text-[11px] text-ink-muted">
              <span>Less</span>
              {heatShades.map((c, i) => <div key={i} className={`h-3 w-3 rounded-sm ${c}`} />)}
              <span>More</span>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// StatCard — could move to features/ui later
// ─────────────────────────────────────────────────────────────

function StatCard({ label, value, delta, up, icon: Icon }) {
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
      <div className="mt-5 flex items-end justify-between gap-2">
        <div>
          <div className="text-2xl font-semibold tracking-tight">{value}</div>
          <div className="mt-0.5 text-xs text-ink-muted">{label}</div>
        </div>
        <span
          className={
            'rounded-full px-2 py-0.5 text-[11px] font-medium ' +
            (up ? 'bg-success-50 text-success-700' : 'bg-danger-50 text-danger-700')
          }
        >
          {delta}
        </span>
      </div>
    </div>
  );
}
