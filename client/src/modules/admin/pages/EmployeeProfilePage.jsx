import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Briefcase, Building2, Lock, ShieldCheck } from 'lucide-react';
import { Avatar, Card, Tabs, Button } from '../../../features/ui';
import { useAuth } from '../../../features/auth/AuthContext';
import { EMPLOYMENT_TYPES, ALL_ROLES } from '../../../features/employees/employeeMocks';
import usersService from '../../../services/usersService';

const formatINR = (n) => '₹' + Number(n || 0).toLocaleString('en-IN');

export default function EmployeeProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const isFinancePrivileged = user?.role === 'ADMIN' || user?.role === 'PAYROLL_OFFICER';

  useEffect(() => {
    let active = true;
    setLoading(true);
    usersService.get(id)
      .then(({ user: u }) => { if (active) setEmployee(u); })
      .catch((e) => { if (active) setError(e.message || 'Failed to load profile'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  const tabs = [
    { key: 'resume', label: 'Resume' },
    { key: 'private', label: 'Private Info' },
    ...(isFinancePrivileged ? [{ key: 'salary', label: 'Salary Info' }] : []),
    { key: 'settings', label: 'Settings' },
  ];
  const [active, setActive] = useState('resume');

  if (loading) {
    return <div className="flex h-full items-center justify-center px-8 py-20 text-ink-muted">Loading…</div>;
  }
  if (error || !employee) {
    return (
      <div className="flex h-full items-center justify-center px-8 py-20 text-center">
        <div>
          <h2 className="text-lg font-semibold">{error || 'Employee not found'}</h2>
          <Button variant="outline" className="mt-4" onClick={() => navigate('/admin/employees')}>
            Back to directory
          </Button>
        </div>
      </div>
    );
  }

  const empType = EMPLOYMENT_TYPES.find((t) => t.value === employee.employmentType)?.label || employee.employmentType;
  const roleLabel = ALL_ROLES.find((r) => r.value === employee.role)?.label || employee.role;

  return (
    <div className="px-8 py-8">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-sm text-ink-muted hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      {/* Header */}
      <Card className="mt-4 p-6">
        <div className="flex flex-wrap items-center gap-5">
          <Avatar src={employee.avatarUrl ? import.meta.env.VITE_API_URL.replace('/api/v1', '') + employee.avatarUrl : null} name={`${employee.firstName} ${employee.lastName}`} size="lg" className="h-20 w-20 text-xl" />
          <div className="flex-1 min-w-[200px]">
            <h1 className="text-2xl font-semibold tracking-tight">{employee.firstName} {employee.lastName}</h1>
            <p className="mt-1 text-sm text-ink-muted">
              {employee.position || '—'}{employee.department ? ` · ${employee.department}` : ''}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Pill icon={Briefcase}>{roleLabel}</Pill>
              {empType && <Pill icon={Building2}>{empType}</Pill>}
              {employee.loginId && <Pill icon={ShieldCheck}>{employee.loginId}</Pill>}
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
        {active === 'resume'   && <ResumeTab e={employee} />}
        {active === 'private'  && <PrivateInfoTab e={employee} />}
        {active === 'salary' && isFinancePrivileged && <SalaryInfoTab e={employee} />}
        {active === 'settings' && <SettingsTab e={employee} />}
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

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString() : '—');

function ResumeTab({ e }) {
  return (
    <Card className="p-6">
      <h2 className="text-base font-semibold">About</h2>
      <div className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-3">
        <Field label="Designation"     value={e.position} />
        <Field label="Department"      value={e.department} />
        <Field label="Date of Joining" value={fmtDate(e.joinDate)} />
        <Field label="Work Email"      value={e.email} />
        <Field label="Phone"           value={e.personalPhone} />
        <Field label="Employment Type" value={EMPLOYMENT_TYPES.find((t) => t.value === e.employmentType)?.label} />
      </div>
    </Card>
  );
}

function PrivateInfoTab({ e }) {
  return (
    <Card className="p-6">
      <h2 className="text-base font-semibold">Personal Details</h2>
      <div className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-3">
        <Field label="Date of Birth"  value={fmtDate(e.dob)} />
        <Field label="Gender"         value={e.gender} />
        <Field label="Personal Email" value={e.personalEmail} />
      </div>
    </Card>
  );
}

function SalaryInfoTab({ e }) {
  if (!e.basicSalary && e.basicSalary !== 0) {
    return (
      <Card className="p-6">
        <p className="text-sm text-ink-muted">No salary structure on file for this user.</p>
      </Card>
    );
  }
  const basic = Number(e.basicSalary) || 0;
  const hra = Number(e.hra) || 0;
  const conv = Number(e.conveyance) || 0;
  const spec = Number(e.specialAllowance) || 0;
  const other = Number(e.otherAllowance) || 0;
  const gross = basic + hra + conv + spec + other;
  const pfAmt = e.pfEnabled ? Math.round(basic * (Number(e.pfPercent) || 12) / 100) : 0;
  const pt = Number(e.professionalTax) || 0;
  const net = gross - pfAmt - pt;
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
          <Field label="Basic Salary"      value={formatINR(basic)} />
          <Field label="HRA"               value={formatINR(hra)} />
          <Field label="Conveyance"        value={formatINR(conv)} />
          <Field label="Special Allowance" value={formatINR(spec)} />
          <Field label="Other Allowances"  value={formatINR(other)} />
          <Field label="PF"                value={e.pfEnabled ? `${e.pfPercent || 12}% (${formatINR(pfAmt)})` : 'Not applicable'} />
          <Field label="Professional Tax"  value={formatINR(pt)} />
        </div>
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <SummaryTile label="Gross"      value={formatINR(gross)} />
          <SummaryTile label="Deductions" value={formatINR(pfAmt + pt)} tone="danger" />
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

function SettingsTab({ e }) {
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async () => {
    if (!window.confirm(`Are you sure you want to reset the password for ${e.firstName}? An email will be sent with the new temporary password.`)) return;
    setLoading(true);
    try {
      await usersService.resetPassword(e.id);
      alert('Password reset successful. New credentials have been emailed to the user.');
    } catch (err) {
      alert(err.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <h2 className="text-base font-semibold">Account Actions</h2>
      <p className="mt-1 text-sm text-ink-muted">Perform reset / deactivate / delete actions.</p>
      <div className="mt-5 flex flex-wrap gap-3">
        <Button variant="outline" loading={loading} onClick={handleResetPassword} leftIcon={<Mail className="h-4 w-4" />}>
          Reset & Re-send credentials
        </Button>
        <Button variant="danger">Deactivate account</Button>
      </div>
    </Card>
  );
}



