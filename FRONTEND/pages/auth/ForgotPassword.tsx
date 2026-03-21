import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { getApiBase } from '../../services/api';
import { AUTH } from './authStyles';

export default function ForgotPassword() {
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!emailOrPhone.trim()) {
      setError('Enter your email or phone number.');
      return;
    }
    setLoading(true);
    try {
      const base = getApiBase();
      const res = await fetch(`${base}/auth/password/reset-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailOrPhone: emailOrPhone.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setSent(true);
        return;
      }
      const msg = data?.error || (res.status === 501 ? 'Password reset is not available yet.' : 'Something went wrong. Try again.');
      setError(msg);
      if (res.status === 429) setError(data?.error || 'Too many attempts. Try again later.');
    } catch {
      setError('Cannot reach server. Check that the backend is running and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center px-6 py-8 ${AUTH.bg} safe-area-pt safe-area-pb`}>
      <div className={AUTH.container}>
        <div className={AUTH.logoWrapper}>
          <img src="/logo.png" alt="MOxE" className="w-14 h-14 rounded-xl object-cover" />
        </div>

        <div className={AUTH.card}>
          <h1 className={AUTH.title}>Forgot password?</h1>
          <p className={AUTH.subtitle}>
            Enter your email or phone and we&apos;ll send you a link to get back into your account.
          </p>
          {error && <div className={`mb-4 ${AUTH.error}`}>{error}</div>}
          {sent && <div className={`mb-4 ${AUTH.info}`}>Check your email or messages for a link to reset your password.</div>}
          {!sent ? (
            <form onSubmit={handleSubmit} className="w-full space-y-3">
              <input
                type="text"
                value={emailOrPhone}
                onChange={(e) => setEmailOrPhone(e.target.value)}
                placeholder="Email or phone number"
                autoComplete="username"
                className={AUTH.input}
              />
              <button type="submit" disabled={loading} className={AUTH.btnPrimary}>
                {loading ? 'Sending…' : 'Send login link'}
              </button>
            </form>
          ) : (
            <Link to="/login" className={`block text-center ${AUTH.link}`}>Back to Log in</Link>
          )}
        </div>

        <div className={AUTH.footerCard}>
          <p className={`${AUTH.footerText} text-center`}>
            <Link to="/login" className={AUTH.link}>Back to Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
