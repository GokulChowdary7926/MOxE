import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import type { AppDispatch } from '../../store';
import { login, fetchMe, clearError, logout } from '../../store/authSlice';
import { setCurrentAccount, setCapabilities } from '../../store/accountSlice';
import type { RootState } from '../../store';
import { getApiBase } from '../../services/api';
import { AUTH } from './authStyles';

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const dispatch = useDispatch<AppDispatch>();
  const { loading, error: authError } = useSelector((state: RootState) => state.auth);
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    dispatch(clearError());
    const urlError = searchParams.get('error');
    if (urlError) {
      setLocalError(decodeURIComponent(urlError));
      window.history.replaceState({}, '', '/login');
    }
  }, [dispatch, searchParams]);

  const error = authError ?? localError;

  const getHomeRouteForAccount = (account: any | null | undefined): string => {
    const type = account?.accountType || account?.account_type || '';
    if (type === 'JOB') return '/job';
    // In future we can branch for BUSINESS / CREATOR, but default = Instagram home.
    return '/';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    dispatch(clearError());
    if (!loginId?.trim() || !password) {
      setLocalError('Enter your phone number, username or email and password.');
      return;
    }
    try {
      await dispatch(login({ loginId: loginId.trim(), password })).unwrap();
      try {
        const me = await dispatch(fetchMe()).unwrap();
        dispatch(setCurrentAccount({ ...me.account, capabilities: me.capabilities }));
        dispatch(setCapabilities(me.capabilities ?? null));
        navigate(getHomeRouteForAccount(me.account));
      } catch (meErr: unknown) {
        const payload = meErr && typeof meErr === 'object' && 'payload' in meErr ? (meErr as { payload: string }).payload : undefined;
        const msg = typeof payload === 'string' ? payload : (meErr && typeof meErr === 'object' && 'message' in meErr ? String((meErr as { message: string }).message) : '');
        dispatch(logout());
        if (typeof localStorage !== 'undefined') localStorage.removeItem('token');
        setLocalError(msg || 'Logged in but could not load your account. Please try again.');
      }
    } catch (err: unknown) {
      const payload = err && typeof err === 'object' && 'payload' in err ? (err as { payload: string }).payload : undefined;
      const msg = typeof payload === 'string' ? payload : (err && typeof err === 'object' && 'message' in err ? String((err as { message: string }).message) : '');
      setLocalError(msg || 'Invalid username or password. Please try again.');
    }
  };

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center px-6 py-8 ${AUTH.bg} safe-area-pt safe-area-pb`}>
      <div className={AUTH.container}>
        {/* Logo */}
        <div className={AUTH.logoWrapper}>
          <img src="/logo.png" alt="MOxE" className="w-14 h-14 rounded-xl object-cover" />
        </div>

        {/* Login card */}
        <div className={AUTH.card}>
          <form onSubmit={handleSubmit} className="w-full space-y-3">
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
            {error && <div className={AUTH.error}>{error}</div>}
            <button type="submit" disabled={loading} className={AUTH.btnPrimary}>
              {loading ? 'Logging in…' : 'Log in'}
            </button>
          </form>

          <div className={AUTH.divider}>
            <span className={AUTH.dividerLine} />
            <span className={AUTH.dividerText}>Or</span>
            <span className={AUTH.dividerLine} />
          </div>

          <div className="flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={async () => {
                try {
                  const base = getApiBase();
                  const res = await fetch(`${base}/auth/google/url`);
                  const data = await res.json().catch(() => ({}));
                  if (res.ok && data?.url) {
                    window.location.href = data.url;
                  } else {
                    toast.error(data?.error || 'Google sign-in will be available soon.');
                  }
                } catch {
                  toast.error('Google sign-in will be available soon.');
                }
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-[#dbdbdb] bg-white text-[#262626] text-sm font-medium hover:bg-[#fafafa]"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Log in with Google
            </button>
            <Link to="/forgot-password" className={AUTH.link}>Forgot password?</Link>
          </div>
        </div>

        {/* Sign up prompt */}
        <div className={AUTH.footerCard}>
          <p className={`${AUTH.footerText} text-center`}>
            Don&apos;t have an account? <Link to="/register" className={AUTH.link}>Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
