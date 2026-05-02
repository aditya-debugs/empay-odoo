import { useEffect, useState } from 'react';
import { Save, Building2, Banknote, Clock } from 'lucide-react';
import { Card, Tabs, Button, Input } from '../../../features/ui';
import api from '../../../services/api';

const STATES = ['MAHARASHTRA', 'KARNATAKA', 'TAMIL_NADU', 'GUJARAT', 'WEST_BENGAL', 'DELHI'];

export default function SettingsPage() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [savedFlash, setSavedFlash] = useState('');
  const [active, setActive] = useState('company');

  useEffect(() => {
    api.get('/settings').catch(() => ({}))
      .then((res) => setSettings(res.settings || res || {}))
      .catch((e) => setError(e.message || 'Failed to load settings'))
      .finally(() => setLoading(false));
  }, []);

  function set(field) {
    return (val) => setSettings((s) => ({ ...s, [field]: val }));
  }
  function setEv(field, asNumber) {
    return (e) => set(field)(asNumber ? Number(e.target.value) : e.target.value);
  }
  function setBool(field) {
    return (e) => set(field)(e.target.checked);
  }

  async function save() {
    if (!settings) return;
    setSaving(true);
    setError('');
    try {
      const updated = await api.put('/settings', settings);
      setSettings(updated.settings || updated);
      setSavedFlash('Settings saved.');
      setTimeout(() => setSavedFlash(''), 2500);
    } catch (e) {
      setError(e.message || 'Could not save settings');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="flex h-full items-center justify-center text-ink-muted">Loading settings…</div>;
  if (!settings) return <div className="flex h-full items-center justify-center text-danger-700">{error || 'No settings'}</div>;

  const tabs = [
    { key: 'company',    label: 'Company' },
    { key: 'statutory',  label: 'Salary & Statutory' },
    { key: 'attendance', label: 'Attendance' },
  ];

  return (
    <div className="px-8 py-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Org-wide configuration. Changes apply immediately to all subsequent payroll calculations.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {savedFlash && <span className="text-sm text-success-700">{savedFlash}</span>}
          <Button leftIcon={<Save className="h-4 w-4" />} loading={saving} onClick={save}>
            Save changes
          </Button>
        </div>
      </div>

      {error && <div className="mt-4 rounded-xl bg-danger-50 px-3 py-2 text-sm text-danger-700">{error}</div>}

      <div className="mt-6">
        <Tabs tabs={tabs} activeKey={active} onChange={setActive} />
      </div>

      <div className="mt-6">
        {active === 'company'    && <CompanyTab    s={settings} setEv={setEv} setBool={setBool} />}
        {active === 'statutory'  && <StatutoryTab  s={settings} setEv={setEv} set={set} setBool={setBool} />}
        {active === 'attendance' && <AttendanceTab s={settings} setEv={setEv} />}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────

function Section({ title, icon: Icon, hint, children }) {
  return (
    <Card className="p-6">
      <div className="flex items-start justify-between gap-2 border-b border-border pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-100 text-brand-700">
            <Icon className="h-4 w-4" />
          </div>
          <h2 className="text-base font-semibold">{title}</h2>
        </div>
        {hint && <p className="max-w-md text-right text-xs text-ink-muted">{hint}</p>}
      </div>
      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">{children}</div>
    </Card>
  );
}

function ToggleRow({ label, value, onChange, hint }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-ink">{label}</label>
      <div className="flex h-11 items-center gap-3 rounded-xl border border-border-strong bg-white px-3.5">
        <input
          type="checkbox"
          checked={!!value}
          onChange={onChange}
          className="h-4 w-4 rounded border-border-strong accent-brand-500"
        />
        <span className="text-sm text-ink-muted">{value ? 'Enabled' : 'Disabled'}</span>
      </div>
      {hint && <span className="text-xs text-ink-soft">{hint}</span>}
    </div>
  );
}

function StateSelect({ value, onChange }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-ink">Professional Tax State</label>
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 rounded-xl border border-border-strong bg-white px-3.5 text-sm text-ink focus:border-brand-500 focus:outline-none"
      >
        {STATES.map((s) => (
          <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
        ))}
      </select>
      <span className="text-xs text-ink-soft">Drives the PT slab applied during payroll.</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Tab content
// ─────────────────────────────────────────────────────────────

function CompanyTab({ s, setEv }) {
  return (
    <div className="space-y-5">
      <Section title="Company Profile" icon={Building2}>
        <Input label="Company Name"    value={s.companyName || ''}    onChange={setEv('companyName')} />
        <Input label="CIN / Reg No."   value={s.cin || ''}            onChange={setEv('cin')} />
        <div className="md:col-span-2">
          <Input label="Registered Address" value={s.companyAddress || ''} onChange={setEv('companyAddress')} />
        </div>
      </Section>

      <Section title="Financial Year & Pay Period" icon={Banknote}
        hint="These drive the pro-rata calculation and the pay-day reminder.">
        <Input label="Financial Year Start Month (1-12)" type="number" value={s.fyStartMonth || ''} onChange={setEv('fyStartMonth', true)} />
        <Input label="Pay Day (day of month)"            type="number" value={s.payDay || ''}       onChange={setEv('payDay', true)} />
        <Input label="Working Days per Month"            type="number" value={s.workingDaysPerMonth || ''} onChange={setEv('workingDaysPerMonth', true)} hint="26 for 6-day week, 22 for 5-day week" />
        <Input label="Working Days per Week"             type="number" value={s.workingDaysPerWeek || ''}  onChange={setEv('workingDaysPerWeek', true)} />
      </Section>
    </div>
  );
}

function StatutoryTab({ s, setEv, set, setBool }) {
  return (
    <div className="space-y-5">
      <Section title="HRA & Allowance Defaults" icon={Banknote}
        hint="Used when an employee profile doesn't have an explicit HRA amount.">
        <ToggleRow label="Metro City" value={s.isMetro} onChange={setBool('isMetro')} hint="Toggle on for Mumbai/Delhi/Chennai/Kolkata → 50% HRA. Off → 40% (non-metro)." />
        <Input label="Metro HRA %"     type="number" value={s.metroHraPercent || ''}    onChange={setEv('metroHraPercent', true)} />
        <Input label="Non-Metro HRA %" type="number" value={s.nonMetroHraPercent || ''} onChange={setEv('nonMetroHraPercent', true)} />
        <Input label="Conveyance Default (₹)" type="number" value={s.conveyanceDefault || ''} onChange={setEv('conveyanceDefault', true)} hint="Standard ₹1,600/month" />
        <Input label="Medical Default (₹)"    type="number" value={s.medicalDefault || ''}    onChange={setEv('medicalDefault', true)} hint="Standard ₹1,250/month" />
      </Section>

      <Section title="Provident Fund (PF)" icon={Banknote}>
        <ToggleRow label="PF Enabled (org-wide)" value={s.pfEnabled} onChange={setBool('pfEnabled')} />
        <Input label="PF Basic Threshold (₹)"   type="number" value={s.pfBasicThreshold || ''}  onChange={setEv('pfBasicThreshold', true)} hint="Statutory wage ceiling — ₹15,000" />
        <Input label="Employee PF %"            type="number" value={s.pfEmployeePercent || ''} onChange={setEv('pfEmployeePercent', true)} />
        <Input label="Employer PF %"            type="number" value={s.pfEmployerPercent || ''} onChange={setEv('pfEmployerPercent', true)} />
      </Section>

      <Section title="ESIC" icon={Banknote}
        hint="ESIC applies only when Gross ≤ threshold (default ₹21,000).">
        <ToggleRow label="ESIC Enabled" value={s.esicEnabled} onChange={setBool('esicEnabled')} />
        <Input label="ESIC Gross Threshold (₹)" type="number" value={s.esicGrossThreshold || ''}  onChange={setEv('esicGrossThreshold', true)} />
        <Input label="Employee ESIC %"          type="number" step="0.01" value={s.esicEmployeePercent || ''} onChange={setEv('esicEmployeePercent', true)} />
        <Input label="Employer ESIC %"          type="number" step="0.01" value={s.esicEmployerPercent || ''} onChange={setEv('esicEmployerPercent', true)} />
      </Section>

      <Section title="Professional Tax" icon={Banknote}>
        <StateSelect value={s.profTaxState} onChange={set('profTaxState')} />
      </Section>
    </div>
  );
}

function AttendanceTab({ s, setEv }) {
  return (
    <div className="space-y-5">
      <Section title="Attendance Policy" icon={Clock}
        hint="Drives Full-day / Half-day / Late detection.">
        <Input label="Full Day Min Hours"        type="number" step="0.5" value={s.fullDayMinHours || ''} onChange={setEv('fullDayMinHours', true)} />
        <Input label="Half Day Min Hours"        type="number" step="0.5" value={s.halfDayMinHours || ''} onChange={setEv('halfDayMinHours', true)} />
        <Input label="Grace Period (minutes)"    type="number" value={s.graceMinutes || ''}        onChange={setEv('graceMinutes', true)} />
        <Input label="Full-day Check-in Before"  value={s.fullDayCheckInBefore || ''} onChange={setEv('fullDayCheckInBefore')} hint="HH:MM (e.g. 10:00)" />
        <Input label="Half-day Check-in Before"  value={s.halfDayCheckInBefore || ''} onChange={setEv('halfDayCheckInBefore')} hint="HH:MM (e.g. 11:00)" />
      </Section>
    </div>
  );
}
