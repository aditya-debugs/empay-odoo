import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User as UserIcon } from 'lucide-react';
import { Button, Input } from '../../../features/ui';
import AuthLayout from '../../../app/layouts/AuthLayout';
import { useAuth } from '../../../features/auth/AuthContext';
import authService from '../../../features/auth/authService';

export default function SignupPage() {
  const navigate = useNavigate();
  const { registerAdmin } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(true);

  // Lock signup if any admin already exists.
  useEffect(() => {
    authService
      .adminExists()
      .then(({ exists }) => {
        if (exists) navigate('/login', { replace: true });
      })
      .finally(() => setChecking(false));
  }, [navigate]);

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    setSubmitting(true);
    try {
      await registerAdmin({ name, email, password });
      navigate('/admin/dashboard', { replace: true });
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
      subtitle="Create the first admin account for EmPay"
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
          label="Full name"
          placeholder="Kennedy Jones"
          leftIcon={<UserIcon className="h-4 w-4" />}
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <Input
          label="Work email"
          type="email"
          placeholder="admin@company.com"
          leftIcon={<Mail className="h-4 w-4" />}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          label="Password"
          type="password"
          placeholder="Min. 8 characters"
          leftIcon={<Lock className="h-4 w-4" />}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <Input
          label="Confirm password"
          type="password"
          leftIcon={<Lock className="h-4 w-4" />}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
        />

        {error && (
          <div className="rounded-xl bg-danger-50 px-3 py-2 text-sm text-danger-700">{error}</div>
        )}

        <Button type="submit" size="lg" loading={submitting} className="mt-2 w-full">
          Create admin account
        </Button>
      </form>
    </AuthLayout>
  );
}
