import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { login, fetchMe } from '../../store/authSlice';
import { setCurrentAccount, setCapabilities } from '../../store/accountSlice';
import type { RootState } from '../../store';
import { AUTH } from './authStyles';

export default function Login() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { loading, error: authError } = useSelector((state: RootState) => state.auth);
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const error = authError ?? localError;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    if (!loginId?.trim() || !password) {
      setLocalError('Enter your phone number, username or email and password.');
      return;
    }
    try {
      await dispatch(login({ loginId: loginId.trim(), password })).unwrap();
      const me = await dispatch(fetchMe()).unwrap();
      dispatch(setCurrentAccount({ ...me.account, capabilities: me.capabilities }));
      dispatch(setCapabilities(me.capabilities ?? null));
      navigate('/');
    } catch (err: any) {
      setLocalError(err?.message || err || 'Login failed.');
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
        <h1 className={AUTH.title}>MOxE</h1>
        <p className={AUTH.subtitle}>Log in to continue.</p>

        {error && <div className={`mb-4 ${AUTH.error}`}>{error}</div>}

        <form onSubmit={handleSubmit} className="w-full space-y-2">
          <input
            type="text"
            value={loginId}
            onChange={(e) => setLoginId(e.target.value)}
            placeholder="Phone number, username or email"
            autoComplete="username"
            className={AUTH.input}
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            autoComplete="current-password"
            className={AUTH.input}
          />
          <button type="submit" disabled={loading} className={AUTH.btnPrimary}>
            {loading ? 'Logging in…' : 'Log in'}
          </button>
        </form>

        <div className="w-full mt-4 flex justify-center">
          <Link to="/forgot-password" className={AUTH.link}>Forgot password?</Link>
        </div>

        <div className={`w-full mt-8 pt-6 ${AUTH.divider} flex flex-wrap justify-center gap-1 text-sm`}>
          <span className={AUTH.linkMuted}>Don&apos;t have an account?</span>
          <Link to="/register" className={AUTH.link}>Sign up</Link>
        </div>
      </div>
    </div>
  );
}
