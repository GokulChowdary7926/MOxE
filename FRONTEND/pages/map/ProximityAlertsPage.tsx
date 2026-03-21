import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { SettingsPageShell } from '../../components/layout/SettingsPageShell';
import { Bell, RefreshCw } from 'lucide-react';
import { getApiBase, getToken } from '../../services/api';

type AlertItem = {
  id: string;
  targetAccount: { id: string; username: string; displayName?: string | null; profilePhoto?: string | null };
  radiusMeters: number;
  cooldownMinutes: number;
  isActive: boolean;
  lastTriggeredAt?: string | null;
};

export default function ProximityAlertsPage() {
  const [username, setUsername] = useState('');
  const [radius, setRadius] = useState(500);
  const [cooldown, setCooldown] = useState(30);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locationSync, setLocationSync] = useState<'idle' | 'syncing' | 'ok' | 'error'>('idle');

  const loadAlerts = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setAlerts([]);
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`${getApiBase()}/proximity-alerts`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setAlerts(Array.isArray(data.alerts) ? data.alerts : []);
      } else {
        setAlerts([]);
      }
    } catch {
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAlerts();
  }, [loadAlerts]);

  useEffect(() => {
    if (!navigator.geolocation) return;
    const token = getToken();
    if (!token) return;
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setLocationSync('syncing');
        fetch(`${getApiBase()}/location`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          }),
        })
          .then(() => setLocationSync('ok'))
          .catch(() => setLocationSync('error'));
      },
      () => setLocationSync('error'),
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 },
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  const handleAdd = async () => {
    const raw = username.trim().replace(/^@/, '');
    if (!raw) {
      setError('Enter a username');
      return;
    }
    const token = getToken();
    if (!token) {
      setError('Please log in');
      return;
    }
    if (alerts.length >= 5) {
      setError('Maximum 5 alerts. Remove one first.');
      return;
    }
    setError(null);
    setAdding(true);
    try {
      const accRes = await fetch(`${getApiBase()}/accounts/username/${encodeURIComponent(raw)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!accRes.ok) {
        const err = await accRes.json().catch(() => ({}));
        setError(err.error || 'User not found. Check the username.');
        return;
      }
      const acc = await accRes.json();
      const targetAccountId = acc.id ?? acc.account?.id;
      if (!targetAccountId) {
        setError('User not found');
        return;
      }
      const res = await fetch(`${getApiBase()}/proximity-alerts`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetAccountId,
          radiusMeters: radius,
          cooldownMinutes: cooldown,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Failed to add alert');
        return;
      }
      setUsername('');
      await loadAlerts();
    } catch (e: any) {
      setError(e?.message || 'Failed to add');
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    const token = getToken();
    if (!token) return;
    if (!window.confirm('Remove this proximity alert?')) return;
    try {
      const res = await fetch(`${getApiBase()}/proximity-alerts/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) await loadAlerts();
    } catch {
      // ignore
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    const token = getToken();
    if (!token) return;
    try {
      const res = await fetch(`${getApiBase()}/proximity-alerts/${id}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive }),
      });
      if (res.ok) await loadAlerts();
    } catch {
      // ignore
    }
  };

  return (
    <SettingsPageShell
      title="Proximity Alerts"
      backTo="/map"
      right={
        <button
          type="button"
          onClick={() => { setLoading(true); loadAlerts(); }}
          className="p-2 text-[#a855f7] rounded-lg hover:bg-white/5"
          aria-label="Refresh alerts"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      }
    >
      <div className="px-4 py-4 space-y-6">
        <div className="flex items-center gap-2 mb-2">
          <Bell className="w-5 h-5 text-[#a855f7]" />
          <span className="text-white font-semibold">Proximity Alerts</span>
        </div>
        <p className="text-[#a8a8a8] text-sm mb-4">Your private list of contacts for proximity alerts (up to 5 people). We&apos;ll notify you when you&apos;re within range.</p>
        <p className="text-[#a8a8a8] text-xs mb-4">
          Location sync: {locationSync === 'ok' ? 'Live' : locationSync === 'syncing' ? 'Updating…' : locationSync === 'error' ? 'Error' : 'Idle'}.
          Alerts trigger only when both you and the tracked user have fresh location updates.
        </p>

        {loading ? (
          <p className="text-[#a8a8a8] text-sm">Loading…</p>
        ) : (
          <>
            {alerts.length > 0 && (
              <div className="space-y-2">
                {alerts.map((a) => (
                  <div key={a.id} className="flex items-center justify-between p-3 rounded-xl bg-[#262626] border border-[#363636]">
                    <p className="text-[#a8a8a8] text-sm">
                      Alert for <span className="text-white font-medium">@{a.targetAccount?.username ?? 'user'}</span> within {(a.radiusMeters / 1000).toFixed(1)} km · cooldown {a.cooldownMinutes >= 60 ? `${(a.cooldownMinutes / 60).toFixed(0)}h` : `${a.cooldownMinutes}m`}
                    </p>
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(a.id, a.isActive)}
                        className="px-2 py-1 rounded-lg bg-[#363636] text-white text-xs font-medium"
                      >
                        {a.isActive ? 'Pause' : 'Resume'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(a.id)}
                        className="px-2 py-1 rounded-lg bg-[#363636] text-red-400 text-xs font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="rounded-xl bg-[#262626] border border-[#363636] p-4">
              <input
                type="text"
                value={username}
                onChange={(e) => { setUsername(e.target.value); setError(null); }}
                placeholder="@username to track"
                className="w-full px-3 py-2.5 rounded-lg bg-[#363636] border border-[#262626] text-white placeholder:text-[#737373] text-sm mb-3"
              />
              {error && <p className="text-red-400 text-xs mb-2">{error}</p>}
              <div className="flex gap-3 mb-3">
                <div className="flex-1">
                  <label className="block text-[#737373] text-xs mb-1">Radius</label>
                  <select value={radius} onChange={(e) => setRadius(Number(e.target.value))} className="w-full px-3 py-2 rounded-lg bg-[#363636] border border-[#262626] text-white text-sm">
                    <option value={100}>100 m</option>
                    <option value={500}>500 m</option>
                    <option value={1000}>1 km</option>
                    <option value={2000}>2 km</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-[#737373] text-xs mb-1">Cooldown</label>
                  <select value={cooldown} onChange={(e) => setCooldown(Number(e.target.value))} className="w-full px-3 py-2 rounded-lg bg-[#363636] border border-[#262626] text-white text-sm">
                    <option value={5}>5 min</option>
                    <option value={30}>30 min</option>
                    <option value={60}>1 hour</option>
                    <option value={120}>2 hours</option>
                    <option value={180}>3 hours</option>
                    <option value={360}>6 hours</option>
                    <option value={720}>12 hours</option>
                    <option value={1440}>24 hours</option>
                  </select>
                </div>
              </div>
              <button
                type="button"
                onClick={handleAdd}
                disabled={adding || alerts.length >= 5}
                className="w-full py-3 rounded-xl bg-[#a855f7] text-white font-bold disabled:opacity-50"
              >
                {adding ? 'Adding…' : 'Add username'}
              </button>
            </div>
          </>
        )}
      </div>
    </SettingsPageShell>
  );
}
