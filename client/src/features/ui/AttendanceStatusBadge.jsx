import { Plane } from 'lucide-react';

/**
 * Consistent attendance status indicator used across all modules.
 *
 * Status values:
 *   PRESENT     → green dot
 *   REGULARIZED → blue/brand dot (present via regularization)
 *   ABSENT      → yellow dot (absent without an approved leave)
 *   ON_LEAVE    → ✈ plane icon in blue circle
 *   null/undef  → faint grey dot (no data)
 *
 * mode="dot"   — compact dot, used in employee card corner (default)
 * mode="badge" — pill badge with text label, used in attendance table rows
 */
export function AttendanceStatusBadge({ status, mode = 'dot' }) {
  const cfg = getConfig(status);

  if (mode === 'badge') {
    if (status === 'ON_LEAVE') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wide border bg-brand-50 text-brand-700 border-brand-200">
          <Plane className="h-3 w-3" />
          On Leave
        </span>
      );
    }
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wide border ${cfg.badgeClass}`}>
        <span className={`h-1.5 w-1.5 rounded-full ${cfg.dotClass}`} />
        {cfg.label}
      </span>
    );
  }

  // dot mode
  if (status === 'ON_LEAVE') {
    return (
      <span title="On Leave" className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-100 text-brand-600">
        <Plane className="h-3 w-3" />
      </span>
    );
  }
  return (
    <span title={cfg.label} className="flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-border">
      <span className={`h-2.5 w-2.5 rounded-full ${cfg.dotClass}`} />
    </span>
  );
}

function getConfig(status) {
  switch (status) {
    case 'PRESENT':
      return { label: 'Present', dotClass: 'bg-green-500', badgeClass: 'bg-green-50 text-green-700 border-green-200' };
    case 'REGULARIZED':
      return { label: 'Regularized', dotClass: 'bg-brand-500', badgeClass: 'bg-brand-50 text-brand-700 border-brand-200' };
    case 'HALF_DAY':
      return { label: 'Half Day', dotClass: 'bg-amber-400', badgeClass: 'bg-amber-50 text-amber-700 border-amber-200' };
    case 'ABSENT':
      return { label: 'Absent', dotClass: 'bg-yellow-400', badgeClass: 'bg-yellow-50 text-yellow-700 border-yellow-200' };
    default:
      return { label: 'No Data', dotClass: 'bg-gray-300', badgeClass: 'bg-gray-50 text-gray-500 border-gray-200' };
  }
}
