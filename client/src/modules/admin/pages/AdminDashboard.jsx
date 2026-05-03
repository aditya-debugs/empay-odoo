import { useEffect, useState } from 'react';
import {
  Users, UserCheck, CalendarClock, IndianRupee,
  Clock, AlertTriangle, ShieldCheck, MoreHorizontal,
  ArrowUpRight, Calendar, TrendingUp, TrendingDown, Download,
} from 'lucide-react';
import { Card, Button, Avatar } from '../../../features/ui';
import { useAuth } from '../../../features/auth/AuthContext';
import api from '../../../services/api';

function exportDashboardPDF(data, user, attendancePct) {
  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
  const generatedAt = new Date().toLocaleString('en-IN');

  const depts = (data?.departments || [])
    .map(d => `<tr>
      <td style="padding:8px 12px;border-bottom:1px solid #E2E8E5;">${d.label}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #E2E8E5;text-align:right;font-weight:600;">${d.count}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #E2E8E5;text-align:right;">${Math.round((d.count/(data?.stats?.totalEmployees||1))*100)}%</td>
    </tr>`).join('');

  const activity = (data?.activity || []).slice(0, 8)
    .map(a => `<tr>
      <td style="padding:8px 12px;border-bottom:1px solid #E2E8E5;">${a.who}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #E2E8E5;">${a.what}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #E2E8E5;color:#8EA09A;">${a.when}</td>
    </tr>`).join('');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>EmPay Dashboard Report — ${today}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #0D1A13; background: #fff; font-size: 13px; line-height: 1.5; }
  .page { max-width: 900px; margin: 0 auto; padding: 40px 48px; }
  .header { display: flex; align-items: flex-start; justify-content: space-between; padding-bottom: 24px; border-bottom: 2px solid #0F4C3A; margin-bottom: 32px; }
  .logo { display: flex; align-items: center; gap: 10px; }
  .logo-box { width: 40px; height: 40px; background: #0F4C3A; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 20px; font-weight: 900; }
  .logo-text { font-size: 22px; font-weight: 700; color: #0F4C3A; }
  .header-meta { text-align: right; color: #8EA09A; font-size: 11px; }
  .header-meta strong { display: block; color: #0D1A13; font-size: 16px; font-weight: 700; margin-bottom: 2px; }
  .section-title { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #8EA09A; margin-bottom: 12px; margin-top: 28px; }
  .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 4px; }
  .stat-card { border: 1px solid #E2E8E5; border-radius: 12px; padding: 16px; background: #FAFBFA; }
  .stat-value { font-size: 28px; font-weight: 800; color: #0D1A13; line-height: 1; }
  .stat-label { font-size: 11px; color: #526058; margin-top: 4px; font-weight: 500; }
  .stat-sub { font-size: 10px; color: #8EA09A; margin-top: 2px; }
  .attendance-bar-wrap { background: #EFF2F0; border-radius: 99px; height: 10px; margin: 8px 0; overflow: hidden; }
  .attendance-bar { height: 100%; border-radius: 99px; background: linear-gradient(90deg,#27B374,#0F4C3A); }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th { text-align: left; padding: 8px 12px; background: #EFF2F0; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #8EA09A; }
  tr:last-child td { border-bottom: none !important; }
  .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #E2E8E5; font-size: 10px; color: #8EA09A; display: flex; justify-content: space-between; }
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
</style>
</head>
<body>
<div class="page">
  <div class="header">
    <div class="logo">
      <div class="logo-box">E</div>
      <span class="logo-text">EmPay</span>
    </div>
    <div class="header-meta">
      <strong>Dashboard Statistics Report</strong>
      Generated on ${generatedAt}<br/>
      Prepared by: ${user?.name || 'Administrator'}<br/>
      ${today}
    </div>
  </div>

  <div class="section-title">Key Metrics</div>
  <div class="stats-grid">
    <div class="stat-card">
      <div class="stat-value">${data?.stats?.totalEmployees || 0}</div>
      <div class="stat-label">Total Employees</div>
      <div class="stat-sub">Active in system</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${data?.stats?.presentToday || 0}</div>
      <div class="stat-label">Present Today</div>
      <div class="stat-sub">${attendancePct}% attendance rate</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${data?.stats?.pendingLeaves || 0}</div>
      <div class="stat-label">Pending Leaves</div>
      <div class="stat-sub">Awaiting approval</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">₹${(data?.stats?.payrollDue || 0).toLocaleString('en-IN')}</div>
      <div class="stat-label">Payroll Due</div>
      <div class="stat-sub">This cycle</div>
    </div>
  </div>

  <div class="section-title">Attendance Overview</div>
  <div style="border:1px solid #E2E8E5;border-radius:12px;padding:16px;background:#FAFBFA;">
    <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:6px;">
      <span style="color:#526058;">Attendance Rate</span>
      <strong>${attendancePct}%</strong>
    </div>
    <div class="attendance-bar-wrap">
      <div class="attendance-bar" style="width:${attendancePct}%"></div>
    </div>
    <div style="display:flex;gap:24px;margin-top:10px;font-size:11px;color:#526058;">
      <span>● Present: <strong style="color:#0D1A13;">${data?.stats?.presentToday || 0}</strong></span>
      <span>● Absent: <strong style="color:#0D1A13;">${(data?.stats?.totalEmployees||0)-(data?.stats?.presentToday||0)}</strong></span>
      <span>● On Leave: <strong style="color:#0D1A13;">${data?.stats?.pendingLeaves || 0}</strong></span>
    </div>
  </div>

  ${depts ? `
  <div class="section-title">Department Headcount</div>
  <table>
    <thead><tr><th>Department</th><th style="text-align:right">Employees</th><th style="text-align:right">Share</th></tr></thead>
    <tbody>${depts}</tbody>
  </table>` : ''}

  ${activity ? `
  <div class="section-title">Recent Activity</div>
  <table>
    <thead><tr><th>User</th><th>Action</th><th>Time</th></tr></thead>
    <tbody>${activity}</tbody>
  </table>` : ''}

  <div class="footer">
    <span>EmPay HRMS &amp; Payroll — Confidential</span>
    <span>Generated ${generatedAt}</span>
  </div>
</div>
</body>
</html>`;

  const win = window.open('', '_blank', 'width=960,height=700');
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => { win.print(); }, 600);
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/dashboard/admin');
        setData(res);
      } catch (err) {
        console.error('Failed to fetch admin dashboard', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="p-8 space-y-6 animate-pulse">
        <div className="h-8 w-48 rounded-lg bg-surface-muted" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-28 rounded-[14px] bg-surface-muted" />)}
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-52 rounded-[14px] bg-surface-muted" />)}
        </div>
      </div>
    );
  }

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const attendancePct = data?.stats?.totalEmployees
    ? Math.round((data.stats.presentToday / data.stats.totalEmployees) * 100)
    : 0;

  const statsList = [
    {
      label: 'Total Employees', value: String(data?.stats?.totalEmployees || 0),
      sub: 'Active in system', trend: '+3 this month', trendUp: true, icon: Users,
      iconBg: 'bg-brand-50', iconColor: 'text-brand-500',
    },
    {
      label: 'Present Today', value: String(data?.stats?.presentToday || 0),
      sub: `${attendancePct}% attendance`, trend: 'Rate today', trendUp: attendancePct >= 80, icon: UserCheck,
      iconBg: 'bg-success-50', iconColor: 'text-success-500',
    },
    {
      label: 'Pending Leaves', value: String(data?.stats?.pendingLeaves || 0),
      sub: 'Awaiting approval', trend: 'Review queue', trendUp: false, icon: CalendarClock,
      iconBg: 'bg-warning-50', iconColor: 'text-warning-500',
    },
    {
      label: 'Payroll Due', value: `₹${(data?.stats?.payrollDue || 0).toLocaleString('en-IN')}`,
      sub: 'Monthly total', trend: 'This cycle', trendUp: true, icon: IndianRupee,
      iconBg: 'bg-accent-50', iconColor: 'text-accent-500',
    },
  ];

  return (
    <div className="px-7 py-8 space-y-7 min-h-screen bg-surface">
      {/* HEADER */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-ink-soft uppercase tracking-widest">{today}</p>
          <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-ink">
            Good morning, <span className="text-brand-500">{user?.name?.split(' ')[0]}</span>
          </h1>
          <p className="mt-0.5 text-sm text-ink-muted">Here's what's happening across your organization today.</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-white px-3 py-1.5 text-xs font-medium text-ink-muted hover:bg-surface-muted transition-colors shadow-sm">
            <Calendar className="h-3.5 w-3.5" />
            <span>{new Date().getFullYear()}</span>
          </button>
          <Button
            variant="primary"
            size="sm"
            leftIcon={exporting ? null : <Download className="h-3.5 w-3.5" />}
            loading={exporting}
            onClick={() => {
              setExporting(true);
              exportDashboardPDF(data, user, attendancePct);
              setTimeout(() => setExporting(false), 1000);
            }}
          >
            Export PDF
          </Button>
        </div>
      </div>

      {/* STAT CARDS */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 stagger">
        {statsList.map((s) => <StatCard key={s.label} {...s} />)}
      </div>

      {/* THREE-COLUMN PANELS */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Attendance Today */}
        <Card className="p-5">
          <PanelHeader title="Attendance Today" subtitle={`${data?.stats?.presentToday || 0} of ${data?.stats?.totalEmployees || 0} present`} />
          <div className="mt-5">
            <div className="flex items-center justify-between text-xs text-ink-muted mb-1.5">
              <span>Attendance rate</span>
              <span className="font-semibold text-ink">{attendancePct}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-surface-muted">
              <div
                className="h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-500 transition-all duration-700"
                style={{ width: `${attendancePct}%` }}
              />
            </div>
          </div>
          <ul className="mt-5 space-y-2.5">
            {[
              { label: 'Present', count: data?.stats?.presentToday || 0, color: 'bg-success-500' },
              { label: 'Absent', count: (data?.stats?.totalEmployees || 0) - (data?.stats?.presentToday || 0), color: 'bg-danger-400' },
              { label: 'On Leave', count: data?.stats?.pendingLeaves || 0, color: 'bg-warning-500' },
            ].map(item => (
              <li key={item.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${item.color}`} />
                  <span className="text-sm text-ink-muted">{item.label}</span>
                </div>
                <span className="text-sm font-semibold text-ink">{item.count}</span>
              </li>
            ))}
          </ul>
        </Card>

        {/* Recent Activity */}
        <Card className="p-5">
          <PanelHeader title="Recent Activity" subtitle="Latest system events" />
          <ul className="mt-4 space-y-3">
            {(data?.activity || []).slice(0, 4).map((a, i) => {
              const iconMap = { LEAVE: CalendarClock, PAYROLL: ShieldCheck, EMPLOYEE: Users, DISPUTE: AlertTriangle };
              const Icon = iconMap[a.type] || Clock;
              const toneMap = {
                LEAVE: 'bg-brand-50 text-brand-600',
                PAYROLL: 'bg-success-50 text-success-600',
                EMPLOYEE: 'bg-accent-50 text-accent-600',
                DISPUTE: 'bg-danger-50 text-danger-600',
              };
              return (
                <li key={i} className="flex items-start gap-3">
                  <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${toneMap[a.type] || 'bg-surface-muted text-ink-muted'}`}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-ink leading-snug truncate">
                      <span className="font-semibold">{a.who}</span> {a.what}
                    </div>
                    <div className="mt-0.5 text-[10px] text-ink-soft">{a.when}</div>
                  </div>
                </li>
              );
            })}
            {(!data?.activity?.length) && (
              <li className="py-6 text-center text-sm text-ink-soft italic">No recent activity</li>
            )}
          </ul>
        </Card>

        {/* Department Headcount */}
        <Card className="p-5">
          <PanelHeader title="Department Headcount" subtitle={`${data?.stats?.totalEmployees || 0} employees total`} />
          <ul className="mt-4 space-y-3.5">
            {(data?.departments || []).map((d) => {
              const pct = Math.round((d.count / (data?.stats?.totalEmployees || 1)) * 100);
              return (
                <li key={d.label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-ink-muted">{d.label}</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-ink">{d.count}</span>
                      <span className="text-[10px] text-ink-soft">({pct}%)</span>
                    </div>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-muted">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, trend, trendUp, icon: Icon, iconBg, iconColor }) {
  return (
    <div className="rounded-[14px] border border-border bg-white p-5 shadow-[0_1px_3px_rgba(13,26,19,0.06)] hover:shadow-[0_4px_12px_rgba(13,26,19,0.09)] hover:-translate-y-0.5 transition-all duration-200 animate-fade-up">
      <div className="flex items-start justify-between">
        <div className={`rounded-xl ${iconBg} p-2.5`}>
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
        <span className={`flex items-center gap-0.5 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
          trendUp ? 'bg-success-50 text-success-600' : 'bg-warning-50 text-warning-600'
        }`}>
          {trendUp ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
          {trend}
        </span>
      </div>
      <div className="mt-4">
        <div className="text-[26px] font-bold tracking-tight text-ink leading-none">{value}</div>
        <div className="mt-1 text-xs font-medium text-ink-muted">{label}</div>
        <div className="mt-0.5 text-[10px] text-ink-soft">{sub}</div>
      </div>
    </div>
  );
}

function PanelHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-start justify-between gap-2">
      <div>
        <h3 className="text-[14px] font-semibold text-ink">{title}</h3>
        {subtitle && <p className="mt-0.5 text-xs text-ink-muted">{subtitle}</p>}
      </div>
      {action || (
        <button className="rounded-lg p-1.5 hover:bg-surface-muted text-ink-soft transition-colors">
          <MoreHorizontal className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}



