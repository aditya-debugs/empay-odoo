import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User as UserIcon, Building2, Phone } from 'lucide-react';
import { Button, Input } from '../../../features/ui';
import AuthLayout from '../../../app/layouts/AuthLayout';
import authService from '../../../features/auth/authService';
// Note: SignupPage intentionally does not auto-login —
// after creating the admin we redirect to /login per the demo flow.

export default function SignupPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    companyName: '',
    name: '',
    email: '',
    phone: '',
    password: '',
    confirm: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(true);

  // Lock signup if an admin already exists.
  useEffect(() => {
    authService
      .adminExists()
      .then(({ exists }) => {
        if (exists) navigate('/login', { replace: true });
      })
      .finally(() => setChecking(false));
  }, [navigate]);

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) return setError('Passwords do not match');
    if (form.password.length < 8)       return setError('Password must be at least 8 characters');
    setSubmitting(true);
    try {
      // Create the admin (does NOT auto-login — user signs in next)
      await authService.registerAdmin({
        companyName: form.companyName,
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password,
      });
      navigate('/login', {
        replace: true,
        state: {
          message: 'Admin account created. Please sign in to continue.',
          prefillEmail: form.email,
        },
      });
    } catch (err) {
      setError(err.message || 'Signup failed');
    } finally {
      setSubmitting(false);
    }
  }

  if (checking) return null;

  return (
    <AuthLayout
      title="Set up your workspace"
      subtitle="Create the first admin account for your company"
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-white underline-offset-4 hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form className="flex flex-col gap-4" onSubmit={onSubmit}>
        <Input
          label="Company name"
          placeholder="Acme Inc."
          leftIcon={<Building2 className="h-4 w-4" />}
          value={form.companyName}
          onChange={update('companyName')}
          required
        />
        <Input
          label="Your full name"
          placeholder="Kennedy Jones"
          leftIcon={<UserIcon className="h-4 w-4" />}
          value={form.name}
          onChange={update('name')}
          required
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Work email"
            type="email"
            placeholder="admin@company.com"
            leftIcon={<Mail className="h-4 w-4" />}
            value={form.email}
            onChange={update('email')}
            required
          />
          <Input
            label="Phone"
            type="tel"
            placeholder="+1 555 0100"
            leftIcon={<Phone className="h-4 w-4" />}
            value={form.phone}
            onChange={update('phone')}
            required
          />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Password"
            type="password"
            placeholder="Min. 8 characters"
            leftIcon={<Lock className="h-4 w-4" />}
            value={form.password}
            onChange={update('password')}
            required
          />
          <Input
            label="Confirm password"
            type="password"
            leftIcon={<Lock className="h-4 w-4" />}
            value={form.confirm}
            onChange={update('confirm')}
            required
          />
        </div>

        {error && (
          <div className="rounded-xl bg-danger-50 px-3 py-2 text-sm text-danger-700">{error}</div>
        )}

        <Button type="submit" size="lg" loading={submitting} className="mt-2 w-full">
          Create admin account
        </Button>

        <p className="text-center text-xs text-ink-soft">
          You'll be the first administrator. Future Admin/HR/Payroll/Employee accounts are created from inside the app.
        </p>
      </form>
    </AuthLayout>
  );
}
