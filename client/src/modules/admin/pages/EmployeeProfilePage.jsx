import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, MapPin, Briefcase, Building2, IndianRupee, Lock, ShieldCheck } from 'lucide-react';
import { Avatar, Card, Tabs, Button } from '../../../features/ui';
import { useAuth } from '../../../features/auth/AuthContext';
import { findEmployee, EMPLOYMENT_TYPES, ROLES } from '../../../features/employees/employeeMocks';

const formatINR = (n) => '₹' + Number(n || 0).toLocaleString('en-IN');

export default function EmployeeProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const employee = findEmployee(id);

  const isFinancePrivileged = user?.role === 'ADMIN' || user?.role === 'PAYROLL_OFFICER';

  const tabs = [
    { key: 'resume', label: 'Resume' },
    { key: 'private', label: 'Private Info' },
    ...(isFinancePrivileged ? [{ key: 'salary', label: 'Salary Info' }] : []),
    { key: 'settings', label: 'Settings' },
  ];
  const [active, setActive] = useState('resume');

  if (!employee) {
    return (
      <div className="flex h-full items-center justify-center px-8 py-20 text-center">
        <div>
          <h2 className="text-lg font-semibold">Employee not found</h2>
          <Button variant="outline" className="mt-4" onClick={() => navigate('/admin/employees')}>
            Back to directory
          </Button>
        </div>
      </div>
    );
  }

  const empType = EMPLOYMENT_TYPES.find((t) => t.value === employee.employmentType)?.label || employee.employmentType;
  const roleLabel = ROLES.find((r) => r.value === employee.role)?.label || employee.role;

  return (
    <div className="px-8 py-8">
      <button
        type="button"
        onClick={() => navigate('/admin/employees')}
        className="inline-flex items-center gap-2 text-sm text-ink-muted hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to directory
      </button>

      {/* Header */}
      <Card className="mt-4 p-6">
        <div className="flex flex-wrap items-center gap-5">
          <Avatar name={`${employee.firstName} ${employee.lastName}`} size="lg" className="h-20 w-20 text-xl" />
          <div className="flex-1 min-w-[200px]">
            <h1 className="text-2xl font-semibold tracking-tight">{employee.firstName} {employee.lastName}</h1>
            <p className="mt-1 text-sm text-ink-muted">{employee.position} · {employee.department}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Pill icon={Briefcase}>{roleLabel}</Pill>
              <Pill icon={Building2}>{empType}</Pill>
              <Pill icon={ShieldCheck}>{employee.loginId}</Pill>
            </div>
          </div>
          <div className="text-xs text-ink-muted">View-only mode</div>
        </div>
      </Card>

      {/* Tabs */}
      <div className="mt-6">
        <Tabs tabs={tabs} activeKey={active} onChange={setActive} />
      </div>

      {/* Tab content */}
      <div className="mt-6">
        {active === 'resume' && <ResumeTab e={employee} />}
        {active === 'private' && <PrivateInfoTab e={employee} />}
        {active === 'salary' && isFinancePrivileged && <SalaryInfoTab e={employee} />}
        {active === 'settings' && <SettingsTab />}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────

function Pill({ icon: Icon, children }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-muted px-2.5 py-1 text-xs text-ink">
      {Icon && <Icon className="h-3 w-3 text-brand-500" />}
      {children}
    </span>
  );
}

function Field({ label, value }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-ink-soft">{label}</div>
      <div className="mt-1 text-sm text-ink">{value || '—'}</div>
    </div>
  );
}

function ResumeTab({ e }) {
  return (
    <Card className="p-6">
      <h2 className="text-base font-semibold">About</h2>
      <div className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-3">
        <Field label="Designation"     value={e.position} />
        <Field label="Department"      value={e.department} />
        <Field label="Date of Joining" value={new Date(e.joinDate).toLocaleDateString()} />
        <Field label="Work Email"      value={e.workEmail} />
        <Field label="Phone"           value={e.phone} />
        <Field label="Employment Type" value={EMPLOYMENT_TYPES.find((t) => t.value === e.employmentType)?.label} />
      </div>
    </Card>
  );
}

function PrivateInfoTab({ e }) {
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-base font-semibold">Personal Details</h2>
        <div className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-3">
          <Field label="Date of Birth"  value={new Date(e.dob).toLocaleDateString()} />
          <Field label="Gender"         value={e.gender} />
          <Field label="Personal Email" value={e.personalEmail} />
        </div>
      </Card>
    </div>
  );
}

function SalaryInfoTab({ e }) {
  const gross = (e.basicSalary || 0) + (e.hra || 0) + (e.conveyance || 0) + (e.specialAllowance || 0) + (e.otherAllowance || 0);
  const pfAmt = e.pfEnabled ? Math.round(e.basicSalary * (e.pfPercent || 12) / 100) : 0;
  const net = gross - pfAmt - (e.professionalTax || 0);
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Salary Structure</h2>
          <span className="rounded-full bg-warning-50 px-2.5 py-1 text-[11px] text-warning-500">
            Confidential — Admin / Payroll Officer
          </span>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-3">
          <Field label="Basic Salary"      value={formatINR(e.basicSalary)} />
          <Field label="HRA"               value={formatINR(e.hra)} />
          <Field label="Conveyance"        value={formatINR(e.conveyance)} />
          <Field label="Special Allowance" value={formatINR(e.specialAllowance)} />
          <Field label="Other Allowances"  value={formatINR(e.otherAllowance)} />
          <Field label="PF"                value={e.pfEnabled ? `${e.pfPercent}% (${formatINR(pfAmt)})` : 'Not applicable'} />
          <Field label="Professional Tax"  value={formatINR(e.professionalTax)} />
        </div>
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <SummaryTile label="Gross"      value={formatINR(gross)} />
          <SummaryTile label="Deductions" value={formatINR(pfAmt + (e.professionalTax || 0))} tone="danger" />
          <SummaryTile label="Net"        value={formatINR(net)} tone="success" />
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-base font-semibold">Bank Details</h2>
        <div className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-2">
          <Field label="Bank Name"      value={e.bankName} />
          <Field label="Branch"         value={e.bankBranch} />
          <Field label="Account Number" value={e.bankAccountNo} />
          <Field label="IFSC Code"      value={e.bankIfsc} />
        </div>
      </Card>
    </div>
  );
}

function SummaryTile({ label, value, tone }) {
  const toneClass =
    tone === 'success' ? 'bg-success-50 text-success-700' :
    tone === 'danger'  ? 'bg-danger-50 text-danger-700' :
                         'bg-surface-muted text-ink';
  return (
    <div className={`rounded-xl px-4 py-3 ${toneClass}`}>
      <div className="text-xs">{label}</div>
      <div className="mt-1 text-lg font-semibold">{value}</div>
    </div>
  );
}

function SettingsTab() {
  return (
    <Card className="p-6">
      <h2 className="text-base font-semibold">Account Actions</h2>
      <p className="mt-1 text-sm text-ink-muted">Admin-only controls for this employee account.</p>
      <div className="mt-5 flex flex-wrap gap-3">
        <Button variant="outline" leftIcon={<Lock className="h-4 w-4" />}>Reset password</Button>
        <Button variant="outline" leftIcon={<Mail className="h-4 w-4" />}>Re-send credentials</Button>
        <Button variant="danger">Deactivate account</Button>
      </div>
    </Card>
  );
}
