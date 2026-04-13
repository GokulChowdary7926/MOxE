import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { ThemedView } from '../../components/ui/Themed';
import { MobileShell } from '../../components/layout/MobileShell';
import { getApiBase, getToken } from '../../services/api';

type VerificationRow = {
  id: string;
  status: string;
  createdAt: string;
  account?: {
    id: string;
    username: string | null;
    displayName: string | null;
    accountType: string | null;
    subscriptionTier: string | null;
  } | null;
};

type MemorialRow = {
  id: string;
  subjectUsername: string;
  relationship: string;
  details: string;
  status: string;
  createdAt: string;
  requester?: { username: string; displayName: string | null } | null;
};

type ClaimRow = {
  id: string;
  targetUsername: string;
  justification: string;
  status: string;
  createdAt: string;
  requester?: { username: string; displayName: string | null } | null;
};

type AdminTab = 'verification' | 'memorial' | 'claims';

export default function Admin() {
  const [tab, setTab] = useState<AdminTab>('verification');
  const [requests, setRequests] = useState<VerificationRow[]>([]);
  const [memorials, setMemorials] = useState<MemorialRow[]>([]);
  const [claims, setClaims] = useState<ClaimRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setError('Not signed in');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    setForbidden(false);
    try {
      const [vRes, mRes, cRes] = await Promise.all([
        fetch(`${getApiBase()}/admin/verification-requests`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${getApiBase()}/admin/memorialization-requests`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${getApiBase()}/admin/profile-claims`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (vRes.status === 403 || mRes.status === 403 || cRes.status === 403) {
        setForbidden(true);
        setError('You do not have platform admin access. Set ADMIN_ACCOUNT_IDS on the server to include your account id.');
        setRequests([]);
        setMemorials([]);
        setClaims([]);
        return;
      }
      const vData = await vRes.json().catch(() => ({}));
      const mData = await mRes.json().catch(() => ({}));
      const cData = await cRes.json().catch(() => ({}));
      if (!vRes.ok) {
        setError((vData as { error?: string }).error || 'Failed to load verification queue');
        setRequests([]);
      } else {
        setRequests(
          Array.isArray((vData as { requests?: VerificationRow[] }).requests)
            ? (vData as { requests: VerificationRow[] }).requests
            : [],
        );
      }
      if (!mRes.ok) setMemorials([]);
      else
        setMemorials(
          Array.isArray((mData as { requests?: MemorialRow[] }).requests) ? (mData as { requests: MemorialRow[] }).requests : [],
        );
      if (!cRes.ok) setClaims([]);
      else setClaims(Array.isArray((cData as { claims?: ClaimRow[] }).claims) ? (cData as { claims: ClaimRow[] }).claims : []);
    } catch {
      setError('Network error');
      setRequests([]);
      setMemorials([]);
      setClaims([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const decideVerification = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    const token = getToken();
    if (!token) return;
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch(`${getApiBase()}/admin/verification-requests/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((data as { error?: string }).error || 'Update failed');
        return;
      }
      await load();
    } catch {
      setError('Network error');
    } finally {
      setBusyId(null);
    }
  };

  const decideMemorial = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    const token = getToken();
    if (!token) return;
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch(`${getApiBase()}/admin/memorialization-requests/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((data as { error?: string }).error || 'Update failed');
        return;
      }
      await load();
    } catch {
      setError('Network error');
    } finally {
      setBusyId(null);
    }
  };

  const decideClaim = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    const token = getToken();
    if (!token) return;
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch(`${getApiBase()}/admin/profile-claims/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((data as { error?: string }).error || 'Update failed');
        return;
      }
      await load();
    } catch {
      setError('Network error');
    } finally {
      setBusyId(null);
    }
  };

  const pendingMemorials = memorials.filter((m) => m.status === 'PENDING');
  const pendingClaims = claims.filter((c) => c.status === 'PENDING');

  return (
    <ThemedView className="min-h-screen flex flex-col bg-black pb-24">
      <MobileShell>
        <header className="sticky top-0 z-10 flex items-center h-12 px-3 border-b border-[#262626] bg-black safe-area-pt">
          <Link to="/" className="flex items-center gap-1 text-white" aria-label="Back">
            <ChevronLeft className="w-6 h-6" />
            <span className="text-sm font-medium">Home</span>
          </Link>
          <span className="absolute left-1/2 -translate-x-1/2 text-white font-semibold text-sm">MOxE Admin</span>
        </header>

        <div className="px-4 py-4 space-y-4">
          <p className="text-[#a8a8a8] text-sm">
            Platform tools for operators listed in <code className="text-[#e6edf3]">ADMIN_ACCOUNT_IDS</code>.
          </p>

          {!forbidden && (
            <div className="flex gap-1 rounded-lg bg-[#1a1a1a] p-1">
              {(
                [
                  ['verification', 'Verification'],
                  ['memorial', `Memorial (${pendingMemorials.length})`],
                  ['claims', `Claims (${pendingClaims.length})`],
                ] as const
              ).map(([k, label]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setTab(k)}
                  className={`flex-1 py-2 rounded-md text-xs font-semibold ${
                    tab === k ? 'bg-[#262626] text-white' : 'text-[#a8a8a8]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-red-500/40 bg-red-950/30 px-3 py-2 text-sm text-red-200" role="alert">
              {error}
            </div>
          )}

          {loading && <p className="text-[#737373] text-sm">Loading…</p>}

          {!loading && tab === 'verification' && requests.length === 0 && !error && !forbidden && (
            <p className="text-[#737373] text-sm">No pending verification requests.</p>
          )}

          {!loading && tab === 'verification' && !forbidden && (
            <ul className="space-y-3">
              {requests.map((r) => (
                <li key={r.id} className="rounded-xl border border-[#2f2f2f] bg-[#121212] p-3">
                  <div className="text-white text-sm font-medium">
                    @{r.account?.username || r.account?.id || 'account'}
                  </div>
                  <div className="text-[#a8a8a8] text-xs mt-1">
                    {r.account?.displayName || '—'} · {r.account?.accountType || '—'} · tier {r.account?.subscriptionTier || '—'}
                  </div>
                  <div className="text-[#737373] text-[11px] mt-1">
                    Request {r.id.slice(0, 8)}… · {new Date(r.createdAt).toLocaleString()}
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button
                      type="button"
                      disabled={busyId === r.id}
                      onClick={() => void decideVerification(r.id, 'APPROVED')}
                      className="flex-1 py-2 rounded-lg bg-[#0095f6] text-white text-xs font-semibold disabled:opacity-50"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      disabled={busyId === r.id}
                      onClick={() => void decideVerification(r.id, 'REJECTED')}
                      className="flex-1 py-2 rounded-lg border border-[#363636] text-white text-xs font-semibold disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {!loading && tab === 'memorial' && !forbidden && (
            <>
              {pendingMemorials.length === 0 ? (
                <p className="text-[#737373] text-sm">No pending memorialization requests.</p>
              ) : (
                <ul className="space-y-3">
                  {pendingMemorials.map((r) => (
                    <li key={r.id} className="rounded-xl border border-[#2f2f2f] bg-[#121212] p-3">
                      <div className="text-white text-sm font-medium">Subject @{r.subjectUsername}</div>
                      <div className="text-[#a8a8a8] text-xs mt-1">
                        From @{r.requester?.username || '?'} · {r.relationship}
                      </div>
                      <p className="text-[#737373] text-xs mt-2 line-clamp-4">{r.details}</p>
                      <div className="flex gap-2 mt-3">
                        <button
                          type="button"
                          disabled={busyId === r.id}
                          onClick={() => void decideMemorial(r.id, 'APPROVED')}
                          className="flex-1 py-2 rounded-lg bg-[#0095f6] text-white text-xs font-semibold disabled:opacity-50"
                        >
                          Approve (memorialize)
                        </button>
                        <button
                          type="button"
                          disabled={busyId === r.id}
                          onClick={() => void decideMemorial(r.id, 'REJECTED')}
                          className="flex-1 py-2 rounded-lg border border-[#363636] text-white text-xs font-semibold disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}

          {!loading && tab === 'claims' && !forbidden && (
            <>
              {pendingClaims.length === 0 ? (
                <p className="text-[#737373] text-sm">No pending profile claims.</p>
              ) : (
                <ul className="space-y-3">
                  {pendingClaims.map((r) => (
                    <li key={r.id} className="rounded-xl border border-[#2f2f2f] bg-[#121212] p-3">
                      <div className="text-white text-sm font-medium">Target @{r.targetUsername}</div>
                      <div className="text-[#a8a8a8] text-xs mt-1">From @{r.requester?.username || '?'}</div>
                      <p className="text-[#737373] text-xs mt-2 line-clamp-4">{r.justification}</p>
                      <div className="flex gap-2 mt-3">
                        <button
                          type="button"
                          disabled={busyId === r.id}
                          onClick={() => void decideClaim(r.id, 'APPROVED')}
                          className="flex-1 py-2 rounded-lg bg-[#0095f6] text-white text-xs font-semibold disabled:opacity-50"
                        >
                          Approve (manual follow-up)
                        </button>
                        <button
                          type="button"
                          disabled={busyId === r.id}
                          onClick={() => void decideClaim(r.id, 'REJECTED')}
                          className="flex-1 py-2 rounded-lg border border-[#363636] text-white text-xs font-semibold disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      </MobileShell>
    </ThemedView>
  );
}
