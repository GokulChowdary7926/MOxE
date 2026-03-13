import React, { useEffect, useState } from 'react';
import { useCurrentAccount } from '../../hooks/useAccountCapabilities';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5007/api';

type JobProfile = {
  id: string;
  username: string;
  displayName: string;
  accountType: string;
  professionalHeadline?: string | null;
  professionalSection?: any | null;
  personalSection?: any | null;
  skills?: string[];
  workplaceVerified?: boolean;
  openToOpportunities?: boolean;
  location?: string | null;
  website?: string | null;
};

function useAuthHeaders() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return token
    ? {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    : { 'Content-Type': 'application/json' };
}

export default function JobProfileTool() {
  const currentAccount = useCurrentAccount() as any;
  const [profile, setProfile] = useState<JobProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [professionalHeadline, setProfessionalHeadline] = useState('');
  const [skillsText, setSkillsText] = useState('');
  const [openToOpportunities, setOpenToOpportunities] = useState(false);
  const [location, setLocation] = useState('');
  const [website, setWebsite] = useState('');
  const [professionalSectionText, setProfessionalSectionText] = useState('');
  const [personalSectionText, setPersonalSectionText] = useState('');

  const headers = useAuthHeaders();

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      setLoading(false);
      setError('Not logged in');
      return;
    }
    setLoading(true);
    setError(null);
    fetch(`${API_BASE}/accounts/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Failed to load profile'))))
      .then((data) => {
        const acc = data?.account || data;
        if (!acc) throw new Error('Profile not found');
        setProfile(acc);
        setProfessionalHeadline(acc.professionalHeadline || '');
        setSkillsText((acc.skills || []).join('\n'));
        setOpenToOpportunities(Boolean(acc.openToOpportunities));
        setLocation(acc.location || '');
        setWebsite(acc.website || '');
        setProfessionalSectionText(
          acc.professionalSection ? JSON.stringify(acc.professionalSection, null, 2) : '',
        );
        setPersonalSectionText(
          acc.personalSection ? JSON.stringify(acc.personalSection, null, 2) : '',
        );
      })
      .catch((e: any) => {
        setError(e?.message || 'Failed to load profile');
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      let professionalSection: any = undefined;
      let personalSection: any = undefined;
      if (professionalSectionText.trim()) {
        try {
          professionalSection = JSON.parse(professionalSectionText);
        } catch {
          // keep undefined if invalid
        }
      }
      if (personalSectionText.trim()) {
        try {
          personalSection = JSON.parse(personalSectionText);
        } catch {
          // keep undefined if invalid
        }
      }
      const skills = skillsText
        .split('\n')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      const res = await fetch(`${API_BASE}/accounts/me`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          professionalHeadline: professionalHeadline || null,
          skills,
          openToOpportunities,
          location: location || null,
          website: website || null,
          professionalSection,
          personalSection,
        }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Failed to save profile');
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 text-sm text-slate-500 dark:text-slate-400">Loading Job profile…</div>
    );
  }

  if (!profile) {
    return (
      <div className="p-4 text-sm text-red-500">
        {error || 'Could not load Job profile for this account.'}
      </div>
    );
  }

  const isJobAccount = (profile.accountType || currentAccount?.accountType) === 'JOB';

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <div className="w-full lg:w-80 space-y-3">
        <div>
          <h2 className="text-2xl font-semibold text-slate-800 dark:text-white mb-1">
            MOxE PROFILE (Job)
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm">
            Manage your Job account professional profile: headline, skills, and availability.
          </p>
        </div>
        {error && (
          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-200 text-xs">
            {error}
          </div>
        )}
        {!isJobAccount && (
          <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-200 text-xs">
            This account is not currently a Job account. Some fields may be ignored until you
            switch to a Job account type.
          </div>
        )}
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 text-xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-800 dark:text-slate-100">
              @{profile.username}
            </span>
            <span className="text-slate-500 dark:text-slate-400 uppercase tracking-wide text-[10px]">
              {profile.accountType}
            </span>
          </div>
          <div className="text-slate-600 dark:text-slate-300">
            {profile.displayName || profile.username}
          </div>
          {location && (
            <div className="text-slate-500 dark:text-slate-400 text-[11px]">{location}</div>
          )}
          {website && (
            <div className="text-[11px]">
              <a
                href={website}
                target="_blank"
                rel="noreferrer"
                className="text-indigo-600 dark:text-indigo-400 underline"
              >
                {website}
              </a>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 min-w-0 space-y-4">
        <form
          onSubmit={handleSave}
          className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 space-y-4"
        >
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-700 dark:text-slate-200">
              Professional headline
            </label>
            <input
              className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-sm text-slate-900 dark:text-slate-100"
              placeholder="e.g. Senior Product Engineer · Full‑stack · TypeScript"
              value={professionalHeadline}
              onChange={(e) => setProfessionalHeadline(e.target.value)}
            />
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Shown prominently on your Job profile and in Job‑specific tools.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-700 dark:text-slate-200">
              Skills (one per line)
            </label>
            <textarea
              className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
              rows={4}
              placeholder={'e.g.\nReact\nTypeScript\nNode.js\nProduct discovery'}
              value={skillsText}
              onChange={(e) => setSkillsText(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              id="open-to-opps"
              type="checkbox"
              className="h-3.5 w-3.5 rounded border-slate-300 dark:border-slate-600"
              checked={openToOpportunities}
              onChange={(e) => setOpenToOpportunities(e.target.checked)}
            />
            <label
              htmlFor="open-to-opps"
              className="text-xs text-slate-700 dark:text-slate-200 cursor-pointer"
            >
              Open to new roles, projects, or consulting opportunities
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-200">
                Location
              </label>
              <input
                className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-sm text-slate-900 dark:text-slate-100"
                placeholder="e.g. Remote · Berlin, Germany"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-200">
                Website / portfolio
              </label>
              <input
                className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-sm text-slate-900 dark:text-slate-100"
                placeholder="https://"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-700 dark:text-slate-200">
              Professional section (JSON, optional)
            </label>
            <textarea
              className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-mono text-slate-900 dark:text-slate-100"
              rows={5}
              placeholder='e.g. { "experience": [...], "education": [...] }'
              value={professionalSectionText}
              onChange={(e) => setProfessionalSectionText(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-700 dark:text-slate-200">
              Personal section (JSON, optional)
            </label>
            <textarea
              className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-mono text-slate-900 dark:text-slate-100"
              rows={4}
              placeholder='e.g. { "interests": [...], "hobbies": [...] }'
              value={personalSectionText}
              onChange={(e) => setPersonalSectionText(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center rounded-md bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-xs font-medium px-3 py-1.5"
            >
              {saving ? 'Saving…' : 'Save Job profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

