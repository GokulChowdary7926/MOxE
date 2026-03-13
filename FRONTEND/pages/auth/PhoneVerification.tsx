import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { setCredentials } from '../../store/authSlice';
import { AUTH } from './authStyles';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5007/api';

type Step = 'phone' | 'code';

export default function PhoneVerification() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    if (!phoneNumber.trim()) {
      setError('Enter a valid phone number.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/send-verification-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Could not send verification code.');
      }
      setInfo('We sent a 6‑digit code by SMS. It expires in about 10 minutes.');
      setStep('code');
    } catch (err: any) {
      setError(err.message || 'Failed to send code.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    if (!code.trim() || !password.trim() || !username.trim() || !displayName.trim() || !dateOfBirth.trim()) {
      setError('Enter the code, password, username, display name and date of birth.');
      return;
    }
    setLoading(true);
    try {
      const body: any = {
        phoneNumber,
        code,
        password,
        username: username.trim(),
        displayName: displayName.trim(),
        dateOfBirth: dateOfBirth.trim(),
      };
      const res = await fetch(`${API_BASE}/auth/verify-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Code verification failed.');
      }
      if (data.token) {
        localStorage.setItem('token', data.token);
        dispatch(
          setCredentials({
            user: data.user ?? { id: data.userId },
            token: data.token,
          }),
        );
      }
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Could not verify code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center px-6 py-8 ${AUTH.bg} safe-area-pt safe-area-pb`}>
      <div className={AUTH.container}>
        <div className={AUTH.logoWrapper}>
          <div className={AUTH.logoBox}>
            <span className={AUTH.logoLetter}>m</span>
          </div>
        </div>
        <h1 className={AUTH.title}>
          {step === 'phone' ? 'Sign up with your phone' : 'Enter confirmation code'}
        </h1>
        <p className={AUTH.subtitle}>
          {step === 'phone'
            ? 'Enter your phone number and we\'ll send you a code to sign up.'
            : `Enter the code we sent to ${phoneNumber}.`}
        </p>

        {error && <div className={`mb-4 ${AUTH.error}`}>{error}</div>}
        {info && <div className={`mb-4 ${AUTH.info}`}>{info}</div>}

        {step === 'phone' && (
          <form onSubmit={handleSendCode} className="w-full space-y-3">
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="Phone number"
              autoComplete="tel"
              className={AUTH.input}
            />
            <button type="submit" disabled={loading} className={AUTH.btnPrimary}>
              {loading ? 'Sending…' : 'Next'}
            </button>
            <div className={`w-full mt-6 pt-6 ${AUTH.divider} flex flex-wrap justify-center gap-1 text-sm`}>
              <span className={AUTH.linkMuted}>Have an account?</span>
              <Link to="/login" className={AUTH.link}>Log in</Link>
            </div>
          </form>
        )}

        {step === 'code' && (
          <form onSubmit={handleVerifyAndCreate} className="w-full space-y-3">
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              placeholder="Confirmation code"
              className={AUTH.input}
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              autoComplete="new-password"
              className={AUTH.input}
            />
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              className={AUTH.input}
            />
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Full name"
              className={AUTH.input}
            />
            <input
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              className={AUTH.input}
            />
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setStep('phone')}
                className={AUTH.btnSecondary}
              >
                Back
              </button>
              <button type="submit" disabled={loading} className={`flex-1 ${AUTH.btnPrimary}`}>
                {loading ? 'Creating…' : 'Sign up'}
              </button>
            </div>
            <div className={`w-full mt-6 pt-6 ${AUTH.divider} flex flex-wrap justify-center gap-1 text-sm`}>
              <span className={AUTH.linkMuted}>Have an account?</span>
              <Link to="/login" className={AUTH.link}>Log in</Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
