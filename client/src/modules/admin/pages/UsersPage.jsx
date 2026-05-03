import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Plus, MoreHorizontal, KeyRound, UserX, Trash2, Eye, ShieldCheck,
  ChevronLeft, ChevronRight,
} from 'lucide-react';
import { Avatar, Button, Card } from '../../../features/ui';
import { useAuth } from '../../../features/auth/AuthContext';
import { ALL_ROLES } from '../../../features/employees/employeeMocks';
import usersService from '../../../services/usersService';

const PAGE_SIZE = 10;

const roleStyle = {
  ADMIN:           'bg-brand-100 text-brand-700',
  HR_OFFICER:      'bg-warning-50 text-warning-500',
  PAYROLL_OFFICER: 'bg-surface-muted text-ink',
  EMPLOYEE:        'bg-success-50 text-success-700',
};

export default function UsersPage() {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [openMenuId, setOpenMenuId] = useState(null);
  const [resetResult, setResetResult] = useState(null);
  const [page, setPage] = useState(1);

  async function refresh() {
    setLoading(true);
    setError('');
    try {
      const { users } = await usersService.list();
      setUsers(users);
    } catch (e) {
      setError(e.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { refresh(); }, []);

  const filtered = useMemo(() => {
    setPage(1); // reset to page 1 whenever filters change
    return users.filter((u) => {
      if (roleFilter && u.role !== roleFilter) return false;
      if (query) {
        const q = query.toLowerCase();
        const fullName = `${u.firstName || ''} ${u.lastName || ''}`.toLowerCase();
        if (
          !fullName.includes(q) &&
          !(u.email || '').toLowerCase().includes(q) &&
          !(u.loginId || '').toLowerCase().includes(q)
        ) return false;
      }
      return true;
    });
  }, [users, query, roleFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  async function changeRole(id, newRole) {
    const prev = users;
    setUsers((list) => list.map((u) => (u.id === id ? { ...u, role: newRole } : u)));
    try {
      const { user } = await usersService.changeRole(id, newRole);
      setUsers((list) => list.map((u) => (u.id === id ? user : u)));
    } catch (e) {
      setUsers(prev);
      alert(e.message || 'Could not change role');
    }
  }

  async function toggleActive(u) {
    setOpenMenuId(null);
    try {
      const fn = u.isActive ? usersService.deactivate : usersService.activate;
      const { user: updated } = await fn(u.id);
      setUsers((list) => list.map((x) => (x.id === u.id ? updated : x)));
    } catch (e) {
      alert(e.message || 'Could not update status');
    }
  }

  async function deleteUser(id) {
    setOpenMenuId(null);
    if (!confirm('Permanently delete this user? This cannot be undone.')) return;
    try {
      await usersService.remove(id);
      setUsers((list) => list.filter((u) => u.id !== id));
    } catch (e) {
      alert(e.message || 'Could not delete user');
    }
  }

  async function resetPassword(u) {
    setOpenMenuId(null);
    try {
      const { tempPassword } = await usersService.resetPassword(u.id);
      setResetResult({ user: u, tempPassword });
    } catch (e) {
      alert(e.message || 'Could not reset password');
    }
  }

  return (
    <div className="px-8 py-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Users &amp; Roles</h1>
          <p className="mt-1 text-sm text-ink-muted">
            {loading
              ? 'Loading users…'
              : `Manage every system user and their access level — ${filtered.length} of ${users.length} shown.`}
          </p>
        </div>
        <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => navigate('/admin/users/new')}>
          New User
        </Button>
      </div>

      {/* Filters */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="flex flex-1 min-w-[240px] items-center gap-2 rounded-full border border-border bg-white px-3.5">
          <Search className="h-4 w-4 text-ink-muted" />
          <input
            type="search"
            placeholder="Search by name, email, or login ID"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-10 w-full bg-transparent text-sm text-ink placeholder:text-ink-soft focus:outline-none"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="h-10 rounded-full border border-border bg-white px-3 text-sm text-ink focus:border-brand-500 focus:outline-none"
        >
          <option value="">All roles</option>
          {ALL_ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
      </div>

      {error && (
        <div className="mt-4 rounded-xl bg-danger-50 px-3 py-2 text-sm text-danger-700">{error}</div>
      )}

      {/* Table */}
      <Card className="mt-6 overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-surface-muted text-left">
              <tr className="text-xs uppercase tracking-wider text-ink-soft">
                <th className="px-5 py-3 font-medium">User</th>
                <th className="px-5 py-3 font-medium">Login ID</th>
                <th className="px-5 py-3 font-medium">Email</th>
                <th className="px-5 py-3 font-medium">Role</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={6} className="px-5 py-12 text-center text-sm text-ink-muted">Loading…</td></tr>
              )}

              {!loading && paginated.map((u) => {
                const isSelf = u.id === currentUser?.id;
                return (
                  <tr key={u.id} className="border-b border-border last:border-0 hover:bg-surface-muted/40">
                    <td className="px-5 py-3">
                      <button
                        type="button"
                        onClick={() => navigate(`/admin/employees/${u.id}`)}
                        className="flex items-center gap-3 text-left"
                      >
                        <Avatar name={`${u.firstName} ${u.lastName}`} size="sm" />
                        <div>
                          <div className="font-medium text-ink">
                            {u.firstName} {u.lastName}
                            {isSelf && <span className="ml-2 rounded-full bg-brand-100 px-1.5 py-0.5 text-[10px] text-brand-700">You</span>}
                          </div>
                          <div className="text-xs text-ink-muted">{u.position || '—'}</div>
                        </div>
                      </button>
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-ink-muted">{u.loginId || '—'}</td>
                    <td className="px-5 py-3 text-ink">{u.email}</td>
                    <td className="px-5 py-3">
                      <select
                        value={u.role}
                        onChange={(e) => changeRole(u.id, e.target.value)}
                        disabled={isSelf}
                        className={`rounded-full px-3 py-1 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-400/40 disabled:opacity-60 ${roleStyle[u.role]}`}
                      >
                        {ALL_ROLES.map((r) => (
                          <option key={r.value} value={r.value}>{r.label}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={
                          'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium ' +
                          (u.isActive
                            ? 'bg-success-50 text-success-700'
                            : 'bg-surface-muted text-ink-muted')
                        }
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${u.isActive ? 'bg-success-500' : 'bg-ink-soft'}`} />
                        {u.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="relative inline-block">
                        <button
                          type="button"
                          onClick={() => setOpenMenuId(openMenuId === u.id ? null : u.id)}
                          className="rounded-full p-1.5 hover:bg-surface-muted"
                          aria-label="Actions"
                        >
                          <MoreHorizontal className="h-4 w-4 text-ink-muted" />
                        </button>
                        {openMenuId === u.id && (
                          <div className="absolute right-0 z-10 mt-1 w-48 overflow-hidden rounded-xl border border-border bg-white shadow-lg">
                            <MenuItem icon={Eye} onClick={() => { setOpenMenuId(null); navigate(`/admin/employees/${u.id}`); }}>
                              View profile
                            </MenuItem>
                            <MenuItem icon={KeyRound} onClick={() => resetPassword(u)}>
                              Reset password
                            </MenuItem>
                            <MenuItem icon={UserX} disabled={isSelf} onClick={() => !isSelf && toggleActive(u)}>
                              {u.isActive ? 'Deactivate' : 'Reactivate'}
                            </MenuItem>
                            <MenuItem icon={Trash2} danger disabled={isSelf} onClick={() => !isSelf && deleteUser(u.id)}>
                              Delete
                            </MenuItem>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {!loading && filtered.length === 0 && !error && (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-sm text-ink-muted">
                    No users match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Pagination */}
      {!loading && filtered.length > 0 && (
        <div className="mt-4 flex items-center justify-between gap-4">
          {/* Row count info */}
          <p className="text-xs text-ink-muted">
            Showing <span className="font-semibold text-ink">{(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)}</span> of <span className="font-semibold text-ink">{filtered.length}</span> users
          </p>

          {/* Page buttons — Google style */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-ink-muted transition-colors hover:bg-surface-muted disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
              .reduce((acc, p, idx, arr) => {
                if (idx > 0 && p - arr[idx - 1] > 1) acc.push('ellipsis-' + p);
                acc.push(p);
                return acc;
              }, [])
              .map((p) =>
                typeof p === 'string' ? (
                  <span key={p} className="flex h-8 w-8 items-center justify-center text-xs text-ink-soft select-none">
                    …
                  </span>
                ) : (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPage(p)}
                    className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-medium transition-all ${
                      p === safePage
                        ? 'bg-brand-500 text-white shadow-sm'
                        : 'border border-border text-ink-muted hover:bg-surface-muted'
                    }`}
                  >
                    {p}
                  </button>
                )
              )}

            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-ink-muted transition-colors hover:bg-surface-muted disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Footer hint */}
      <div className="mt-3 flex items-center gap-2 text-xs text-ink-muted">
        <ShieldCheck className="h-3.5 w-3.5 text-brand-500" />
        Role changes apply immediately. Use the Employees tab if you only want to add an Employee-role user.
      </div>

      {/* Reset password result modal */}
      {resetResult && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4"
          onClick={() => setResetResult(null)}
        >
          <Card
            className="max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-brand-700">
              <KeyRound className="h-5 w-5" />
            </div>
            <h3 className="mt-3 text-lg font-semibold">Password reset</h3>
            <p className="mt-1 text-sm text-ink-muted">
              Share this temporary password with <span className="font-medium text-ink">{resetResult.user.firstName} {resetResult.user.lastName}</span>. They will be required to change it on next login.
            </p>
            <div className="mt-4 rounded-xl border border-border bg-surface-muted p-4 font-mono text-lg font-semibold tracking-wider text-ink">
              {resetResult.tempPassword}
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="outline" onClick={() => navigator.clipboard?.writeText(resetResult.tempPassword)}>Copy</Button>
              <Button onClick={() => setResetResult(null)}>Done</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

function MenuItem({ icon: Icon, children, onClick, danger, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={
        'flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors ' +
        (disabled
          ? 'cursor-not-allowed text-ink-soft'
          : danger
            ? 'text-danger-700 hover:bg-danger-50'
            : 'text-ink hover:bg-surface-muted')
      }
    >
      <Icon className="h-4 w-4" />
      {children}
    </button>
  );
}



