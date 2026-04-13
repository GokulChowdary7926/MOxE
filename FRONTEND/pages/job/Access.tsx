import React, { useEffect, useState } from 'react';
import {
  Filter,
  Info,
  MoreVertical,
  Shield,
  SortAsc,
  Users,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getApiBase } from '../../services/api';
import { parseApiErrorBody, readApiError } from '../../utils/readApiError';
import { JobPageContent, JobCard } from '../../components/job/JobPageContent';
import { JOB_MOBILE } from '../../components/job/jobMobileStyles';
import { JobDesignBiblePanel, JobToolBibleShell } from '../../components/job/bible';

const API_BASE = getApiBase();

type OrgUserApiRow = {
  id: string;
  email: string;
  displayName: string | null;
  firstName: string | null;
  lastName: string | null;
  role: { name: string } | null;
  department: { name: string } | null;
  groups: Array<{ group: { id: string; name: string } }>;
};

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

type AuditRowApi = {
  id: string;
  createdAt: string;
  action: string;
  summary: string | null;
  targetType: string | null;
  targetId: string | null;
  meta: unknown;
  actor: { id: string; displayName: string; username: string };
};

function useAuthHeaders(): Record<string, string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

function initials(name: string) {
  return name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function displayNameForOrgUser(u: OrgUserApiRow): string {
  if (u.displayName?.trim()) return u.displayName.trim();
  const parts = [u.firstName, u.lastName].filter(Boolean).join(' ').trim();
  if (parts) return parts;
  return u.email;
}

function toolLettersForRow(u: OrgUserApiRow): [string, string, string] {
  const letters = u.groups
    .map((g) => {
      const n = g.group?.name?.trim();
      return n ? n.charAt(0).toUpperCase() : '';
    })
    .filter(Boolean)
    .slice(0, 3);
  while (letters.length < 3) letters.push('—');
  return [letters[0] || '—', letters[1] || '—', letters[2] || '—'];
}

/**
 * Real switch: 44px+ touch height, clear on/off visuals, precise knob travel (52×32 track).
 */
function AccessSwitch({
  checked,
  onChange,
  disabled,
  id,
  labelledBy,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  id: string;
  labelledBy?: string;
}) {
  return (
    <button
      type="button"
      id={id}
      role="switch"
      aria-checked={checked}
      aria-labelledby={labelledBy}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={[
        'relative shrink-0 rounded-full border-2 transition-colors duration-200 ease-out',
        'h-8 w-[52px] min-h-[32px] min-w-[52px] touch-manipulation [-webkit-tap-highlight-color:transparent]',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8DABFF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#161A1D]',
        checked
          ? 'border-[#8DABFF] bg-[#8DABFF] shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]'
          : 'border-[#3D4550] bg-[#0E0E10]',
        disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer active:scale-[0.96]',
      ].join(' ')}
    >
      <span
        className={[
          'pointer-events-none absolute top-1 left-1 h-[22px] w-[22px] rounded-full shadow-md transition-transform duration-200 ease-out',
          checked ? 'translate-x-[22px] bg-white' : 'translate-x-0 bg-[#8C9BAB]',
        ].join(' ')}
        aria-hidden
      />
    </button>
  );
}

function ToggleRow({
  title,
  description,
  checked,
  onChange,
  disabled,
  switchId,
  labelId,
  isLast,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  switchId: string;
  labelId: string;
  isLast?: boolean;
}) {
  return (
    <div
      className={[
        'flex items-center gap-3 py-3.5 min-h-[56px]',
        !isLast ? 'border-b border-[#2C333A]/90' : '',
      ].join(' ')}
    >
      <div className="min-w-0 flex-1" id={labelId}>
        <p className="text-[15px] font-semibold text-[#E6EDF3] leading-snug pr-1">{title}</p>
        <p className="text-[11px] text-[#8C9BAB] mt-1 leading-relaxed">{description}</p>
      </div>
      <AccessSwitch
        id={switchId}
        labelledBy={labelId}
        checked={checked}
        onChange={onChange}
        disabled={disabled}
      />
    </div>
  );
}

const ENFORCEMENT_OPTIONS = [
  { value: 'optional', label: 'Optional' },
  { value: 'recommended', label: 'Recommended' },
  { value: 'required', label: 'Required' },
] as const;

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

  const [orgUsers, setOrgUsers] = useState<OrgUserApiRow[]>([]);
  const [loadingRoster, setLoadingRoster] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);

  const [auditOpen, setAuditOpen] = useState(false);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditRows, setAuditRows] = useState<AuditRowApi[]>([]);
  const [auditError, setAuditError] = useState<string | null>(null);

  const headers = useAuthHeaders();

  const loadAudit = async () => {
    if (!orgId) return;
    setAuditLoading(true);
    setAuditError(null);
    try {
      const res = await fetch(
        `${API_BASE}/access/orgs/${encodeURIComponent(orgId)}/audit?limit=50`,
        { headers },
      );
      if (!res.ok) {
        const text = await res.text();
        throw new Error(parseApiErrorBody(text, res.statusText, res.status));
      }
      const data = (await res.json()) as AuditRowApi[];
      setAuditRows(Array.isArray(data) ? data : []);
    } catch (e: unknown) {
      setAuditError(e instanceof Error ? e.message : 'Failed to load audit log');
      setAuditRows([]);
    } finally {
      setAuditLoading(false);
    }
  };

  const openAudit = () => {
    setAuditOpen(true);
    void loadAudit();
  };

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
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Failed to resolve organization for this Job account';
        setError(msg);
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
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to load MFA policy';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const loadCompliance = async (targetOrgId: string, opts?: { notify?: boolean }) => {
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
      if (opts?.notify) toast.success('Enrollment refreshed');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to load MFA compliance';
      setError(msg);
      toast.error(msg);
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

  const loadOrgUsers = async (targetOrgId: string) => {
    if (!targetOrgId) return;
    setLoadingRoster(true);
    try {
      const res = await fetch(`${API_BASE}/access/orgs/${encodeURIComponent(targetOrgId)}/users`, { headers });
      if (!res.ok) throw new Error(await readApiError(res));
      const data = (await res.json()) as OrgUserApiRow[];
      setOrgUsers(Array.isArray(data) ? data : []);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to load team roster';
      toast.error(msg);
      setOrgUsers([]);
    } finally {
      setLoadingRoster(false);
    }
  };

  useEffect(() => {
    if (orgId) void loadOrgUsers(orgId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId]);

  const sendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = inviteEmail.trim().toLowerCase();
    if (!orgId || !email.includes('@')) {
      toast.error('Enter a valid email.');
      return;
    }
    setInviting(true);
    try {
      const res = await fetch(`${API_BASE}/access/invitations`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ orgId, email }),
      });
      if (!res.ok) throw new Error(await readApiError(res));
      setInviteEmail('');
      toast.success('Invitation sent. They appear in the roster after they accept.');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Invite failed');
    } finally {
      setInviting(false);
    }
  };

  const removeMember = async (row: OrgUserApiRow) => {
    if (!orgId) return;
    const ok = window.confirm(`Remove ${row.email} from this organization?`);
    if (!ok) return;
    try {
      const res = await fetch(
        `${API_BASE}/access/orgs/${encodeURIComponent(orgId)}/users/${encodeURIComponent(row.id)}`,
        { method: 'DELETE', headers },
      );
      if (!res.ok) throw new Error(await readApiError(res));
      setOrgUsers((prev) => prev.filter((u) => u.id !== row.id));
      toast.success('Member removed');
      void loadCompliance(orgId);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Remove failed');
    }
  };

  const handleSavePolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgId) return;
    if (!methodsSms && !methodsTotp && !methodsWebauthn) {
      toast.error('Turn on at least one MFA method.');
      return;
    }
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
      const res = await fetch(`${API_BASE}/access/orgs/${encodeURIComponent(orgId)}/mfa-policy`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Failed to save MFA policy');
      }
      const data = (await res.json()) as MfaPolicy;
      setMfaPolicy(data);
      await loadCompliance(orgId);
      toast.success('MFA policy saved');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to save MFA policy';
      setError(msg);
      toast.error(msg);
    } finally {
      setSavingPolicy(false);
    }
  };

  const enrollmentRatePct = compliance ? Math.round((compliance.enrollmentRate || 0) * 100) : 0;
  const enrolled = compliance?.enrolledUsers ?? 0;
  const total = compliance?.totalUsers ?? 0;
  const barPct = total > 0 ? Math.min(100, Math.round((enrolled / total) * 100)) : enrollmentRatePct;

  const enforcementLabel =
    enforcementLevel === 'required'
      ? 'Required'
      : enforcementLevel === 'recommended'
        ? 'Recommended'
        : 'Optional';

  const primaryCta =
    'w-full min-h-[48px] rounded-xl font-bold text-[15px] text-[#0B0C0E] bg-gradient-to-r from-[#8DABFF] to-[#6B8CE8] active:scale-[0.99] transition-transform disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_8px_24px_rgba(141,171,255,0.22)]';

  const orgReady = Boolean(orgId) && !loading;

  return (
    <JobPageContent variant="track" error={error}>
      <JobToolBibleShell toolTitle="MOxE ACCESS" toolIconMaterial="admin_panel_settings">
      <div className="flex flex-col gap-4 pb-2 safe-area-pb">
        {/* Hero + enrollment — mobile-first stack (Job shell ≤428px); bible Access Control */}
        <section className="flex flex-col gap-3">
          <div className="rounded-[14px] border border-[#2C333A] bg-[#161A1D] p-4 border-l-[3px] border-l-[#8DABFF] relative overflow-hidden">
            <div className="relative z-10">
              <p className="text-[#8DABFF] font-bold text-[10px] uppercase tracking-[0.2em] mb-2">
                Security overview
              </p>
              <p className="text-xl font-extrabold text-[#E6EDF3] mb-1 tracking-tight leading-tight">
                Active protocol:{' '}
                <span className="text-[#8DABFF]">{enforcementLabel}</span> MFA
              </p>
              <p className="text-[12px] leading-relaxed text-[#8C9BAB] mb-4">
                Allowed factors, enforcement, and grace period apply to everyone in this org.
              </p>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  disabled={loadingCompliance || !orgId}
                  onClick={() => orgId && loadCompliance(orgId, { notify: true })}
                  className="min-h-[48px] w-full px-4 rounded-xl font-bold text-sm border border-[#2C333A] bg-[#131315] text-[#E6EDF3] hover:bg-[#2C333A]/70 active:scale-[0.98] transition-all disabled:opacity-50 touch-manipulation"
                >
                  {loadingCompliance ? 'Refreshing…' : 'Refresh enrollment'}
                </button>
                <button
                  type="button"
                  disabled={!orgId}
                  onClick={openAudit}
                  className="min-h-[48px] w-full px-4 rounded-xl font-bold text-sm text-[#8DABFF] bg-[#8DABFF]/10 border border-[#8DABFF]/25 hover:bg-[#8DABFF]/15 active:scale-[0.98] transition-all touch-manipulation disabled:opacity-50"
                >
                  Audit activity
                </button>
              </div>
            </div>
            <div
              className="absolute right-0 top-0 w-36 h-full bg-gradient-to-l from-[#8DABFF]/[0.08] to-transparent pointer-events-none"
              aria-hidden
            />
          </div>

          <div className="rounded-[14px] border border-[#2C333A] bg-[#131315] p-4 flex flex-col justify-between min-h-[156px]">
            <div>
              <div className="flex justify-between items-start mb-2">
                <p className="text-[#8C9BAB] font-bold text-[10px] uppercase tracking-widest">
                  MFA enrollment
                </p>
                <Users className="w-5 h-5 text-[#8DABFF]" strokeWidth={2} aria-hidden />
              </div>
              {loading && !compliance ? (
                <div className="h-11 w-28 rounded-lg bg-[#2C333A] animate-pulse" />
              ) : (
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="text-[2.5rem] font-black text-[#E6EDF3] tracking-tighter leading-none tabular-nums">
                    {compliance ? enrollmentRatePct : '—'}
                    {compliance ? <span className="text-2xl font-black">%</span> : null}
                  </span>
                  {compliance ? (
                    <span className="text-[#8C9BAB] text-sm">
                      {enrolled} / {total} users
                    </span>
                  ) : (
                    <span className="text-[#8C9BAB] text-sm">No data yet</span>
                  )}
                </div>
              )}
            </div>
            <div className="w-full bg-[#2C333A] h-2 rounded-full mt-3 overflow-hidden" role="progressbar" aria-valuenow={barPct} aria-valuemin={0} aria-valuemax={100}>
              <div
                className="bg-[#8DABFF] h-full rounded-full transition-all duration-500"
                style={{ width: `${compliance ? barPct : 0}%` }}
              />
            </div>
            <p className="text-[10px] text-[#8C9BAB] mt-2.5 flex items-start gap-2 leading-snug">
              <Info className="w-3.5 h-3.5 shrink-0 text-[#8DABFF] mt-0.5" aria-hidden />
              <span>Confirm organization ID below if enrollment stays empty.</span>
            </p>
          </div>
        </section>

        <JobCard variant="track">
          <div className="text-[10px] font-bold uppercase tracking-widest text-[#8C9BAB] mb-2">
            Organization ID
          </div>
          <input
            className={`${JOB_MOBILE.input} text-base !bg-[#0E0E10] !border-[#2C333A] text-[#E6EDF3] min-h-[48px]`}
            placeholder="Resolving…"
            value={orgId}
            readOnly
            aria-readonly
          />
          <p className="text-[11px] text-[#8C9BAB] mt-2 leading-relaxed">
            Resolved from your Job account for MFA policy API calls.
          </p>
        </JobCard>

        {/* MFA first on small viewports, roster second (Job app is narrow). */}
        <div className="flex flex-col gap-4">
          <section className="min-w-0 space-y-3">
            <div className="flex justify-between items-center gap-2 px-0.5">
              <h2 className="font-bold text-[15px] text-[#E6EDF3] flex items-center gap-2 min-w-0">
                <Users className="w-[18px] h-[18px] text-[#8DABFF] shrink-0" strokeWidth={2.25} />
                <span className="truncate">Team authorization</span>
              </h2>
              <div className="flex gap-0.5 shrink-0">
                <button
                  type="button"
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-[#8C9BAB] hover:bg-[#2C333A]/80 active:scale-95 touch-manipulation"
                  aria-label="Filter"
                  onClick={() => toast('Filters — directory sync.')}
                >
                  <Filter className="w-[18px] h-[18px]" />
                </button>
                <button
                  type="button"
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-[#8C9BAB] hover:bg-[#2C333A]/80 active:scale-95 touch-manipulation"
                  aria-label="Sort"
                  onClick={() => toast('Sort — directory sync.')}
                >
                  <SortAsc className="w-[18px] h-[18px]" />
                </button>
              </div>
            </div>

            <form onSubmit={sendInvite} className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <div className="flex-1 min-w-0">
                <label htmlFor="access-invite-email" className="text-[10px] font-bold uppercase tracking-widest text-[#8C9BAB] block mb-1">
                  Invite by email
                </label>
                <input
                  id="access-invite-email"
                  type="email"
                  autoComplete="email"
                  placeholder="colleague@company.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  disabled={!orgId || inviting}
                  className={`${JOB_MOBILE.input} text-base !bg-[#0E0E10] !border-[#2C333A] text-[#E6EDF3] min-h-[48px]`}
                />
              </div>
              <button
                type="submit"
                disabled={!orgId || inviting || !inviteEmail.trim()}
                className="min-h-[48px] px-5 rounded-xl font-bold text-sm border border-[#8DABFF]/40 bg-[#8DABFF]/15 text-[#E6EDF3] hover:bg-[#8DABFF]/25 disabled:opacity-40 touch-manipulation"
              >
                {inviting ? 'Sending…' : 'Send invite'}
              </button>
            </form>

            <JobCard variant="track" flush className="shadow-[0_20px_48px_rgba(0,0,0,0.22)]">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-left border-collapse">
                  <thead>
                    <tr className="bg-[#0E0E10]/90 border-b border-[#2C333A]">
                      <th className="px-5 py-3.5 text-[10px] font-bold uppercase tracking-widest text-[#8C9BAB]">
                        Member
                      </th>
                      <th className="px-5 py-3.5 text-[10px] font-bold uppercase tracking-widest text-[#8C9BAB]">
                        Access group
                      </th>
                      <th className="px-5 py-3.5 text-[10px] font-bold uppercase tracking-widest text-[#8C9BAB]">
                        Tool access
                      </th>
                      <th className="px-5 py-3.5 text-[10px] font-bold uppercase tracking-widest text-[#8C9BAB] text-right">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2C333A]/80">
                    {loadingRoster ? (
                      <tr>
                        <td colSpan={4} className="px-5 py-8 text-center text-sm text-[#8C9BAB]">
                          Loading roster…
                        </td>
                      </tr>
                    ) : orgUsers.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-5 py-8 text-center text-sm text-[#8C9BAB]">
                          No org members yet. Send an invite or provision users via the access API.
                        </td>
                      </tr>
                    ) : (
                      orgUsers.map((m) => {
                        const name = displayNameForOrgUser(m);
                        const roleLabel = m.role?.name || m.department?.name || 'Member';
                        const tools = toolLettersForRow(m);
                        return (
                          <tr key={m.id} className="hover:bg-[#2C333A]/20 transition-colors">
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-[#2C333A] flex items-center justify-center text-xs font-bold text-[#8DABFF]">
                                  {initials(name)}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm font-bold text-[#E6EDF3] truncate">{name}</p>
                                  <p className="text-[10px] text-[#8C9BAB] truncate">{m.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-3.5">
                              <span className="inline-flex bg-[#2C333A] text-[#8DABFF] border border-[#8DABFF]/25 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-tight">
                                {roleLabel}
                              </span>
                            </td>
                            <td className="px-5 py-3.5">
                              <div className="flex gap-2">
                                {tools.map((t, i) => (
                                  <span
                                    key={i}
                                    className={
                                      t === '—'
                                        ? 'w-8 h-8 flex items-center justify-center rounded-lg bg-[#0E0E10] text-[#5c6570] text-xs font-bold border border-[#2C333A]'
                                        : 'w-8 h-8 flex items-center justify-center rounded-lg bg-[#8DABFF]/12 text-[#8DABFF] text-xs font-bold border border-[#8DABFF]/30'
                                    }
                                  >
                                    {t}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="px-5 py-3.5 text-right">
                              <button
                                type="button"
                                className="p-2 rounded-lg text-[#8C9BAB] hover:text-[#E6EDF3] inline-flex min-h-[44px] min-w-[44px] items-center justify-center"
                                aria-label={`More options for ${m.email}`}
                                onClick={() => void removeMember(m)}
                              >
                                <MoreVertical className="w-5 h-5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
              <p className="text-[10px] text-[#8C9BAB] px-5 py-3 border-t border-[#2C333A] bg-[#0E0E10]/50">
                Roster from <span className="text-[#E6EDF3]">GET /access/orgs/…/users</span>. Group initials = first letter of each access group (up to three).
              </p>
            </JobCard>
          </section>

          <section className="min-w-0">
            <form
              onSubmit={handleSavePolicy}
              className="rounded-[14px] border border-[#2C333A] bg-[#161A1D] p-4 shadow-[0_20px_48px_rgba(0,0,0,0.22)] space-y-1"
              aria-label="MFA policy"
            >
              <h2 className="font-bold text-[11px] text-[#E6EDF3] uppercase tracking-[0.12em] flex items-center gap-2 pb-3 mb-1 border-b border-[#2C333A]">
                <Shield className="w-5 h-5 text-[#8DABFF]" strokeWidth={2} />
                MFA controls
              </h2>

              <div className="rounded-xl border border-[#2C333A]/80 bg-[#0E0E10]/50 px-3 -mx-0">
                <ToggleRow
                  labelId="access-lbl-sms"
                  switchId="access-mfa-sms"
                  title="SMS one-time codes"
                  description="SMS delivery where enabled for your org."
                  checked={methodsSms}
                  onChange={setMethodsSms}
                  disabled={!orgReady}
                />
                <ToggleRow
                  labelId="access-lbl-totp"
                  switchId="access-mfa-totp"
                  title="Authenticator (TOTP)"
                  description="Time-based codes from an authenticator app."
                  checked={methodsTotp}
                  onChange={setMethodsTotp}
                  disabled={!orgReady}
                />
                <ToggleRow
                  labelId="access-lbl-webauthn"
                  switchId="access-mfa-webauthn"
                  title="Security keys (WebAuthn)"
                  description="Hardware or platform passkeys (FIDO2)."
                  checked={methodsWebauthn}
                  onChange={setMethodsWebauthn}
                  disabled={!orgReady}
                  isLast
                />
              </div>

              <fieldset className="space-y-2 pt-4 border-0 p-0 m-0">
                <legend className="text-[10px] font-bold uppercase tracking-widest text-[#8C9BAB] mb-2 w-full">
                  Enforcement level
                </legend>
                <div className="flex flex-col gap-2" role="radiogroup" aria-label="Enforcement level">
                  {ENFORCEMENT_OPTIONS.map(({ value, label }) => {
                    const active = enforcementLevel === value;
                    return (
                      <button
                        key={value}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        disabled={!orgReady}
                        onClick={() => setEnforcementLevel(value)}
                        className={[
                          'min-h-[48px] w-full rounded-xl border px-4 text-left text-sm font-semibold transition-colors touch-manipulation',
                          active
                            ? 'border-[#8DABFF] bg-[#8DABFF]/15 text-[#E6EDF3] ring-1 ring-[#8DABFF]/30'
                            : 'border-[#2C333A] bg-[#0E0E10] text-[#8C9BAB] hover:border-[#3D4550] hover:text-[#E6EDF3]',
                          !orgReady ? 'opacity-40 cursor-not-allowed' : '',
                        ].join(' ')}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              <div className="space-y-2 pt-2">
                <label
                  htmlFor="access-grace"
                  className="text-[10px] font-bold uppercase tracking-widest text-[#8C9BAB] block"
                >
                  Grace period (days)
                </label>
                <input
                  id="access-grace"
                  type="number"
                  min={0}
                  max={90}
                  inputMode="numeric"
                  className="w-full min-h-[48px] rounded-xl border border-[#2C333A] bg-[#0E0E10] px-3 py-3 text-base text-[#E6EDF3] focus:outline-none focus:ring-2 focus:ring-[#8DABFF]/40"
                  value={gracePeriodDays}
                  onChange={(e) => setGracePeriodDays(Number(e.target.value) || 0)}
                  disabled={!orgReady}
                />
              </div>

              <div className="pt-2 pb-1">
                <button type="submit" disabled={savingPolicy || !orgReady} className={primaryCta}>
                  {savingPolicy ? 'Saving…' : 'Save MFA policy'}
                </button>
              </div>

              {mfaPolicy?.id ? (
                <p className="text-[10px] text-[#8C9BAB] leading-relaxed pt-1">
                  Policy id{' '}
                  <span className="text-[#E6EDF3] font-mono text-[9px] break-all">{mfaPolicy.id}</span>
                </p>
              ) : null}
            </form>
          </section>
        </div>

          <JobDesignBiblePanel toolKey="access" showHero={false} />
        </div>

        {auditOpen ? (
          <div
            className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="access-audit-title"
          >
            <button
              type="button"
              className="absolute inset-0 bg-black/55"
              aria-label="Close audit log"
              onClick={() => setAuditOpen(false)}
            />
            <div className="relative w-full sm:max-w-lg max-h-[85vh] sm:rounded-2xl rounded-t-2xl border border-[#2C333A] bg-[#131315] shadow-xl flex flex-col">
              <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-[#2C333A]">
                <h2 id="access-audit-title" className="text-sm font-bold text-[#E6EDF3]">
                  Audit activity
                </h2>
                <button
                  type="button"
                  onClick={() => setAuditOpen(false)}
                  className="p-2 rounded-lg text-[#8C9BAB] hover:bg-[#2C333A]/80"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="px-4 py-2 border-b border-[#2C333A]/80 flex justify-end">
                <button
                  type="button"
                  onClick={() => void loadAudit()}
                  disabled={auditLoading}
                  className="text-[11px] font-bold uppercase tracking-wider text-[#8DABFF]"
                >
                  {auditLoading ? 'Refreshing…' : 'Refresh'}
                </button>
              </div>
              <div className="overflow-y-auto flex-1 px-4 py-3">
                {auditError ? (
                  <p className="text-sm text-red-300" role="alert">
                    {auditError}
                  </p>
                ) : null}
                {!auditLoading && !auditError && auditRows.length === 0 ? (
                  <p className="text-sm text-[#8C9BAB]">
                    No audit entries yet. Events appear after sign-in (for org members), MFA policy saves, directory
                    changes, and org provisioning.
                  </p>
                ) : null}
                <ul className="space-y-3">
                  {auditRows.map((row) => (
                    <li
                      key={row.id}
                      className="rounded-xl border border-[#2C333A] bg-[#0E0E10] px-3 py-2.5 text-left"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#8DABFF]">
                          {row.action.replace(/_/g, ' ')}
                        </span>
                        <time className="text-[10px] text-[#8C9BAB] shrink-0 tabular-nums">
                          {new Date(row.createdAt).toLocaleString()}
                        </time>
                      </div>
                      <p className="text-[13px] text-[#E6EDF3] mt-1 font-medium">
                        {row.summary || '—'}
                      </p>
                      <p className="text-[11px] text-[#8C9BAB] mt-1">
                        {row.actor.displayName || row.actor.username}
                        {row.targetType ? ` · ${row.targetType}` : ''}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ) : null}
      </JobToolBibleShell>
    </JobPageContent>
  );
}
