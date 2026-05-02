import { useEffect, useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import AuthLayout from '../../../app/layouts/AuthLayout';
import { Button } from '../../../features/ui';
import api from '../../../services/api';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('No verification token provided.');
      return;
    }

    let isMounted = true;
    api.get(`/auth/verify-email?token=${token}`)
      .then(() => {
        if (isMounted) setStatus('success');
      })
      .catch((err) => {
        if (isMounted) {
          setStatus('error');
          setMessage(err.message || 'Verification failed. Link might be expired.');
        }
      });

    return () => { isMounted = false; };
  }, [token]);

  return (
    <AuthLayout
      title="Email Verification"
      subtitle="Activating your EmPay admin account"
    >
      <div className="flex flex-col items-center justify-center py-8 text-center">
        {status === 'verifying' && (
          <>
            <Loader2 className="h-12 w-12 animate-spin text-brand-500 mb-4" />
            <p className="text-ink-muted">Please wait while we verify your email address...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="h-16 w-16 text-success-500 mb-4" />
            <h2 className="text-xl font-bold text-ink-900 mb-2">Email Verified!</h2>
            <p className="text-ink-muted mb-6">Your account is now active. You can sign in to continue.</p>
            <Button onClick={() => navigate('/login')} className="w-full">
              Proceed to Login
            </Button>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="h-16 w-16 text-danger-500 mb-4" />
            <h2 className="text-xl font-bold text-ink-900 mb-2">Verification Failed</h2>
            <p className="text-danger-600 mb-6">{message}</p>
            <Button variant="outline" onClick={() => navigate('/login')} className="w-full">
              Go to Login
            </Button>
          </>
        )}
      </div>
    </AuthLayout>
  );
}
