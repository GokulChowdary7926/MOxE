import React, { useCallback, useEffect, useState } from 'react';
import { SettingsPageShell } from '../../components/layout/SettingsPageShell';
import { Smartphone, Monitor } from 'lucide-react';
import { getApiBase, getToken } from '../../services/api';
import { readApiError } from '../../utils/readApiError';
import toast from 'react-hot-toast';

type SessionRow = {
  id: string;
  deviceName: string | null;
  deviceType: string | null;
  location: string | null;
  ipAddress: string | null;
  lastActive: string;
  createdAt: string;
};

function relTime(iso: string): string {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  return `${days}d ago`;
}

export default function WhereLoggedInPage() {
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revoking, setRevoking] = useState<string | null>(null);

  const load = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setSessions([]);
      setError('Sign in to see where you’re logged in.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${getApiBase()}/auth/sessions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        setSessions([]);
        setError(await readApiError(res).catch(() => 'Could not load sessions'));
        return;
      }
      const data = (await res.json()) as { sessions?: SessionRow[] };
      setSessions(Array.isArray(data.sessions) ? data.sessions : []);
    } catch (e: unknown) {
      setSessions([]);
      setError(e instanceof Error ? e.message : 'Could not load sessions');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const revoke = async (sessionId: string) => {
    const token = getToken();
    if (!token) return;
    setRevoking(sessionId);
    try {
      const res = await fetch(`${getApiBase()}/auth/sessions/${encodeURIComponent(sessionId)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setSessions((prev) => prev.filter((s) => s.id !== sessionId));
        toast.success('Signed out that device');
      } else toast.error(await readApiError(res).catch(() => 'Could not sign out'));
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Could not sign out');
    } finally {
      setRevoking(null);
    }
  };

  return (
    <SettingsPageShell title="Where you're logged in" backTo="/settings/account-centre">
      <div className="px-4 py-4">
        <p className="text-[#a8a8a8] text-sm mb-4">
          You’re logged in to MOxE on these devices. Log out any you don’t recognise.
        </p>
        {loading && <p className="text-[#737373] text-sm">Loading…</p>}
        {error && !loading && <p className="text-[#a8a8a8] text-sm mb-4">{error}</p>}
        {!loading && !error && sessions.length === 0 && (
          <p className="text-[#737373] text-sm">
            No saved device sessions yet. Sessions are recorded when you use email/username login with a refresh
            token. Google or JWT-only flows may not appear here until you sign in that way.
          </p>
        )}
        {!loading && sessions.length > 0 && (
          <div className="space-y-0 border border-[#262626] rounded-xl overflow-hidden">
            {sessions.map((s, idx) => {
              const mobile = (s.deviceType || '').toLowerCase().includes('mobile');
              const Icon = mobile ? Smartphone : Monitor;
              const deviceLabel = s.deviceName || s.deviceType || 'Unknown device';
              const loc = s.location || s.ipAddress || 'Location unknown';
              const recent = idx === 0;
              return (
                <div
                  key={s.id}
                  className="flex items-center justify-between px-4 py-3 border-b border-[#262626] last:border-b-0 bg-[#0a0a0a]"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-[#262626] flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-[#a8a8a8]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-white font-medium text-sm truncate">{deviceLabel}</p>
                      <p className="text-[#737373] text-xs">
                        {loc}
                        {recent ? ' · Most recent' : ''} · {relTime(s.lastActive)}
                      </p>
                    </div>
                  </div>
                  {!recent && (
                    <button
                      type="button"
                      className="text-[#ed4956] text-sm font-semibold shrink-0 disabled:opacity-40"
                      disabled={revoking === s.id}
                      onClick={() => void revoke(s.id)}
                    >
                      {revoking === s.id ? '…' : 'Log out'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </SettingsPageShell>
  );
}
