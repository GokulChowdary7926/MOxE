import React, { useEffect, useState } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5007/api';

type MfaPolicy = {
  id?: string;
  orgId?: string;
  methods?: Record<string, boolean>;
  gracePeriodDays?: number;
  enforcementLevel?: string;
  exclusions?: { userIds?: string[]; groupIds?: string[] };
};

type MfaCompliance = {
  totalUsers: number;
  enrolledUsers: number;
  enrollmentRate: number;
};

function useAuthHeaders(): Record<string, string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

export default function Access() {
  const [orgId, setOrgId] = useState<string>('');
  const [mfaPolicy, setMfaPolicy] = useState<MfaPolicy | null>(null);
  const [compliance, setCompliance] = useState<MfaCompliance | null>(null);
  const [loading, setLoading] = useState(false);
  const [savingPolicy, setSavingPolicy] = useState(false);
  const [loadingCompliance, setLoadingCompliance] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [methodsSms, setMethodsSms] = useState(true);
  const [methodsTotp, setMethodsTotp] = useState(true);
  const [methodsWebauthn, setMethodsWebauthn] = useState(false);
  const [enforcementLevel, setEnforcementLevel] = useState('optional');
  const [gracePeriodDays, setGracePeriodDays] = useState(14);

  const headers = useAuthHeaders();

  useEffect(() => {
    const resolveOrg = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE}/job/access/org`, { headers });
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || 'Failed to resolve organization for this Job account');
        }
        const data = await res.json();
        setOrgId(data.id);
      } catch (e: any) {
        setError(e?.message || 'Failed to resolve organization for this Job account');
      } finally {
        setLoading(false);
      }
    };
    resolveOrg();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadMfaPolicy = async (targetOrgId: string) => {
    if (!targetOrgId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/access/orgs/${encodeURIComponent(targetOrgId)}/mfa-policy`, {
        headers,
      });
      if (!res.ok) {
        if (res.status === 404) {
          setMfaPolicy(null);
          return;
        }
        const text = await res.text();
        throw new Error(text || 'Failed to load MFA policy');
      }
      const data = (await res.json()) as MfaPolicy;
      setMfaPolicy(data);
      const methods = data.methods || {};
      setMethodsSms(Boolean(methods.sms));
      setMethodsTotp(Boolean(methods.totp));
      setMethodsWebauthn(Boolean(methods.webauthn));
      setEnforcementLevel((data.enforcementLevel || 'optional').toLowerCase());
      setGracePeriodDays(typeof data.gracePeriodDays === 'number' ? data.gracePeriodDays : 14);
    } catch (e: any) {
      setError(e?.message || 'Failed to load MFA policy');
    } finally {
      setLoading(false);
    }
  };

  const loadCompliance = async (targetOrgId: string) => {
    if (!targetOrgId) return;
    setLoadingCompliance(true);
    setError(null);
    try {
      const res = await fetch(
        `${API_BASE}/access/orgs/${encodeURIComponent(targetOrgId)}/mfa/compliance`,
        { headers },
      );
      if (!res.ok) throw new Error('Failed to load MFA compliance');
      const data = (await res.json()) as MfaCompliance;
      setCompliance(data);
    } catch (e: any) {
      setError(e?.message || 'Failed to load MFA compliance');
    } finally {
      setLoadingCompliance(false);
    }
  };

  useEffect(() => {
    if (orgId) {
      loadMfaPolicy(orgId);
      loadCompliance(orgId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId]);

  const handleSavePolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgId) return;
    setSavingPolicy(true);
    setError(null);
    try {
      const body: MfaPolicy = {
        methods: {
          sms: methodsSms,
          totp: methodsTotp,
          webauthn: methodsWebauthn,
        },
        gracePeriodDays,
        enforcementLevel,
      };
      const res = await fetch(
        `${API_BASE}/access/orgs/${encodeURIComponent(orgId)}/mfa-policy`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify(body),
        },
      );
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Failed to save MFA policy');
      }
      const data = (await res.json()) as MfaPolicy;
      setMfaPolicy(data);
      await loadCompliance(orgId);
    } catch (e: any) {
      setError(e?.message || 'Failed to save MFA policy');
    } finally {
      setSavingPolicy(false);
    }
  };

  const enrollmentRatePct = compliance
    ? Math.round((compliance.enrollmentRate || 0) * 100)
    : 0;

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <div className="w-full lg:w-80 space-y-4">
        <div>
          <h2 className="text-2xl font-semibold text-slate-800 dark:text-white mb-1">
            MOxE ACCESS
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm">
            Configure MFA guardrails for your Job workspace. The underlying MOxE ACCESS directory is
            automatically linked to your Job account&apos;s organization.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-200 text-xs">
            {error}
          </div>
        )}

        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 space-y-2 text-xs">
          <div className="font-semibold text-slate-700 dark:text-slate-200">Organization</div>
          <input
            className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 px-2 py-1.5 text-xs text-slate-700 dark:text-slate-200"
            placeholder="Org ID"
            value={orgId}
            readOnly
          />
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            This org ID is resolved from your Job account. You can manage MFA policy and monitor
            enrollment for all org users here.
          </p>
        </div>
      </div>

      <div className="flex-1 min-w-0 space-y-4">
        <form
          onSubmit={handleSavePolicy}
          className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 space-y-4 text-xs"
        >
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                MFA enforcement
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Choose which MFA methods are allowed and how strongly they are enforced.
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <div className="text-[11px] font-medium text-slate-700 dark:text-slate-200">
                Allowed methods
              </div>
              <div className="space-y-1">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="h-3.5 w-3.5 rounded border-slate-300 dark:border-slate-600"
                    checked={methodsSms}
                    onChange={(e) => setMethodsSms(e.target.checked)}
                  />
                  <span className="text-[11px] text-slate-700 dark:text-slate-200">
                    SMS one‑time codes
                  </span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="h-3.5 w-3.5 rounded border-slate-300 dark:border-slate-600"
                    checked={methodsTotp}
                    onChange={(e) => setMethodsTotp(e.target.checked)}
                  />
                  <span className="text-[11px] text-slate-700 dark:text-slate-200">
                    Authenticator app (TOTP)
                  </span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="h-3.5 w-3.5 rounded border-slate-300 dark:border-slate-600"
                    checked={methodsWebauthn}
                    onChange={(e) => setMethodsWebauthn(e.target.checked)}
                  />
                  <span className="text-[11px] text-slate-700 dark:text-slate-200">
                    Security keys / WebAuthn (FIDO2)
                  </span>
                </label>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-slate-700 dark:text-slate-200">
                Enforcement level
              </label>
              <select
                className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1.5 text-xs text-slate-900 dark:text-slate-100"
                value={enforcementLevel}
                onChange={(e) => setEnforcementLevel(e.target.value)}
              >
                <option value="optional">Optional</option>
                <option value="recommended">Recommended</option>
                <option value="required">Required</option>
              </select>
              <label className="text-[11px] font-medium text-slate-700 dark:text-slate-200 mt-2 block">
                Grace period (days)
              </label>
              <input
                type="number"
                min={0}
                max={90}
                className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1.5 text-xs text-slate-900 dark:text-slate-100"
                value={gracePeriodDays}
                onChange={(e) => setGracePeriodDays(Number(e.target.value) || 0)}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              type="submit"
              disabled={savingPolicy || !orgId}
              className="inline-flex items-center rounded-md bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white px-3 py-1.5 text-[11px]"
            >
              {savingPolicy ? 'Saving…' : 'Save MFA policy'}
            </button>
          </div>
        </form>

        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 text-xs space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                MFA enrollment
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                See how many org users have enrolled at least one MFA factor.
              </div>
            </div>
            <button
              type="button"
              disabled={loadingCompliance || !orgId}
              onClick={() => orgId && loadCompliance(orgId)}
              className="inline-flex items-center rounded-md border border-slate-300 dark:border-slate-700 px-3 py-1.5 text-[11px] font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              {loadingCompliance ? 'Refreshing…' : 'Refresh'}
            </button>
          </div>

          {!compliance && !loadingCompliance && (
            <div className="text-xs text-slate-500 dark:text-slate-400">
              No MFA compliance data yet. Ensure your org ID is correct and you have users in the
              directory.
            </div>
          )}

          {compliance && (
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="text-3xl font-semibold text-slate-900 dark:text-white">
                  {enrollmentRatePct}%
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  Enrolled in MFA
                </div>
                <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                  {compliance.enrolledUsers} of {compliance.totalUsers} users
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

