import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Briefcase, Building2, ShieldCheck } from 'lucide-react';
import { Avatar, Card, Tabs, Button } from '../../../features/ui';
import { EMPLOYMENT_TYPES } from '../../../features/employees/employeeMocks';
import hrService from '../hrService';

const formatINR = (n) => '₹' + Number(n || 0).toLocaleString('en-IN');
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString() : '—');

export default function HREmployeeProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [active, setActive] = useState('resume');

  useEffect(() => {
    let active_request = true;
    setLoading(true);
    hrService
      .getEmployee(id)
      .then((data) => {
        if (active_request) setEmployee(data);
      })
      .catch((e) => {
        if (active_request) setError(e.message || 'Failed to load profile');
      })
      .finally(() => {
        if (active_request) setLoading(false);
      });
    return () => {
      active_request = false;
    };
  }, [id]);

  const tabs = [
    { key: 'resume', label: 'Resume' },
    { key: 'private', label: 'Private Info' },
    { key: 'salary', label: 'Salary Info' },
  ];

  const roleLabel = employee?.role?.replace('_', ' ') || 'Employee';
  const empType = EMPLOYMENT_TYPES.find((t) => t.value === employee?.employmentType)?.label;

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center px-8 py-20 text-ink-muted">
        Loading…
      </div>
    );
  }

  if (error || !employee) {
    return (
      <div className="flex h-full items-center justify-center px-8 py-20 text-center">
        <div>
          <h2 className="text-lg font-semibold">{error || 'Employee not found'}</h2>
          <Button variant="outline" className="mt-4" onClick={() => navigate('/hr/employees')}>
            Back to directory
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-8 py-8 max-w-4xl mx-auto space-y-6">
      {/* Back button */}
      <button
        onClick={() => navigate('/hr/employees')}
        className="flex items-center gap-1 text-sm font-bold text-ink-600 hover:text-ink-900 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      {/* Header */}
      <Card className="p-6">
        <div className="flex items-start gap-4">
          <Avatar
            name={`${employee.firstName} ${employee.lastName}`}
            className="h-16 w-16 text-2xl"
          />
          <div className="flex-1 min-w-[200px]">
            <h1 className="text-2xl font-semibold tracking-tight">
              {employee.firstName} {employee.lastName}
            </h1>
            <p className="mt-1 text-sm text-ink-muted">
              {employee.position || '—'}
              {employee.department ? ` · ${employee.department}` : ''}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Pill icon={Briefcase}>{roleLabel}</Pill>
              {empType && <Pill icon={Building2}>{empType}</Pill>}
              {employee.employeeId && <Pill icon={ShieldCheck}>{employee.employeeId}</Pill>}
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
        {active === 'salary' && <SalaryInfoTab e={employee} />}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────

function Pill({ icon: Icon, children }) {
  return (
    <div className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
      {Icon && <Icon className="h-3.5 w-3.5" />}
      {children}
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-widest text-ink-400">{label}</p>
      <p className="mt-1 text-sm font-medium text-ink-900">{value || '—'}</p>
    </div>
  );
}

function ResumeTab({ e }) {
  return (
    <Card className="p-6">
      <h2 className="text-base font-semibold">About</h2>
      <div className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-3">
        <Field label="Designation" value={e.position} />
        <Field label="Department" value={e.department} />
        <Field label="Date of Joining" value={fmtDate(e.joinDate)} />
        <Field label="Work Email" value={e.email} />
        <Field label="Phone" value={e.personalPhone} />
        <Field
          label="Employment Type"
          value={EMPLOYMENT_TYPES.find((t) => t.value === e.employmentType)?.label}
        />
      </div>
    </Card>
  );
}

function PrivateInfoTab({ e }) {
  return (
    <Card className="p-6">
      <h2 className="text-base font-semibold">Personal Details</h2>
      <div className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-3">
        <Field label="Date of Birth" value={fmtDate(e.dob)} />
        <Field label="Gender" value={e.gender} />
        <Field label="Personal Email" value={e.personalEmail} />
      </div>
    </Card>
  );
}

function SalaryInfoTab({ e }) {
  if (!e.basicSalary && e.basicSalary !== 0) {
    return (
      <Card className="p-6">
        <p className="text-sm text-ink-muted">No salary structure on file for this employee.</p>
      </Card>
    );
  }

  const basic = Number(e.basicSalary) || 0;
  const hra = Number(e.hra) || 0;
  const conv = Number(e.conveyance) || 0;
  const spec = Number(e.specialAllowance) || 0;
  const other = Number(e.otherAllowance) || 0;
  const gross = basic + hra + conv + spec + other;
  const pfAmt = e.pfEnabled ? Math.round((basic * (Number(e.pfPercent) || 12)) / 100) : 0;
  const pt = Number(e.professionalTax) || 0;
  const net = gross - pfAmt - pt;

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Salary Structure</h2>
          <span className="rounded-full bg-warning-50 px-2.5 py-1 text-[11px] text-warning-500 font-semibold">
            Confidential — HR / Payroll Officer
          </span>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-3">
          <Field label="Basic Salary" value={formatINR(basic)} />
          <Field label="HRA" value={formatINR(hra)} />
          <Field label="Conveyance" value={formatINR(conv)} />
          <Field label="Special Allowance" value={formatINR(spec)} />
          <Field label="Other Allowances" value={formatINR(other)} />
          <Field
            label="PF"
            value={e.pfEnabled ? `${e.pfPercent || 12}% (${formatINR(pfAmt)})` : 'Not applicable'}
          />
          <Field label="Professional Tax" value={formatINR(pt)} />
        </div>
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <SummaryTile label="Gross" value={formatINR(gross)} />
          <SummaryTile label="Deductions" value={formatINR(pfAmt + pt)} tone="danger" />
          <SummaryTile label="Net" value={formatINR(net)} tone="success" />
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-base font-semibold">Bank Details</h2>
        <div className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-2">
          <Field label="Bank Name" value={e.bankName} />
          <Field label="Branch" value={e.bankBranch} />
          <Field label="Account Number" value={e.bankAccountNo} />
          <Field label="IFSC Code" value={e.bankIfsc} />
        </div>
      </Card>
    </div>
  );
}

function SummaryTile({ label, value, tone }) {
  const toneClass =
    {
      danger: 'bg-danger-50 text-danger-700',
      success: 'bg-success-50 text-success-700',
      default: 'bg-primary-50 text-primary-700',
    }[tone] || 'bg-primary-50 text-primary-700';

  return (
    <div className={`rounded-lg ${toneClass} p-4 text-center`}>
      <p className="text-xs font-semibold uppercase tracking-widest">{label}</p>
      <p className="mt-2 text-xl font-bold">{value}</p>
    </div>
  );
}
