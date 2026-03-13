import React, { useEffect, useState } from 'react';
import { MapPin, Radio, AlertTriangle, Bell, UserPlus, Maximize2, Search, MapPinned } from 'lucide-react';
import { ThemedView, ThemedText, ThemedHeader, ThemedButton } from '../../components/ui/Themed';
import { useNavigate } from 'react-router-dom';
import { mockPlaces } from '../../mocks/places';
import { mockUsers } from '../../mocks/users';
import { getApiBase, getToken } from '../../services/api';
import { mockProximityAlerts } from '../../mocks/proximityAlerts';

export default function Map() {
  const [proximityAlerts, setProximityAlerts] = useState<any[]>([]);
  const [alertsLoading, setAlertsLoading] = useState(true);
  const [alertsError, setAlertsError] = useState<string | null>(null);
  const [sosStatus, setSosStatus] = useState<string | null>(null);
  const [sosError, setSosError] = useState<string | null>(null);
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const [nearbyError, setNearbyError] = useState<string | null>(null);
  const [nearbyResults, setNearbyResults] = useState<any[]>([]);
  const [nearbyEnabled, setNearbyEnabled] = useState(false);
  const [nearbyRadius, setNearbyRadius] = useState<number>(1000);
  const [activeTab, setActiveTab] = useState<'nearby' | 'people' | 'alerts'>('nearby');
  const [sosConfirmOpen, setSosConfirmOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    async function loadAlerts() {
      try {
        const token = getToken();
        if (token) {
          const res = await fetch(`${getApiBase()}/proximity-alerts`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await res.json().catch(() => ({}));
          if (res.ok && !cancelled) {
            const alerts = data.alerts || [];
            if (alerts.length > 0) {
              setProximityAlerts(alerts);
              setAlertsLoading(false);
              return;
            }
          }
        }
        // No token or empty/failed: use mocks so Alerts tab is populated.
        if (!cancelled) {
          const mockAlerts = mockProximityAlerts.map((a) => ({
            id: a.id,
            targetUserId: a.targetUserId,
            targetAccount: mockUsers.find((u) => u.id === a.targetUserId) ?? null,
            targetUsername: mockUsers.find((u) => u.id === a.targetUserId)?.username,
            radiusMeters: a.radiusKm * 1000,
            cooldownMinutes: a.cooldownMinutes,
            isActive: a.isActive,
          }));
          setProximityAlerts(mockAlerts);
        }
      } catch (e: any) {
        if (!cancelled) {
          setAlertsError(e.message || 'Failed to load proximity alerts.');
          const mockAlerts = mockProximityAlerts.map((a) => ({
            id: a.id,
            targetAccount: mockUsers.find((u) => u.id === a.targetUserId) ?? null,
            targetUsername: mockUsers.find((u) => u.id === a.targetUserId)?.username,
            radiusMeters: a.radiusKm * 1000,
            cooldownMinutes: a.cooldownMinutes,
            isActive: a.isActive,
          }));
          setProximityAlerts(mockAlerts);
        }
      } finally {
        if (!cancelled) setAlertsLoading(false);
      }
    }
    loadAlerts();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    let cancelled = false;
    async function loadPrefs() {
      try {
        const res = await fetch(`${getApiBase()}/location/preferences`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || cancelled) return;
        if (typeof data.nearbyEnabled === 'boolean') {
          setNearbyEnabled(data.nearbyEnabled);
        }
      } catch {
        // ignore
      }
    }
    loadPrefs();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    let timer: number | undefined;
    if (nearbyEnabled && navigator.geolocation) {
      const tick = () => {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            try {
              const { latitude, longitude, accuracy } = pos.coords;
              await fetch(`${getApiBase()}/location`, {
                method: 'POST',
                headers: {
                  Authorization: `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ latitude, longitude, accuracy }),
              }).catch(() => {});
              const res = await fetch(
                `${getApiBase()}/location/nearby?latitude=${encodeURIComponent(
                  latitude,
                )}&longitude=${encodeURIComponent(longitude)}&radius=${nearbyRadius}`,
                {
                  headers: { Authorization: `Bearer ${token}` },
                },
              );
              const data = await res.json().catch(() => ({}));
              if (res.ok) {
                setNearbyResults(data.accounts ?? []);
                setNearbyError(null);
              }
            } catch {
              // ignore transient errors
            }
          },
          () => {},
          { enableHighAccuracy: false, maximumAge: 60_000, timeout: 10_000 },
        );
      };
      tick();
      timer = window.setInterval(tick, 60_000);
    }
    return () => {
      if (timer) window.clearInterval(timer);
    };
  }, [nearbyEnabled, nearbyRadius]);

  const triggerSOS = async () => {
    try {
      setSosError(null);
      setSosStatus('Triggering SOS…');
      const token = getToken();
      if (!token) {
        setSosError('Login required to use SOS.');
        setSosStatus(null);
        return;
      }
      const res = await fetch(`${getApiBase()}/safety/sos`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Failed to trigger SOS.');
      }
      setSosStatus('SOS sent to your emergency contacts.');
    } catch (e: any) {
      setSosError(e.message || 'Failed to trigger SOS.');
      setSosStatus(null);
    }
  };

  const findNearby = async () => {
    setNearbyError(null);
    setNearbyResults([]);
    try {
      const token = getToken();
      if (!token) {
        setNearbyError('Login required to use nearby messaging.');
        return;
      }
      if (!navigator.geolocation) {
        setNearbyError('Geolocation is not available in this browser.');
        return;
      }
      setNearbyLoading(true);
      await new Promise<void>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            try {
              const { latitude, longitude, accuracy } = pos.coords;
              // 1) Update location
              await fetch(`${getApiBase()}/location`, {
                method: 'POST',
                headers: {
                  Authorization: `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ latitude, longitude, accuracy }),
              }).catch(() => {});
              // 2) Query nearby accounts
              const res = await fetch(
                `${getApiBase()}/location/nearby?latitude=${encodeURIComponent(
                  latitude,
                )}&longitude=${encodeURIComponent(longitude)}&radius=${nearbyRadius}`,
                {
                  headers: { Authorization: `Bearer ${token}` },
                },
              );
              const data = await res.json().catch(() => ({}));
              if (!res.ok) {
                throw new Error(data.error || 'Failed to load nearby people.');
              }
              setNearbyResults(data.accounts ?? []);
              resolve();
            } catch (e: any) {
              setNearbyError(e.message || 'Failed to load nearby people.');
              reject(e);
            } finally {
              setNearbyLoading(false);
            }
          },
          (err) => {
            setNearbyError(err.message || 'Could not access your location.');
            setNearbyLoading(false);
            reject(err);
          },
          { enableHighAccuracy: false, maximumAge: 60_000, timeout: 15_000 },
        );
      });
    } catch {
      // error already handled
    }
  };

  return (
    <ThemedView className="min-h-screen flex flex-col pb-24">
      <ThemedHeader title="Map" />
      <div className="flex-1 flex flex-col overflow-auto">
        {/* Unified Map tab: MOxE Map, Nearby Places, Nearby Messaging, SOS, Proximity Alerts */}
        {/* Top: search + MOxE Map */}
        <div className="px-moxe-md pt-moxe-md">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-moxe-textSecondary" />
            <input
              type="text"
              placeholder="Search places, users, hashtags..."
              className="w-full pl-9 pr-4 py-2.5 rounded-moxe-md bg-moxe-surface border border-moxe-border text-moxe-body text-moxe-text placeholder:text-moxe-textSecondary focus:outline-none focus:ring-1 focus:ring-moxe-primary"
            />
          </div>
        </div>
        <div className="px-moxe-md">
          <div className="rounded-moxe-md overflow-hidden bg-moxe-surface border border-moxe-border">
            <div className="flex items-center justify-between px-moxe-md py-2 border-b border-moxe-border">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-moxe-primary" />
                <ThemedText className="font-semibold text-moxe-text">MOxE Map</ThemedText>
              </div>
              <button
                type="button"
                className="flex items-center gap-1 text-moxe-caption text-moxe-textSecondary active:opacity-80"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Tap to view full screen</span>
              </button>
            </div>
            <div className="aspect-[4/3] bg-moxe-background/80 flex items-center justify-center relative border-b border-moxe-border">
              <div className="w-12 h-12 rounded-moxe-md bg-moxe-surface flex items-center justify-center">
                <MapPin className="w-6 h-6 text-moxe-textSecondary" />
          </div>
          <button
            type="button"
                onClick={() => setSosConfirmOpen(true)}
                className="absolute bottom-3 left-3 flex items-center justify-center w-12 h-12 rounded-full bg-moxe-danger text-white shadow-lg active:opacity-90 z-10"
                aria-label="SOS Emergency"
          >
                <AlertTriangle className="w-6 h-6" />
          </button>
            </div>
          </div>
        </div>

        {/* Unified Map: Nearby Places – points of interest (businesses, landmarks) */}
        <div className="px-moxe-md mt-3">
          <div className="rounded-xl bg-moxe-surface border border-moxe-border overflow-hidden p-4">
            <div className="flex items-center gap-2 mb-1">
              <MapPinned className="w-5 h-5 text-moxe-primary" />
              <ThemedText className="font-semibold text-moxe-text">Nearby Places</ThemedText>
            </div>
            <ThemedText secondary className="text-moxe-body block mb-3">
              Points of interest near you – businesses, landmarks, and more.
            </ThemedText>
            <button
              type="button"
              onClick={() => setActiveTab('nearby')}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-moxe-primary text-white text-moxe-body font-semibold"
            >
              <MapPinned className="w-4 h-4" />
              Browse Nearby Places
            </button>
          </div>
        </div>

        {/* Unified Map: Nearby Messaging – discover and message nearby users */}
        <div className="px-moxe-md mt-3">
          <div className="rounded-xl bg-moxe-surface border border-moxe-border overflow-hidden p-4">
            <div className="flex items-center gap-2 mb-1">
              <Radio className="w-5 h-5 text-moxe-primary" />
              <ThemedText className="font-semibold text-moxe-text">Nearby Messaging</ThemedText>
            </div>
            <ThemedText secondary className="text-moxe-body block mb-3">
            Send messages to users nearby your location.
            </ThemedText>
          <button
            type="button"
              onClick={() => setActiveTab('people')}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-moxe-primary text-white text-moxe-body font-semibold"
          >
              <Radio className="w-4 h-4" />
            Open Nearby Messaging
          </button>
          </div>
        </div>

        {/* Reference layout: SOS Emergency card */}
        <div className="px-moxe-md mt-3">
          <div className="rounded-xl bg-moxe-surface border border-moxe-border overflow-hidden p-4">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="w-5 h-5 text-moxe-danger" />
              <ThemedText className="font-semibold text-moxe-text">SOS Emergency</ThemedText>
          </div>
            <ThemedText secondary className="text-moxe-body block mb-3">
            Access full SOS features including voice activation, safety timer, and emergency contacts.
            </ThemedText>
          <button
            type="button"
              onClick={() => setSosConfirmOpen(true)}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-moxe-danger text-white text-moxe-body font-semibold mb-2"
          >
              <AlertTriangle className="w-4 h-4" />
            Open SOS Emergency
          </button>
          <button
            type="button"
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-moxe-background border border-moxe-border text-moxe-text text-moxe-body font-medium"
          >
            Test SOS System
          </button>
          </div>
        </div>

        {/* Reference layout: Proximity Alerts card */}
        <div className="px-moxe-md mt-3">
          <div className="rounded-xl bg-moxe-surface border border-moxe-border overflow-hidden p-4">
            <div className="flex items-center gap-2 mb-1">
              <Bell className="w-5 h-5 text-moxe-primary" />
              <ThemedText className="font-semibold text-moxe-text">Proximity Alerts</ThemedText>
            </div>
            <ThemedText secondary className="text-moxe-body block mb-3">
              Your private list of contacts for proximity alerts (up to 5 people).
            </ThemedText>
            {proximityAlerts.length === 0 && (
              <div className="flex flex-col items-center justify-center py-4 text-moxe-textSecondary mb-3">
                <UserPlus className="w-10 h-10 mb-2 opacity-60" />
                <span className="text-moxe-body">No trusted contacts yet</span>
              </div>
            )}
            <button
              type="button"
              onClick={() => setActiveTab('alerts')}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-moxe-primary text-white text-moxe-body font-semibold"
            >
              + Add Trusted Contact
            </button>
          </div>
        </div>
        {/* SOS confirmation modal */}
        {sosConfirmOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70" onClick={() => setSosConfirmOpen(false)}>
            <div className="bg-moxe-surface border border-moxe-border rounded-xl p-4 max-w-sm w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
              <ThemedText className="font-semibold text-moxe-body mb-2">Send SOS?</ThemedText>
              <ThemedText secondary className="text-moxe-caption mb-4 block">
                Your location will be sent to your emergency contacts. Only use in a real emergency.
              </ThemedText>
              <div className="flex gap-2">
                <button type="button" onClick={() => setSosConfirmOpen(false)} className="flex-1 py-2 rounded-moxe-md border border-moxe-border text-moxe-text text-moxe-body">Cancel</button>
                <button type="button" onClick={() => { setSosConfirmOpen(false); triggerSOS(); }} className="flex-1 py-2 rounded-moxe-md bg-moxe-danger text-white text-moxe-body font-medium">Send SOS</button>
              </div>
            </div>
          </div>
        )}

        {/* Bottom sheet: tabs for Nearby / SOS / Alerts */}
        <div className="mt-3 flex-1 rounded-t-[18px] bg-moxe-surface border-t border-moxe-border px-moxe-md pt-2 pb-4">
          <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-moxe-border" />
          {/* Instagram Map doc: bottom sheet tabs [Nearby] [People] [Alerts] */}
          <div className="flex items-center justify-between mb-3 text-[12px]">
            <button
              type="button"
              onClick={() => setActiveTab('nearby')}
              className={`flex-1 py-2 text-center rounded-full mx-0.5 ${
                activeTab === 'nearby'
                  ? 'bg-moxe-primary text-white'
                  : 'bg-moxe-background text-moxe-textSecondary'
              }`}
            >
              Nearby
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('people')}
              className={`flex-1 py-2 text-center rounded-full mx-0.5 ${
                activeTab === 'people'
                  ? 'bg-moxe-primary text-white'
                  : 'bg-moxe-background text-moxe-textSecondary'
              }`}
            >
              People
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('alerts')}
              className={`flex-1 py-2 text-center rounded-full mx-0.5 ${
                activeTab === 'alerts'
                  ? 'bg-moxe-primary text-white'
                  : 'bg-moxe-background text-moxe-textSecondary'
              }`}
            >
              Alerts
            </button>
          </div>

          <div className="mt-1 space-y-3 overflow-auto">
            {activeTab === 'nearby' && (
              <div className="rounded-moxe-md overflow-hidden bg-moxe-surface border border-moxe-border p-moxe-md">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="w-5 h-5 text-moxe-primary" />
                  <ThemedText className="font-semibold">Nearby Places</ThemedText>
                </div>
                <ThemedText secondary className="text-moxe-body block mb-3">
                  Browse businesses, landmarks, and points of interest near you.
                </ThemedText>
                <div className="space-y-2 max-h-56 overflow-auto">
                  {mockPlaces.map((place) => (
                    <div
                      key={place.id}
                      className="flex items-center gap-3 py-2 border-b border-moxe-border last:border-b-0"
                    >
                      <div className="w-12 h-12 rounded-moxe-md bg-moxe-background overflow-hidden flex-shrink-0">
                        {place.imageUrl ? (
                          <img src={place.imageUrl} alt="" className="w-full h-full object-cover" />
                        ) : null}
                      </div>
                      <div className="flex-1 min-w-0">
                        <ThemedText className="font-medium text-moxe-body truncate">{place.name}</ThemedText>
                        <ThemedText secondary className="text-moxe-caption">
                          {place.distanceKm.toFixed(1)} km · {place.rating} · {place.category}
                        </ThemedText>
                      </div>
                      <button
                        type="button"
                        className="text-moxe-primary text-moxe-caption font-semibold flex-shrink-0"
                      >
                        Directions
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'people' && (
              <div className="rounded-moxe-md overflow-hidden bg-moxe-surface border border-moxe-border p-moxe-md">
                <div className="flex items-center gap-2 mb-2">
                  <Radio className="w-5 h-5 text-moxe-primary" />
                  <ThemedText className="font-semibold">Nearby People</ThemedText>
                </div>
                <ThemedText secondary className="text-moxe-body mb-4 block">
                  Discover people within a selected radius. Turn on Nearby mode to keep your location updated while you have Map open.
                </ThemedText>
                <div className="flex items-center justify-between mb-3 text-[11px]">
                  <div className="flex items-center gap-2">
                    <span className="text-moxe-caption">Nearby mode</span>
                    <button
                      type="button"
                      onClick={async () => {
                        const token = getToken();
                        if (!token) {
                          setNearbyError('Login required to use nearby messaging.');
                          return;
                        }
                        const next = !nearbyEnabled;
                        setNearbyEnabled(next);
                        try {
                          await fetch(`${getApiBase()}/location/preferences`, {
                            method: 'PATCH',
                            headers: {
                              Authorization: `Bearer ${token}`,
                              'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({ nearbyEnabled: next }),
                          });
                        } catch {
                          // ignore
                        }
                      }}
                      className={`px-2 py-0.5 rounded-full border text-[11px] ${
                        nearbyEnabled
                          ? 'bg-moxe-primary border-moxe-primary text-white'
                          : 'bg-moxe-surface border-moxe-border text-moxe-textSecondary'
                      }`}
                    >
                      {nearbyEnabled ? 'On' : 'Off'}
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-moxe-caption">Radius</span>
                    <select
                      value={nearbyRadius}
                      onChange={(e) => setNearbyRadius(Number(e.target.value))}
                      className="bg-moxe-surface border border-moxe-border rounded-moxe-md px-2 py-1"
                    >
                      <option value={500}>0.5 km</option>
                      <option value={1000}>1 km</option>
                      <option value={2000}>2 km</option>
                      <option value={5000}>5 km</option>
                    </select>
                  </div>
                </div>
                <ThemedButton
                  label={nearbyLoading ? 'Searching…' : 'Find nearby people'}
                  onClick={findNearby}
                  disabled={nearbyLoading}
                  className="w-full justify-center mb-2"
                />
                {nearbyError && (
                  <ThemedText className="text-moxe-caption text-moxe-danger mb-1">
                    {nearbyError}
                  </ThemedText>
                )}
                {(!nearbyLoading && nearbyResults.length > 0) ? (
                  <div className="max-h-40 overflow-auto space-y-1 text-moxe-body text-moxe-textSecondary">
                    {nearbyResults.map((n) => (
                      <button
                        key={n.accountId}
                        type="button"
                        onClick={() => navigate(`/messages/${encodeURIComponent(n.accountId)}`)}
                        className="w-full flex items-center justify-between py-1 text-left"
                      >
                        <span>
                          @{n.username}
                          {n.displayName ? ` · ${n.displayName}` : ''}
                        </span>
                        <span className="text-[11px]">
                          {(n.distanceMeters / 1000).toFixed(1)} km · Message
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  /* Fallback: show mock users so People tab is always populated */
                  <div className="max-h-40 overflow-auto space-y-2">
                    {mockUsers.slice(0, 5).map((u, i) => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => navigate(`/messages/${encodeURIComponent(u.id)}`)}
                        className="w-full flex items-center justify-between py-2 text-left border-b border-moxe-border last:border-b-0"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <img
                            src={u.avatarUrl}
                            alt=""
                            className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="text-moxe-body font-medium truncate">{u.username}</p>
                            <p className="text-moxe-caption text-moxe-textSecondary truncate">{u.displayName}</p>
                          </div>
                        </div>
                        <span className="text-moxe-caption text-moxe-primary font-medium flex-shrink-0 ml-2">
                          Message
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'alerts' && (
              <div className="rounded-moxe-md overflow-hidden bg-moxe-surface border border-moxe-border p-moxe-md">
                <div className="flex items-center gap-2 mb-2">
                  <Bell className="w-5 h-5 text-moxe-primary" />
                  <ThemedText className="font-semibold">Proximity Alerts</ThemedText>
                </div>
                <ThemedText secondary className="text-moxe-body mb-4 block">
                  Your private list of contacts for proximity alerts (up to 5 people). We’ll notify you when you’re within range.
                </ThemedText>
                {alertsLoading && (
                  <ThemedText secondary className="text-moxe-caption mb-2 block">
                    Loading proximity alerts…
                  </ThemedText>
                )}
                {alertsError && !alertsLoading && (
                  <ThemedText className="text-moxe-caption text-moxe-danger mb-2 block">
                    {alertsError}
                  </ThemedText>
                )}
                {!alertsLoading && !alertsError && proximityAlerts.length === 0 && (
                  <div className="flex items-center gap-2 text-moxe-textSecondary text-moxe-body mb-4">
            <UserPlus className="w-5 h-5" />
            <span>No trusted contacts yet</span>
          </div>
                )}
                {!alertsLoading &&
                  !alertsError &&
                  proximityAlerts.map((a) => (
                    <div key={a.id} className="flex items-center justify-between mb-2 text-moxe-body">
                      <span className="text-moxe-textSecondary">
                        Alert for{' '}
                        <span className="text-moxe-text font-medium">
                          @{a.targetAccount?.username ?? a.targetUsername}
                        </span>{' '}
                        within {(a.radiusMeters ?? 500) / 1000}km · cooldown {a.cooldownMinutes ?? 30}m
                      </span>
                      <div className="flex items-center gap-2 text-[11px]">
                        <button
                          type="button"
                          onClick={async () => {
                            const token = getToken();
                            if (!token) return;
                            const nextActive = !a.isActive;
                            try {
                              const res = await fetch(
                                `${getApiBase()}/proximity-alerts/${encodeURIComponent(a.id)}`,
                                {
                                  method: 'PATCH',
                                  headers: {
                                    Authorization: `Bearer ${token}`,
                                    'Content-Type': 'application/json',
                                  },
                                  body: JSON.stringify({ isActive: nextActive }),
                                },
                              );
                              const data = await res.json().catch(() => ({}));
                              if (!res.ok) return;
                              setProximityAlerts((prev) =>
                                prev.map((p) => (p.id === a.id ? { ...p, isActive: data.isActive } : p)),
                              );
                            } catch {
                              // ignore
                            }
                          }}
                          className="px-2 py-0.5 rounded-full border border-moxe-border bg-moxe-surface text-moxe-textSecondary"
                        >
                          {a.isActive ? 'Pause' : 'Resume'}
                        </button>
          <button
            type="button"
                          onClick={async () => {
                            const token = getToken();
                            if (!token) return;
                            try {
                              const res = await fetch(
                                `${getApiBase()}/proximity-alerts/${encodeURIComponent(a.id)}`,
                                {
                                  method: 'DELETE',
                                  headers: { Authorization: `Bearer ${token}` },
                                },
                              );
                              if (!res.ok) return;
                              setProximityAlerts((prev) => prev.filter((p) => p.id !== a.id));
                            } catch {
                              // ignore
                            }
                          }}
                          className="px-2 py-0.5 rounded-full border border-moxe-border bg-moxe-surface text-moxe-danger"
                        >
                          Delete
          </button>
                      </div>
                    </div>
                  ))}
                <form
                  className="mt-3 space-y-2"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const form = e.target as HTMLFormElement;
                    const usernameInput = form.elements.namedItem('targetUsername') as HTMLInputElement | null;
                    const radiusInput = form.elements.namedItem('radius') as HTMLSelectElement | null;
                    const cooldownInput = form.elements.namedItem('cooldown') as HTMLSelectElement | null;
                    const username = usernameInput?.value.trim();
                    if (!username) return;
                    const token = getToken();
                    if (!token) return;
                    try {
                      const lookupRes = await fetch(
                        `${getApiBase()}/accounts/username/${encodeURIComponent(username)}`,
                        { headers: { Authorization: `Bearer ${token}` } },
                      );
                      const lookup = await lookupRes.json().catch(() => ({}));
                      if (!lookupRes.ok || !lookup.id) {
                        setAlertsError('Could not find that account.');
                        return;
                      }
                      const radius = Number(radiusInput?.value || 500);
                      const cooldownMinutes = Number(cooldownInput?.value || 30);
                      const res = await fetch(`${getApiBase()}/proximity-alerts`, {
                        method: 'POST',
                        headers: {
                          Authorization: `Bearer ${token}`,
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                          targetAccountId: lookup.id,
                          radiusMeters: radius,
                          cooldownMinutes,
                        }),
                      });
                      const data = await res.json().catch(() => ({}));
                      if (!res.ok) {
                        setAlertsError(data.error || 'Failed to create alert.');
                        return;
                      }
                      setProximityAlerts((prev) => [data, ...prev]);
                      if (usernameInput) usernameInput.value = '';
                    } catch (e: any) {
                      setAlertsError(e.message || 'Failed to create alert.');
                    }
                  }}
                >
                  <div className="flex flex-col gap-2 mb-2">
                    <input
                      name="targetUsername"
                      type="text"
                      placeholder="@username to track"
                      className="px-3 py-1.5 rounded-moxe-md bg-moxe-surface border border-moxe-border text-[13px] text-moxe-text placeholder:text-moxe-textSecondary"
                    />
                    <div className="flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-1">
                        <span className="text-moxe-caption">Radius</span>
                        <select
                          name="radius"
                          defaultValue={500}
                          className="bg-moxe-surface border border-moxe-border rounded-moxe-md px-2 py-1"
                        >
                          <option value={100}>100 m</option>
                          <option value={500}>500 m</option>
                          <option value={1000}>1 km</option>
                          <option value={2000}>2 km</option>
                        </select>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-moxe-caption">Cooldown</span>
                        <select
                          name="cooldown"
                          defaultValue={30}
                          className="bg-moxe-surface border border-moxe-border rounded-moxe-md px-2 py-1"
                        >
                          <option value={5}>5 min</option>
                          <option value={30}>30 min</option>
                          <option value={60}>1 hour</option>
                          <option value={180}>3 hours</option>
                          <option value={720}>12 hours</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  <ThemedButton
                    type="submit"
                    label="Add trusted contact"
                    className="w-full justify-center mt-1"
                  />
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </ThemedView>
  );
}
