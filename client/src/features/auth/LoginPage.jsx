import { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock } from 'lucide-react';
import { Button, Input } from '../ui';
import AuthLayout from '../../app/layouts/AuthLayout';
import { useAuth } from './AuthContext';
import { dashboardPathByRole } from '../../app/navigation';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, login } = useAuth();

  const successMessage = location.state?.message || '';
  const prefillEmail = location.state?.prefillEmail || '';

  const [identifier, setIdentifier] = useState(prefillEmail);
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) navigate(dashboardPathByRole[user.role] || '/', { replace: true });
  }, [user, navigate]);

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const u = await login(identifier, password);
      const from = location.state?.from?.pathname;
      navigate(from || dashboardPathByRole[u.role] || '/', { replace: true });
    } catch (err) {
      setError(err.message || 'Sign-in failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      footer={
        <>
          First time setting up?{' '}
          <Link to="/admin/signup" className="font-medium text-white underline-offset-4 hover:underline">
            Create the first admin
          </Link>
        </>
      }
    >
      <form className="flex flex-col gap-4" onSubmit={onSubmit}>
        {successMessage && (
          <div className="rounded-xl bg-success-50 px-3 py-2 text-sm text-success-700">
            {successMessage}
          </div>
        )}
        <Input
          label="Email or Login ID"
          placeholder="you@company.com or EM2410001"
          leftIcon={<Mail className="h-4 w-4" />}
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          autoComplete="username"
          required
        />
        <Input
          label="Password"
          type="password"
          placeholder="••••••••"
          leftIcon={<Lock className="h-4 w-4" />}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />

        {error && (
          <div className="rounded-xl bg-danger-50 px-3 py-2 text-sm text-danger-700">{error}</div>
        )}

        <Button type="submit" size="lg" loading={submitting} className="mt-2 w-full">
          Sign in
        </Button>
      </form>
    </AuthLayout>
  );
}
