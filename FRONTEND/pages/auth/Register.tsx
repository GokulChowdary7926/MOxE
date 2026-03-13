import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setCurrentAccount, setCapabilities } from '../../store/accountSlice';
import { ACCOUNT_TYPES, ACCOUNT_TYPE_LABELS } from '../../constants/accountTypes';
import { AUTH } from './authStyles';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5007/api';

export default function Register() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [step, setStep] = useState<'type' | 'form'>('type');
  const [accountType, setAccountType] = useState<string>('PERSONAL');
  const [form, setForm] = useState({
    username: '',
    displayName: '',
    bio: '',
    email: '',
    phoneNumber: '',
    password: '',
    // Personal
    pronouns: '',
    website: '',
    // Business
    businessCategory: '',
    contactEmail: '',
    contactPhone: '',
    contactAddress: '',
    // Creator: same as business for contact
    // Job
    professionalHeadline: '',
    skills: '',
    openToOpportunities: false,
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Please log in first. Use Login to get a token, or implement full auth.');
      setLoading(false);
      return;
    }
    try {
      const body: any = {
        username: form.username,
        displayName: form.displayName,
        accountType,
        bio: form.bio || undefined,
      };
      if (accountType === 'PERSONAL') {
        body.pronouns = form.pronouns || undefined;
        body.website = form.website || undefined;
      }
      if (accountType === 'BUSINESS' || accountType === 'CREATOR') {
        body.businessCategory = form.businessCategory || undefined;
        body.contactEmail = form.contactEmail || undefined;
        body.contactPhone = form.contactPhone || undefined;
        body.contactAddress = form.contactAddress || undefined;
      }
      if (accountType === 'JOB') {
        body.professionalHeadline = form.professionalHeadline || undefined;
        body.skills = form.skills ? form.skills.split(',').map((s) => s.trim()).filter(Boolean) : [];
        body.openToOpportunities = form.openToOpportunities;
      }
      const res = await fetch(`${API_BASE}/accounts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || res.statusText || 'Failed to create account');
      }
      const data = await res.json();
      dispatch(setCurrentAccount({ ...data, capabilities: data.capabilities }));
      dispatch(setCapabilities(data.capabilities));
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Failed');
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
        <h1 className={AUTH.title}>MOxE</h1>
        <p className={AUTH.subtitle}>
          {step === 'type' ? 'Sign up to get started.' : 'Create account.'}
        </p>
        {error && <div className={`mb-4 ${AUTH.error}`}>{error}</div>}
        {step === 'type' && (
          <>
            <p className="text-[#737373] text-sm text-center mb-4">
              Choose your account type. You can add more accounts later.
            </p>
            <div className="w-full grid gap-2">
              {(ACCOUNT_TYPES as unknown as string[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => {
                    setAccountType(type);
                    setStep('form');
                  }}
                  className={`w-full p-4 rounded-lg border text-left active:opacity-90 ${
                    accountType === type
                      ? 'border-[#0095f6] bg-[#0095f6]/10'
                      : 'border-[#363636] bg-[#262626]'
                  }`}
                >
                  <span className="font-semibold text-white text-sm">
                    {ACCOUNT_TYPE_LABELS[type as keyof typeof ACCOUNT_TYPE_LABELS]}
                  </span>
                  <p className="text-[#737373] text-xs mt-1">
                    {type === 'PERSONAL' && 'Feed, posts, stories, DMs. All features free.'}
                    {type === 'BUSINESS' && 'Commerce, live, business hours, analytics.'}
                    {type === 'CREATOR' && 'Live, supporters, badges, gifts, analytics.'}
                    {type === 'JOB' && 'Track, Know, Flow, dual profile, job feed.'}
                  </p>
                </button>
              ))}
            </div>
            <div className={`w-full mt-8 pt-6 ${AUTH.divider} flex flex-wrap justify-center gap-1 text-sm`}>
              <span className={AUTH.linkMuted}>Have an account?</span>
              <Link to="/login" className={AUTH.link}>Log in</Link>
            </div>
          </>
        )}
        {step === 'form' && (
          <form onSubmit={handleCreateAccount} className="w-full space-y-3">
            <button
              type="button"
              onClick={() => setStep('type')}
              className="text-left text-sm text-[#0095f6] font-semibold"
            >
              ← Change account type
            </button>
            <div>
              <label className={AUTH.label}>Username *</label>
              <input
                required
                value={form.username}
                onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                placeholder="Username"
                className={AUTH.inputWithLabel}
              />
            </div>
            <div>
              <label className={AUTH.label}>Display name *</label>
              <input
                required
                value={form.displayName}
                onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
                placeholder="Display name"
                className={AUTH.inputWithLabel}
              />
            </div>
            <div>
              <label className={AUTH.label}>Bio</label>
              <textarea
                value={form.bio}
                onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                rows={2}
                placeholder="Bio"
                className={`${AUTH.inputWithLabel} resize-none`}
              />
            </div>
            {accountType === 'PERSONAL' && (
              <>
                <div>
                  <label className={AUTH.label}>Pronouns</label>
                  <input value={form.pronouns} onChange={(e) => setForm((f) => ({ ...f, pronouns: e.target.value }))} placeholder="e.g. she/her" className={AUTH.inputWithLabel} />
                </div>
                <div>
                  <label className={AUTH.label}>Website (1 link)</label>
                  <input type="url" value={form.website} onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))} placeholder="https://" className={AUTH.inputWithLabel} />
                </div>
              </>
            )}
            {(accountType === 'BUSINESS' || accountType === 'CREATOR') && (
              <>
                <div>
                  <label className={AUTH.label}>Category</label>
                  <input value={form.businessCategory} onChange={(e) => setForm((f) => ({ ...f, businessCategory: e.target.value }))} placeholder="e.g. Retail, Creator" className={AUTH.inputWithLabel} />
                </div>
                <div>
                  <label className={AUTH.label}>Contact email</label>
                  <input type="email" value={form.contactEmail} onChange={(e) => setForm((f) => ({ ...f, contactEmail: e.target.value }))} className={AUTH.inputWithLabel} />
                </div>
                <div>
                  <label className={AUTH.label}>Contact phone</label>
                  <input value={form.contactPhone} onChange={(e) => setForm((f) => ({ ...f, contactPhone: e.target.value }))} className={AUTH.inputWithLabel} />
                </div>
                <div>
                  <label className={AUTH.label}>Address</label>
                  <input value={form.contactAddress} onChange={(e) => setForm((f) => ({ ...f, contactAddress: e.target.value }))} className={AUTH.inputWithLabel} />
                </div>
              </>
            )}
            {accountType === 'JOB' && (
              <>
                <div>
                  <label className={AUTH.label}>Professional headline</label>
                  <input value={form.professionalHeadline} onChange={(e) => setForm((f) => ({ ...f, professionalHeadline: e.target.value }))} placeholder="e.g. Senior Engineer" className={AUTH.inputWithLabel} />
                </div>
                <div>
                  <label className={AUTH.label}>Skills (comma-separated)</label>
                  <input value={form.skills} onChange={(e) => setForm((f) => ({ ...f, skills: e.target.value }))} placeholder="React, Node, Leadership" className={AUTH.inputWithLabel} />
                </div>
                <label className="flex items-center gap-2 text-[#a8a8a8] text-sm">
                  <input type="checkbox" checked={form.openToOpportunities} onChange={(e) => setForm((f) => ({ ...f, openToOpportunities: e.target.checked }))} className="rounded border-[#363636] bg-[#262626] text-[#0095f6]" />
                  Open to opportunities
                </label>
              </>
            )}
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setStep('type')} className={AUTH.btnSecondary}>
                Back
              </button>
              <button type="submit" disabled={loading} className={`flex-1 ${AUTH.btnPrimary}`}>
                {loading ? 'Creating…' : 'Create account'}
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
