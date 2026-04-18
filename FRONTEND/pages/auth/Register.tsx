import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { User, Store, Star, Briefcase } from 'lucide-react';
import type { AppDispatch } from '../../store';
import { register, fetchMe } from '../../store/authSlice';
import { setCurrentAccount } from '../../store/accountSlice';
import { ACCOUNT_TYPES, ACCOUNT_TYPE_LABELS } from '../../constants/accountTypes';
import { getHomeRouteForAccountType } from '../../constants/accountTypes';
import { validateDisplayNameClient, validateUsernameClient } from '../../utils/usernameValidation';
import { AUTH } from './authStyles';

const ACCOUNT_CARDS: Array<{
  type: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  borderClass: string;
  bgClass: string;
  hoverClass: string;
}> = [
  {
    type: 'PERSONAL',
    label: 'Personal',
    description: 'Social, friends & lifestyle.',
    icon: <User className="w-8 h-8" strokeWidth={1.5} />,
    borderClass: 'border-blue-500/60',
    bgClass: 'bg-blue-500/10',
    hoverClass: 'hover:border-blue-400 hover:bg-blue-500/20',
  },
  {
    type: 'BUSINESS',
    label: 'Business',
    description: 'Sell products, ads & shop.',
    icon: <Store className="w-8 h-8" strokeWidth={1.5} />,
    borderClass: 'border-emerald-500/60',
    bgClass: 'bg-emerald-500/10',
    hoverClass: 'hover:border-emerald-400 hover:bg-emerald-500/20',
  },
  {
    type: 'CREATOR',
    label: 'Creator',
    description: 'Build audience & monetize.',
    icon: <Star className="w-8 h-8" strokeWidth={1.5} />,
    borderClass: 'border-amber-500/60',
    bgClass: 'bg-amber-500/10',
    hoverClass: 'hover:border-amber-400 hover:bg-amber-500/20',
  },
  {
    type: 'JOB',
    label: 'MOxE Job',
    description: 'Professional + social hybrid.',
    icon: <Briefcase className="w-8 h-8" strokeWidth={1.5} />,
    borderClass: 'border-violet-500/60',
    bgClass: 'bg-violet-500/10',
    hoverClass: 'hover:border-violet-400 hover:bg-violet-500/20',
  },
];

const ICON_COLORS: Record<string, string> = {
  PERSONAL: 'text-blue-400',
  BUSINESS: 'text-emerald-400',
  CREATOR: 'text-amber-400',
  JOB: 'text-violet-400',
};

/** Create Account: step 1 = account type cards (match design); step 2 = username, display name, password. */
export default function Register() {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const [step, setStep] = useState<1 | 2>(1);
  const [accountType, setAccountType] = useState<string>('PERSONAL');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const uCheck = validateUsernameClient(username);
    if (!uCheck.ok) {
      setError(uCheck.message);
      return;
    }
    const u = uCheck.normalized;
    const dCheck = validateDisplayNameClient(displayName);
    if (!dCheck.ok) {
      setError(dCheck.message);
      return;
    }
    const d = dCheck.normalized;
    if (!password) {
      setError('Enter a password.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    try {
      await dispatch(register({ username: u, displayName: d, password, accountType })).unwrap();
      const me = await dispatch(fetchMe()).unwrap();
      dispatch(setCurrentAccount({ ...me.account, capabilities: me.capabilities }));
      navigate(getHomeRouteForAccountType(accountType));
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'payload' in err ? String((err as { payload: string }).payload) : (err instanceof Error ? err.message : 'Sign up failed.');
      setError(msg || 'Sign up failed. Try a different username.');
    } finally {
      setLoading(false);
    }
  };

  if (step === 1) {
  return (
      <div className={`min-h-screen flex flex-col items-center px-6 py-10 ${AUTH.bg} safe-area-pt safe-area-pb`} style={{ background: 'var(--moxe-bg, #0a0a0a)' }}>
        <div className="w-full max-w-[380px] flex flex-col items-center">
          <div className="mb-8 flex flex-col items-center">
            <img src="/logo.png" alt="MOxE" className="w-14 h-14 rounded-xl object-cover mb-2" />
            <span className="text-xl font-semibold text-[var(--moxe-text)]">MOxE</span>
          </div>

          <h1 className="text-2xl font-semibold text-center text-[var(--moxe-text)] mb-1">Create Account</h1>
          <p className="text-sm text-center text-[var(--moxe-text-secondary)] mb-8">Choose your account type to get started.</p>

          <div className="w-full grid grid-cols-2 gap-3 mb-10">
            {ACCOUNT_CARDS.map((card) => (
                <button
                key={card.type}
                  type="button"
                  onClick={() => {
                  setAccountType(card.type);
                  setStep(2);
                }}
                className={`flex flex-col items-center justify-center p-5 rounded-xl border-2 bg-[var(--moxe-card)] text-left transition-colors ${card.borderClass} ${card.bgClass} ${card.hoverClass}`}
              >
                <span className={`mb-3 ${ICON_COLORS[card.type]}`}>{card.icon}</span>
                <span className="font-semibold text-sm text-[var(--moxe-text)]">{card.label}</span>
                <span className="text-xs text-[var(--moxe-text-secondary)] mt-1 text-center">{card.description}</span>
                </button>
              ))}
            </div>

          <p className="text-sm text-center text-[var(--moxe-text-secondary)] mb-2">
            Already have an account? <Link to="/login" className="text-violet-400 font-semibold hover:underline">Sign in</Link>
          </p>
          <p className="text-xs text-center text-[var(--moxe-text-secondary)] opacity-80">
            By continuing, you agree to our Terms & Privacy Policy.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center px-6 py-8 ${AUTH.bg} safe-area-pt safe-area-pb`} style={{ background: 'var(--moxe-bg, #0a0a0a)' }}>
      <div className={AUTH.container}>
        <div className={AUTH.logoWrapper}>
          <img src="/logo.png" alt="MOxE" className="w-14 h-14 rounded-xl object-cover" />
        </div>

        <div className={AUTH.card}>
          <p className="text-[var(--moxe-text-secondary)] text-sm text-center mb-2">
            Creating <span className="font-medium text-[var(--moxe-text)]">{ACCOUNT_TYPE_LABELS[accountType as keyof typeof ACCOUNT_TYPE_LABELS]}</span> account
          </p>
            <button
              type="button"
            onClick={() => setStep(1)}
            className="text-xs text-[var(--moxe-text-secondary)] hover:text-[var(--moxe-text)] mb-4"
            >
              ← Change account type
            </button>

          <form onSubmit={handleSubmit} className="w-full space-y-3">
              <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9._]/g, ''))}
              placeholder="Username (a-z, 0-9, ., _)"
              autoComplete="username"
              className={AUTH.input}
              maxLength={30}
            />
              <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Display name"
              autoComplete="name"
              className={AUTH.input}
              maxLength={64}
            />
                  <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password (min 6 characters)"
              autoComplete="new-password"
              className={AUTH.input}
            />
            {error && <div className={AUTH.error}>{error}</div>}
            <button type="submit" disabled={loading} className={AUTH.btnPrimary}>
              {loading ? 'Creating account…' : 'Create account'}
              </button>
          </form>
        </div>

        <div className={AUTH.footerCard}>
          <p className={`${AUTH.footerText} text-center`}>
            Already have an account? <Link to="/login" className="text-violet-400 font-semibold">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
