import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus } from 'lucide-react';
import { Avatar, Button, AttendanceStatusBadge } from '../../../features/ui';
import { DEPARTMENTS, ALL_ROLES } from '../../../features/employees/employeeMocks';
import { employeesService } from '../../../services/usersService';

const NON_ADMIN_ROLES = ALL_ROLES.filter((r) => r.value !== 'ADMIN');
const REFRESH_INTERVAL_MS = 60_000;

export default function EmployeesPage() {
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
      const params = new URLSearchParams({ search: query, role }).toString();
      const res = await employeesService.list(params);
      setEmployeesList(res.employees || []);
      setTotal(res.total || 0);
    } catch (err) {
      setError(err.message || 'Failed to fetch employees');
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
    <div className="min-h-screen bg-[#F8F9FA] px-8 py-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-ink">Employees</h1>
          <p className="mt-1 text-sm font-medium text-ink-muted">
            {filtered.length} of {total} employees
          </p>
        </div>
        <Button
          className="bg-[#0D3B2E] hover:bg-[#0A2E24] text-white font-bold py-2.5 px-6 rounded-xl border-none"
          onClick={() => navigate('/admin/employees/new')}
        >
          <Plus className="h-4 w-4 mr-2" /> New Employee
        </Button>
      </div>

      {/* Filters Bar */}
      <div className="mt-8 flex flex-wrap items-center gap-4">
        <div className="flex flex-1 min-w-[300px] items-center gap-3 rounded-full border border-border bg-white px-5 shadow-sm">
          <Search className="h-4 w-4 text-ink-soft" />
          <input
            type="search"
            placeholder="Search by name, position, or login ID"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-12 w-full bg-transparent text-sm text-ink placeholder:text-ink-soft focus:outline-none font-medium"
          />
        </div>
        
        <div className="flex items-center gap-3">
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="h-12 rounded-full border border-border bg-white px-6 text-sm font-bold text-ink-muted focus:border-green-500 focus:outline-none shadow-sm min-w-[160px] appearance-none"
            style={{ backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2012%2012%22%3E%3Cpath%20fill%3D%22%236b7280%22%20d%3D%22M10.293%203.293L6%207.586%201.707%203.293A1%201%200%2000.293%204.707l5%205a1%201%200%20001.414%200l5-5a1%201%200%2010-1.414-1.414z%22%2F%3E%3C%2Fsvg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', paddingRight: '2.5rem' }}
          >
            <option value="">All departments</option>
            {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>

          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="h-12 rounded-full border border-border bg-white px-6 text-sm font-bold text-ink-muted focus:border-green-500 focus:outline-none shadow-sm min-w-[140px] appearance-none"
            style={{ backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2012%2012%22%3E%3Cpath%20fill%3D%22%236b7280%22%20d%3D%22M10.293%203.293L6%207.586%201.707%203.293A1%201%200%2000.293%204.707l5%205a1%201%200%20001.414%200l5-5a1%201%200%2010-1.414-1.414z%22%2F%3E%3C%2Fsvg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', paddingRight: '2.5rem' }}
          >
            <option value="">All roles</option>
            {NON_ADMIN_ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </div>
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>
      )}

      {/* Grid */}
      <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {loading ? (
          [1,2,3,4].map(i => <div key={i} className="h-64 bg-white rounded-2xl animate-pulse shadow-sm" />)
        ) : filtered.map((e) => (
          <button
            key={e.id}
            type="button"
            onClick={() => navigate(`/admin/employees/${e.id}`)}
            className="group relative flex flex-col items-center rounded-2xl border border-border bg-white p-8 text-center shadow-sm transition-all hover:shadow-md hover:ring-2 hover:ring-green-500/20"
          >
            <div className="absolute right-4 top-4">
              <AttendanceStatusBadge status={e.attendanceStatus} />
            </div>
            
            <Avatar name={`${e.firstName} ${e.lastName}`} className="h-20 w-20 text-xl font-bold bg-green-50 text-green-700 ring-4 ring-gray-50" />
            
            <div className="mt-5 font-bold text-ink group-hover:text-green-700 transition-colors">
              {e.firstName} {e.lastName}
            </div>
            <div className="mt-1 text-[13px] font-medium text-ink-muted">
              {e.position || '—'}
            </div>
            
            <div className="mt-4 inline-flex items-center rounded-full bg-surface-muted px-4 py-1 text-[11px] font-bold text-ink-muted uppercase tracking-wide">
              {e.department || '—'}
            </div>
            
            <div className="mt-4 text-[10px] font-bold uppercase tracking-widest text-ink-soft">
              {e.employeeId || e.loginId}
            </div>
          </button>
        ))}

        {!loading && filtered.length === 0 && !error && (
          <div className="col-span-full flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-border bg-white py-24 text-center">
            <Search className="h-12 w-12 text-border-strong mb-4" />
            <p className="text-ink-muted font-medium">No employees found matching your criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
}



