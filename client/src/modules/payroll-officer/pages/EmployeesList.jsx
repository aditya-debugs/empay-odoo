import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { Avatar, AttendanceStatusBadge } from '../../../features/ui';
import { DEPARTMENTS, ALL_ROLES } from '../../../features/employees/employeeMocks';
import api from '../../../services/api';

const NON_ADMIN_ROLES = ALL_ROLES.filter((r) => r.value !== 'ADMIN');
const REFRESH_INTERVAL_MS = 60_000;

export default function EmployeesList() {
  const navigate = useNavigate();
  const [employeesList, setEmployeesList] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [department, setDepartment] = useState('');
  const [role, setRole] = useState('');
  const [error, setError] = useState('');
  const timerRef = useRef(null);

  const fetchEmployees = async () => {
    try {
      const params = new URLSearchParams({ search: query, role });
      const res = await api.get(`/employees?${params.toString()}`);
      setEmployeesList(res.employees || res || []);
      setTotal(res.total || (res.employees ? res.employees.length : res.length) || 0);
    } catch (err) {
      setError(err.message || 'Failed to fetch employees');
      console.error('Failed to fetch employees', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchEmployees();
    clearInterval(timerRef.current);
    timerRef.current = setInterval(fetchEmployees, REFRESH_INTERVAL_MS);
    return () => clearInterval(timerRef.current);
  }, [query, role]);

  const filtered = employeesList.filter((e) => {
    if (department && e.department !== department) return false;
    return true;
  });

  return (
    <div className="px-8 py-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">Employees</h1>
          <p className="mt-1 text-sm text-ink-muted">
            {filtered.length} of {total} employees
          </p>
        </div>
        {/* Payroll Officer might not need to create, but we keep the UI consistent as requested */}
        <div className="flex items-center gap-3">
           <span className="text-xs text-ink-muted font-medium bg-surface-muted px-2 py-1 rounded">Payroll Directory</span>
        </div>
      </div>

      {/* Filters - Exact sync with Admin */}
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

      {/* Grid - Exact sync with Admin */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {loading ? (
          [1,2,3,4,5,6,7,8].map(i => (
            <div key={i} className="h-48 rounded-2xl bg-surface-muted animate-pulse border border-border"></div>
          ))
        ) : filtered.map((e) => (
          <div
            key={e.id}
            className="group relative flex flex-col items-center rounded-2xl border border-border bg-white p-5 text-center transition-all hover:border-brand-300 hover:shadow-md"
          >
            <div className="absolute right-3 top-3">
              <AttendanceStatusBadge status={e.attendanceStatus} />
            </div>
            <Avatar name={`${e.firstName} ${e.lastName}`} size="lg" className="h-16 w-16 text-base" />
            <div className="mt-3 text-sm font-semibold text-ink">{e.firstName} {e.lastName}</div>
            <div className="mt-0.5 text-xs text-ink-muted">{e.position || '—'}</div>
            <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-surface-muted px-2 py-0.5 text-[11px] text-ink-muted">
              {e.department || '—'}
            </div>
            <div className="mt-2 text-[10px] uppercase tracking-wider text-ink-soft">{e.loginId || e.id.substring(0,8)}</div>
          </div>
        ))}

        {!loading && filtered.length === 0 && !error && (
          <div className="col-span-full flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-white py-16 text-center">
            <p className="text-sm text-ink-muted">No employees found.</p>
          </div>
        )}
      </div>
    </div>
  );
}



