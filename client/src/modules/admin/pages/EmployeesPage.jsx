import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Plane } from 'lucide-react';
import { Avatar, Button } from '../../../features/ui';
import { DEPARTMENTS, ALL_ROLES } from '../../../features/employees/employeeMocks';
import api from '../../../services/api';

import { employeesService } from '../../../services/usersService';

const NON_ADMIN_ROLES = ALL_ROLES.filter((r) => r.value !== 'ADMIN');

function StatusIndicator({ status }) {
  if (status === 'ON_LEAVE') {
    return (
      <span title="On leave" className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-100 text-brand-700">
        <Plane className="h-3 w-3" />
      </span>
    );
  }
  if (!status) {
    // No attendance data yet — show a neutral indicator
    return (
      <span title="No attendance data" className="flex h-6 w-6 items-center justify-center rounded-full bg-surface-muted">
        <span className="h-2 w-2 rounded-full bg-ink-soft/40" />
      </span>
    );
  }
  const dot =
    status === 'PRESENT'  ? 'bg-success-500' :
    status === 'HALF_DAY' ? 'bg-warning-500' :
                            'bg-warning-500';
  const label =
    status === 'PRESENT'  ? 'Present' :
    status === 'HALF_DAY' ? 'Half-day' : 'Absent';
  return (
    <span title={label} className="flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-border">
      <span className={`h-2.5 w-2.5 rounded-full ${dot}`} />
    </span>
  );
}

export default function EmployeesPage() {
  const navigate = useNavigate();
  const [employeesList, setEmployeesList] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [department, setDepartment] = useState('');
  const [role, setRole] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ search: query, role }).toString();
        const res = await employeesService.list(params);
        setEmployeesList(res.employees || []);
        setTotal(res.total || 0);
      } catch (err) {
        setError(err.message || 'Failed to fetch employees');
        console.error('Failed to fetch employees', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [query, role]); // Refresh when search or role changes

  const filtered = employeesList.filter((e) => {
    if (department && e.department !== department) return false;
    return true;
  });

  return (
    <div className="px-8 py-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Employees</h1>
          <p className="mt-1 text-sm text-ink-muted">
            {filtered.length} of {total} employees
          </p>
        </div>
        <Button
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={() => navigate('/admin/employees/new')}
        >
          New Employee
        </Button>
      </div>

      {/* Filters */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="flex flex-1 min-w-[240px] items-center gap-2 rounded-full border border-border bg-white px-3.5">
          <Search className="h-4 w-4 text-ink-muted" />
          <input
            type="search"
            placeholder="Search by name, position, or login ID"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-10 w-full bg-transparent text-sm text-ink placeholder:text-ink-soft focus:outline-none"
          />
        </div>
        <select
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          className="h-10 rounded-full border border-border bg-white px-3 text-sm text-ink focus:border-brand-500 focus:outline-none"
        >
          <option value="">All departments</option>
          {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="h-10 rounded-full border border-border bg-white px-3 text-sm text-ink focus:border-brand-500 focus:outline-none"
        >
          <option value="">All roles</option>
          {NON_ADMIN_ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
      </div>

      {error && (
        <div className="mt-4 rounded-xl bg-danger-50 px-3 py-2 text-sm text-danger-700">{error}</div>
      )}

      {/* Grid */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filtered.map((e) => (
          <button
            key={e.id}
            type="button"
            onClick={() => navigate(`/admin/employees/${e.id}`)}
            className="group relative flex flex-col items-center rounded-2xl border border-border bg-white p-5 text-center transition-all hover:border-brand-300 hover:shadow-md"
          >
            <div className="absolute right-3 top-3">
              <StatusIndicator status={e.attendanceStatus} />
            </div>
            <Avatar name={`${e.firstName} ${e.lastName}`} size="lg" className="h-16 w-16 text-base" />
            <div className="mt-3 text-sm font-semibold text-ink">{e.firstName} {e.lastName}</div>
            <div className="mt-0.5 text-xs text-ink-muted">{e.position || '—'}</div>
            <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-surface-muted px-2 py-0.5 text-[11px] text-ink-muted">
              {e.department || '—'}
            </div>
            <div className="mt-2 text-[10px] uppercase tracking-wider text-ink-soft">{e.loginId}</div>
          </button>
        ))}

        {!loading && filtered.length === 0 && !error && (
          <div className="col-span-full flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-white py-16 text-center">
            <p className="text-sm text-ink-muted">No employees yet — create one with the "New Employee" button above.</p>
          </div>
        )}
      </div>
    </div>
  );
}
