import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, User as UserIcon, Mail, Phone, Calendar,
  Building2, Briefcase, IndianRupee, Landmark, ShieldCheck,
} from 'lucide-react';
import { Card, Input, Button } from '../../../features/ui';
import { useAuth } from '../../../features/auth/AuthContext';
import {
  DEPARTMENTS, ALL_ROLES, EMPLOYEE_ONLY_ROLE, EMPLOYMENT_TYPES,
  previewLoginId,
} from '../../../features/employees/employeeMocks';
import usersService from '../../../services/usersService';

function Section({ title, icon: Icon, children }) {
  return (
    <Card className="p-6">
      <div className="flex items-center gap-2.5 border-b border-border pb-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-100 text-brand-700">
          <Icon className="h-4 w-4" />
        </div>
        <h2 className="text-base font-semibold">{title}</h2>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">{children}</div>
    </Card>
  );
}

function Select({ label, value, onChange, options, required }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-ink">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="h-11 rounded-xl border border-border-strong bg-white px-3.5 text-sm text-ink focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-400/30"
      >
        <option value="" disabled>Select…</option>
        {options.map((o) => (
          <option key={o.value || o} value={o.value || o}>{o.label || o}</option>
        ))}
      </select>
    </div>
  );
}

export default function CreateEmployeePage({ mode = 'employee' }) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const isUserMode = mode === 'user';
  const roleOptions = isUserMode ? ALL_ROLES : EMPLOYEE_ONLY_ROLE;
  const backPath = isUserMode ? '/admin/users' : '/admin/employees';
  const pageTitle = isUserMode ? 'New User' : 'New Employee';
  const pageSubtitle = isUserMode
    ? 'Create a system user with any role. Login ID and temporary password are generated automatically.'
    : 'Create an employee. Login ID and temporary password are generated automatically.';

  const [form, setForm] = useState({
    firstName: '', lastName: '', dob: '', gender: '',
    personalPhone: '', personalEmail: '',
    workEmail: '', department: '', position: '',
    joinDate: new Date().toISOString().slice(0, 10),
    employmentType: 'FULL_TIME', role: 'EMPLOYEE',
    basicSalary: '', hra: '', conveyance: '', specialAllowance: '', otherAllowance: '',
    pfEnabled: true, pfPercent: '12', professionalTax: '200',
    bankName: '', bankBranch: '', bankAccountNo: '', bankIfsc: '',
  });
  const [submitted, setSubmitted] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));
  const setEv = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  // Live preview — serial is filled in by the server, so we show "????".
  const loginIdPreview = useMemo(
    () => previewLoginId({
      companyName: user?.companyName || 'EmPay',
      firstName: form.firstName,
      lastName: form.lastName,
      joinDate: form.joinDate,
    }),
    [user?.companyName, form.firstName, form.lastName, form.joinDate],
  );

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      // Coerce numeric fields from text inputs (loginId + tempPassword are server-generated)
      const payload = {
        ...form,
        basicSalary: Number(form.basicSalary || 0),
        hra: form.hra === '' ? null : Number(form.hra),
        conveyance: form.conveyance === '' ? null : Number(form.conveyance),
        specialAllowance: form.specialAllowance === '' ? null : Number(form.specialAllowance),
        otherAllowance: form.otherAllowance === '' ? null : Number(form.otherAllowance),
        pfPercent: form.pfPercent === '' ? null : Number(form.pfPercent),
        professionalTax: form.professionalTax === '' ? null : Number(form.professionalTax),
      };
      const result = await usersService.create(payload);
      setSubmitted(result);
    } catch (err) {
      const detail = err.data?.errors?.map((x) => `${x.path}: ${x.message}`).join('  •  ');
      setError(detail || err.message || 'Failed to create user');
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="px-8 py-8">
        <Card className="mx-auto max-w-2xl p-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-success-50 text-success-700">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h2 className="mt-4 text-xl font-semibold">{isUserMode ? 'User created' : 'Employee created'}</h2>
          <p className="mt-1 text-sm text-ink-muted">
            Share these credentials with <span className="font-medium text-ink">{submitted.user.email}</span>. They will be required to change the password on first login.
          </p>
          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <CredentialTile label="Login ID" value={submitted.loginId} />
            <CredentialTile label="Temporary Password" value={submitted.tempPassword} />
          </div>
          <div className="mt-6 flex justify-center gap-3">
            <Button variant="outline" onClick={() => navigate(backPath)}>
              {isUserMode ? 'Back to users' : 'Back to directory'}
            </Button>
            <Button onClick={() => { setSubmitted(null); setForm((f) => ({ ...f, firstName: '', lastName: '', workEmail: '', personalEmail: '' })); }}>
              Create another
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="px-8 py-8">
      <button
        type="button"
        onClick={() => navigate(backPath)}
        className="inline-flex items-center gap-2 text-sm text-ink-muted hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" />
        {isUserMode ? 'Back to users' : 'Back to directory'}
      </button>

      <div className="mt-3">
        <h1 className="text-2xl font-semibold tracking-tight">{pageTitle}</h1>
        <p className="mt-1 text-sm text-ink-muted">{pageSubtitle}</p>
      </div>

      <form onSubmit={onSubmit} className="mt-6 space-y-5">
        {/* Login ID format preview */}
        <Card className="border-brand-300 bg-brand-50 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-xs uppercase tracking-wider text-brand-700">Login ID format</div>
              <div className="mt-1 font-mono text-lg font-semibold text-ink">{loginIdPreview}</div>
              <div className="mt-1 text-xs text-ink-muted">
                <span className="font-mono">[Company][First-2][Last-2][Year][Serial]</span> — final serial assigned on save.
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs uppercase tracking-wider text-brand-700">Temporary password</div>
              <div className="mt-1 font-mono text-lg font-semibold text-ink">Generated on save</div>
              <div className="mt-1 text-xs text-ink-muted">Forced reset on first login.</div>
            </div>
          </div>
        </Card>

        <Section title="Personal Information" icon={UserIcon}>
          <div className="md:col-span-2 flex flex-col gap-1.5 border-b border-ink-100 pb-4 mb-2">
            <label className="text-sm font-medium text-ink">Profile Picture (Avatar)</label>
            <div className="flex items-center gap-4">
              {form.avatarUrl ? (
                <img src={import.meta.env.VITE_API_URL.replace('/api/v1', '') + form.avatarUrl} alt="Avatar" className="h-16 w-16 rounded-full object-cover" />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-surface-muted text-ink-muted">
                  <UserIcon className="h-8 w-8" />
                </div>
              )}
              <div className="flex flex-col gap-2">
                <input 
                  type="file" 
                  accept="image/*" 
                  className="text-sm text-ink-soft file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const formData = new FormData();
                    formData.append('avatar', file);
                    try {
                      const res = await fetch(`${import.meta.env.VITE_API_URL}/upload/avatar`, {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
                        body: formData
                      });
                      const data = await res.json();
                      if (data.url) setForm(f => ({ ...f, avatarUrl: data.url }));
                    } catch (err) {
                      console.error("Upload failed", err);
                      alert("Upload failed");
                    }
                  }}
                />
              </div>
            </div>
          </div>
          <Input label="First Name"     value={form.firstName}     onChange={setEv('firstName')}     required />
          <Input label="Last Name"      value={form.lastName}      onChange={setEv('lastName')}      required />
          <Input label="Date of Birth"  type="date" value={form.dob} onChange={setEv('dob')} />
          <Select label="Gender" value={form.gender} onChange={set('gender')}
            options={[
              { value: 'MALE', label: 'Male' },
              { value: 'FEMALE', label: 'Female' },
              { value: 'OTHER', label: 'Other' },
              { value: 'PREFER_NOT_TO_SAY', label: 'Prefer not to say' },
            ]} />
          <Input label="Personal Phone" leftIcon={<Phone className="h-4 w-4" />} value={form.personalPhone} onChange={setEv('personalPhone')} />
          <Input label="Personal Email" type="email" leftIcon={<Mail className="h-4 w-4" />} value={form.personalEmail} onChange={setEv('personalEmail')} />
        </Section>

        <Section title="Employment Information" icon={Briefcase}>
          <Input label="Work Email" type="email" leftIcon={<Mail className="h-4 w-4" />} value={form.workEmail} onChange={setEv('workEmail')} required />
          <Select label="Department" value={form.department} onChange={set('department')} options={DEPARTMENTS} required />
          <Input label="Designation / Job Title" leftIcon={<Building2 className="h-4 w-4" />} value={form.position} onChange={setEv('position')} required />
          <Input label="Date of Joining" type="date" leftIcon={<Calendar className="h-4 w-4" />} value={form.joinDate} onChange={setEv('joinDate')} required />
          <Select label="Employment Type" value={form.employmentType} onChange={set('employmentType')} options={EMPLOYMENT_TYPES} required />
          {roleOptions.length > 1 ? (
            <Select label="Role" value={form.role} onChange={set('role')} options={roleOptions} required />
          ) : (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-ink">Role</label>
              <div className="flex h-11 items-center gap-2 rounded-xl border border-border bg-surface-muted px-3.5 text-sm text-ink">
                <ShieldCheck className="h-4 w-4 text-brand-500" />
                <span>{roleOptions[0].label}</span>
                <span className="ml-auto text-xs text-ink-muted">Locked from this tab</span>
              </div>
            </div>
          )}
        </Section>

        <Section title="Salary Information" icon={IndianRupee}>
          <Input label="Basic Salary" type="number" placeholder="₹" value={form.basicSalary} onChange={setEv('basicSalary')} required />
          <Input label="HRA" type="number" hint="Standard: 40% non-metro, 50% metro" value={form.hra} onChange={setEv('hra')} />
          <Input label="Conveyance Allowance" type="number" value={form.conveyance} onChange={setEv('conveyance')} />
          <Input label="Special Allowance" type="number" value={form.specialAllowance} onChange={setEv('specialAllowance')} />
          <Input label="Other Allowances" type="number" value={form.otherAllowance} onChange={setEv('otherAllowance')} />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-ink">PF Settings</label>
            <div className="flex h-11 items-center gap-3 rounded-xl border border-border-strong bg-white px-3.5">
              <label className="inline-flex items-center gap-2 text-sm text-ink">
                <input
                  type="checkbox"
                  checked={form.pfEnabled}
                  onChange={(e) => set('pfEnabled')(e.target.checked)}
                  className="h-4 w-4 rounded border-border-strong accent-brand-500"
                />
                Enable PF
              </label>
              <span className="text-ink-soft">·</span>
              <input
                type="number"
                placeholder="12"
                value={form.pfPercent}
                onChange={setEv('pfPercent')}
                disabled={!form.pfEnabled}
                className="w-16 bg-transparent text-sm focus:outline-none disabled:text-ink-soft"
              />
              <span className="text-sm text-ink-muted">%</span>
            </div>
          </div>
          <Input label="Professional Tax" type="number" value={form.professionalTax} onChange={setEv('professionalTax')} hint="Auto-populates by state once Settings are configured" />
        </Section>

        <Section title="Bank Details" icon={Landmark}>
          <Input label="Bank Name"   value={form.bankName}   onChange={setEv('bankName')} />
          <Input label="Branch"      value={form.bankBranch} onChange={setEv('bankBranch')} />
          <Input label="Account No." value={form.bankAccountNo} onChange={setEv('bankAccountNo')} />
          <Input label="IFSC Code"   value={form.bankIfsc}    onChange={setEv('bankIfsc')} />
        </Section>

        {error && (
          <div className="rounded-xl bg-danger-50 px-3 py-2 text-sm text-danger-700">{error}</div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={() => navigate(backPath)}>Cancel</Button>
          <Button type="submit" loading={submitting}>{isUserMode ? 'Create user' : 'Create employee'}</Button>
        </div>
      </form>
    </div>
  );
}

function CredentialTile({ label, value }) {
  return (
    <div className="rounded-xl border border-border bg-white p-4 text-left">
      <div className="text-xs uppercase tracking-wider text-ink-soft">{label}</div>
      <div className="mt-1 font-mono text-base font-semibold text-ink">{value}</div>
    </div>
  );
}
