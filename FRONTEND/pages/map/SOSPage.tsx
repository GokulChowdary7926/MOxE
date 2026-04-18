import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ThemedView, ThemedText } from '../../components/ui/Themed';
import { MobileShell } from '../../components/layout/MobileShell';
import { Mic, Bell, CheckCircle, Settings, MapPin } from 'lucide-react';
import { getApiBase, getToken } from '../../services/api';
import LeafletMap from '../../components/map/LeafletMap';
import { fetchNearbySafePlaces, openDirections, type NearbyPlace } from '../../utils/nearbyPlaces';
import { MoxePageHeader } from '../../components/layout/MoxePageHeader';
import { canUseBrowserGeolocation } from '../../utils/browserFeatures';

const DEFAULT_CENTER: [number, number] = [37.7749, -122.4194];
const PRIMARY_KEYWORDS = ['HELP', 'EMERGENCY', 'SOS', 'SAVE ME'];
const SECONDARY_KEYWORDS = ['DANGER', 'ASSISTANCE', 'RESCUE', 'CALL POLICE'];

export default function SOSPage() {
  const navigate = useNavigate();
  const [protectionActive, setProtectionActive] = useState(false);
  const [voiceDetection, setVoiceDetection] = useState(true);
  const [backgroundOp, setBackgroundOp] = useState(true);
  const [autoCheckin, setAutoCheckin] = useState(true);
  const [darkTheme, setDarkTheme] = useState(true);
  const [vibrationAlerts, setVibrationAlerts] = useState(true);
  const [userCoords, setUserCoords] = useState<[number, number] | null>(null);
  const [safePlaces, setSafePlaces] = useState<NearbyPlace[]>([]);
  const [safePlacesLoading, setSafePlacesLoading] = useState(false);
  const [gpsAccuracy, setGpsAccuracy] = useState<string>('—');
  const [emergencySending, setEmergencySending] = useState(false);
  const [directionTo, setDirectionTo] = useState<NearbyPlace | null>(null);
  const mapMounted = useRef(false);

  const recognitionRef = useRef<any>(null);
  const shouldListenRef = useRef(false);
  const emergencyTriggeredRef = useRef(false);
  const keywordHitsRef = useRef<{ keyword: string; at: number }[]>([]);
  const hangoutSessionIdRef = useRef<string | null>(null);

  const [speechStatus, setSpeechStatus] = useState<'idle' | 'listening' | 'stopped' | 'unsupported'>('idle');

  useEffect(() => {
    if (!canUseBrowserGeolocation() || !navigator.geolocation) return;
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        setUserCoords([pos.coords.latitude, pos.coords.longitude]);
        const acc = pos.coords.accuracy;
        setGpsAccuracy(acc != null ? `${Math.round(acc)}m` : '—');
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    );
    return () => navigator.geolocation.clearWatch(id);
  }, []);

  useEffect(() => {
    if (!userCoords) return;
    setSafePlacesLoading(true);
    fetchNearbySafePlaces(userCoords[0], userCoords[1], 5)
      .then(setSafePlaces)
      .finally(() => setSafePlacesLoading(false));
  }, [userCoords?.[0], userCoords?.[1]]);

  const handleEmergencyAlert = async (): Promise<boolean> => {
    const token = getToken();
    if (!token) {
      alert('Please log in to send an emergency alert.');
      return false;
    }
    setEmergencySending(true);
    let ok = false;
    try {
      let lat: number | undefined;
      let lng: number | undefined;
      if (userCoords) {
        [lat, lng] = userCoords;
      } else if (canUseBrowserGeolocation()) {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 10000 });
        });
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
      }
      const res = await fetch(`${getApiBase()}/safety/sos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ latitude: lat, longitude: lng }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        ok = true;
        alert(`Emergency alert sent. ${data.notifiedCount ?? 0} contact(s) notified.`);
      } else {
        if (typeof data?.error === 'string' && data.error.toLowerCase().includes('no emergency contacts')) {
          const openContacts = window.confirm('No emergency contacts found. Open Manage Contacts now?');
          if (openContacts) navigate('/map/sos/contacts');
        }
        alert(data.error || 'Failed to send emergency alert.');
      }
    } catch (e: any) {
      alert(e?.message || 'Failed to send emergency alert.');
    } finally {
      setEmergencySending(false);
    }
    return ok;
  };

  const handlePlaceDirections = (place: NearbyPlace) => {
    if (userCoords) {
      setDirectionTo(place);
    } else {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}`, '_blank');
    }
  };

  const mapCenter = userCoords ?? DEFAULT_CENTER;
  const safeMarkers = safePlaces.slice(0, 15).map((p) => ({ position: [p.lat, p.lng] as [number, number], label: p.name }));

  const startHangoutSession = async () => {
    const token = getToken();
    if (!token) return;
    try {
      const res = await fetch(`${getApiBase()}/safety/hangout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          checkInInterval: 5,
          durationMinutes: 30,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.sessionId) hangoutSessionIdRef.current = data.sessionId;
    } catch {
      // ignore hangout failures; SOS still works without it.
    }
  };

  const endHangoutSession = async () => {
    const token = getToken();
    const sessionId = hangoutSessionIdRef.current;
    if (!token || !sessionId) return;
    try {
      await fetch(`${getApiBase()}/safety/hangout/end`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ sessionId }),
      });
    } catch {
      // ignore
    } finally {
      hangoutSessionIdRef.current = null;
    }
  };

  const stopSpeechRecognition = () => {
    shouldListenRef.current = false;
    try {
      recognitionRef.current?.stop?.();
    } catch {
      // ignore
    }
    setSpeechStatus('stopped');
  };

  const startSpeechRecognition = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechStatus('unsupported');
      return;
    }
    shouldListenRef.current = true;

    // Stop any existing instance first.
    try {
      recognitionRef.current?.stop?.();
    } catch {
      // ignore
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => setSpeechStatus('listening');
    recognition.onend = () => {
      // Some browsers end recognition unexpectedly; if still protected, restart.
      if (shouldListenRef.current && protectionActive && voiceDetection) {
        try {
          recognition.start();
        } catch {
          // ignore
        }
      }
    };

    recognition.onerror = () => {
      // Keep UI stable; user can retry by toggling protection.
      setSpeechStatus('stopped');
    };

    recognition.onresult = (event: any) => {
      if (!shouldListenRef.current) return;
      try {
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (!result?.isFinal) continue;

          const transcriptRaw = (result?.[0]?.transcript ?? '').toString();
          const confidence = typeof result?.[0]?.confidence === 'number' ? result[0].confidence : 1;
          if (confidence < 0.8) continue; // High confidence required.

          const normalized = transcriptRaw
            .toUpperCase()
            .replace(/[^A-Z0-9 ]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();

          if (!normalized) continue;

          const primaryHits = PRIMARY_KEYWORDS.filter((k) => normalized.includes(k));
          if (primaryHits.length > 0) {
            if (emergencyTriggeredRef.current) return;
            emergencyTriggeredRef.current = true;
            void (async () => {
              const ok = await handleEmergencyAlert();
              if (ok) setProtectionActive(false);
            })();
            return;
          }

          const secondaryHits = SECONDARY_KEYWORDS.filter((k) => normalized.includes(k));
          if (secondaryHits.length > 0) {
            const now = Date.now();
            keywordHitsRef.current = [
              ...keywordHitsRef.current,
              ...secondaryHits.map((keyword) => ({ keyword, at: now })),
            ].filter((h) => now - h.at <= 3000);

            const distinct = new Set(keywordHitsRef.current.map((h) => h.keyword));
            if (distinct.size >= 2) {
              if (emergencyTriggeredRef.current) return;
              emergencyTriggeredRef.current = true;
              void (async () => {
                const ok = await handleEmergencyAlert();
                if (ok) setProtectionActive(false);
              })();
            }
          }
        }
      } catch {
        // ignore speech parsing errors
      }
    };

    try {
      recognition.start();
    } catch {
      // ignore
      setSpeechStatus('stopped');
    }
  };

  useEffect(() => {
    // Reset trigger + keyword state whenever protection toggles.
    emergencyTriggeredRef.current = false;
    keywordHitsRef.current = [];

    if (protectionActive) {
      if (backgroundOp) void startHangoutSession();
      if (voiceDetection) startSpeechRecognition();
      else {
        shouldListenRef.current = false;
        setSpeechStatus('idle');
      }
    } else {
      stopSpeechRecognition();
      if (backgroundOp) void endHangoutSession();
    }

    return () => {
      // cleanup on unmount / dependency change
      try {
        recognitionRef.current?.stop?.();
      } catch {
        // ignore
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [protectionActive, voiceDetection]);

  return (
    <ThemedView className="min-h-screen flex flex-col bg-black pb-24">
      <MobileShell>
        <MoxePageHeader
          title="Protection Mode"
          backTo="/map"
        />

        <div className="flex-1 overflow-auto px-4 py-6">
          {/* Map & your location */}
          <div className="rounded-xl overflow-hidden border border-[#363636] h-48 mb-4">
            <LeafletMap
              center={mapCenter}
              zoom={14}
              className="w-full h-full min-h-[12rem]"
              showUserLocation={true}
              onUserLocation={(lat, lng) => {
                if (!mapMounted.current) setUserCoords([lat, lng]);
                mapMounted.current = true;
              }}
              markers={safeMarkers}
              routeFrom={directionTo && userCoords ? userCoords : undefined}
              routeTo={directionTo ? [directionTo.lat, directionTo.lng] : undefined}
            />
          </div>
          {directionTo && (
            <div className="flex items-center justify-between gap-2 mb-4 px-3 py-2 rounded-lg bg-[#262626] border border-[#363636]">
              <span className="text-[#a8a8a8] text-sm truncate">Route to {directionTo.name}</span>
              <div className="flex gap-2 flex-shrink-0">
                <button type="button" onClick={() => setDirectionTo(null)} className="text-white text-sm font-medium">Clear</button>
                <button
                  type="button"
                  onClick={() => userCoords && openDirections(userCoords[0], userCoords[1], directionTo.lat, directionTo.lng, directionTo.name)}
                  className="text-[#0095f6] text-sm font-medium"
                >
                  Open in Google Maps
                </button>
              </div>
            </div>
          )}

          {/* Status */}
          <div className="rounded-xl bg-[#262626] border border-[#363636] p-4 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <Mic className="w-5 h-5 text-[#737373]" />
              <span className="text-white font-bold">Protection Mode: {protectionActive ? 'ACTIVE' : 'INACTIVE'}</span>
            </div>
            <div className="space-y-1 text-sm">
              <p className="text-[#a8a8a8] flex items-center gap-2">
                <span className="text-emerald-500">●</span> GPS: {userCoords ? 'Active' : 'Getting location…'} | Accuracy: {gpsAccuracy}
              </p>
              <p className="text-[#a8a8a8] flex items-center gap-2">
                <span className="text-emerald-500">●</span> Speech Recognition: {speechStatus}
              </p>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              {['HELP', 'EMERGENCY', 'SOS', 'SAVE ME'].map((label) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => {
                    if (emergencyTriggeredRef.current) return;
                    emergencyTriggeredRef.current = true;
                    void (async () => {
                      const ok = await handleEmergencyAlert();
                      if (ok) setProtectionActive(false);
                    })();
                  }}
                  className="px-3 py-1.5 rounded-lg border-2 border-amber-400 text-amber-400 text-xs font-bold"
                >
                  {label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setProtectionActive(!protectionActive)}
              className="w-full mt-4 py-3 rounded-xl bg-amber-500 text-black font-bold flex items-center justify-center gap-2"
            >
              <span className="w-5 h-5 rounded-full bg-black/20 flex items-center justify-center">▶</span>
              {protectionActive ? 'DEACTIVATE PROTECTION' : 'ACTIVATE PROTECTION'}
            </button>
            <div className="flex gap-2 mt-2">
              <button
                type="button"
                onClick={handleEmergencyAlert}
                disabled={emergencySending}
                className="flex-1 py-2.5 rounded-xl bg-amber-500/80 text-black font-semibold text-sm flex items-center justify-center gap-1 disabled:opacity-60"
              >
                <Bell className="w-4 h-4" /> {emergencySending ? 'Sending…' : 'Emergency Alert'}
              </button>
              <Link to="/map/sos/safe" className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white font-semibold text-sm flex items-center justify-center gap-1">
                <CheckCircle className="w-4 h-4" /> I&apos;m Safe
              </Link>
            </div>
            <Link to="/map/sos/contacts" className="block mt-3 py-2.5 rounded-xl border border-amber-500/50 text-amber-500 font-medium text-sm text-center">Manage emergency contacts</Link>
            <Link to="/map/sos/safety-checkin" className="block mt-2 py-2.5 rounded-xl border border-[#363636] text-white font-medium text-sm text-center">Safety Check-in</Link>
          </div>

          {/* Nearby Safe Places (5km): police, fire, hospital, parks, bus, markets */}
          <div className="rounded-xl bg-[#262626] border border-[#363636] overflow-hidden mb-4">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-[#363636]">
              <MapPin className="w-5 h-5 text-amber-500" />
              <span className="text-white font-semibold">Nearby Safe Places (within 5 km)</span>
            </div>
            <p className="text-[#a8a8a8] text-xs px-4 pb-2">Police, fire stations, hospitals, parks, bus stops, markets. Tap Directions to show route on map.</p>
            {safePlacesLoading ? (
              <div className="px-4 py-6 text-center text-[#a8a8a8] text-sm">Loading places…</div>
            ) : safePlaces.length === 0 ? (
              <div className="px-4 py-6 text-center text-[#a8a8a8] text-sm">No places found. Allow location access.</div>
            ) : (
              <ul className="max-h-64 overflow-y-auto divide-y divide-[#363636]">
                {safePlaces.slice(0, 20).map((place) => (
                  <li key={place.id} className="flex items-center justify-between px-4 py-3">
                    <div>
                      <p className="text-white font-medium">{place.name}</p>
                      <p className="text-[#a8a8a8] text-xs">{place.distanceKm != null ? `${place.distanceKm.toFixed(1)} km · ${place.category}` : place.category}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handlePlaceDirections(place)}
                      className="text-amber-500 text-sm font-semibold"
                    >
                      Directions
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* App Settings */}
          <div className="rounded-xl bg-[#262626] border border-[#363636] overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-[#363636]">
              <Settings className="w-5 h-5 text-[#a8a8a8]" />
              <span className="text-white font-semibold">App Settings</span>
            </div>
            {[
              { label: 'Enable Voice Detection', desc: 'Listen for distress keywords', value: voiceDetection, set: setVoiceDetection },
              { label: 'Enable Background Operation', desc: 'Keep protection active when app is in background', value: backgroundOp, set: setBackgroundOp },
              { label: 'Enable Auto-Checkin Reminders', desc: 'Remind you to check in during long trips', value: autoCheckin, set: setAutoCheckin },
              { label: 'Dark Theme', desc: 'Use dark interface', value: darkTheme, set: setDarkTheme },
              { label: 'Vibration Alerts', desc: 'Vibrate during emergencies', value: vibrationAlerts, set: setVibrationAlerts },
            ].map(({ label, desc, value, set }) => (
              <div key={label} className="flex items-center justify-between px-4 py-3 border-b border-[#363636] last:border-b-0">
                <div>
                  <p className="text-white font-medium">{label}</p>
                  <p className="text-[#a8a8a8] text-sm">{desc}</p>
                </div>
                <button type="button" onClick={() => set(!value)} className={`w-11 h-6 rounded-full ${value ? 'bg-emerald-600' : 'bg-[#363636]'}`}>
                  <span className={`block w-5 h-5 rounded-full bg-white mt-0.5 transition-transform ${value ? 'ml-5' : 'ml-0.5'}`} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </MobileShell>
    </ThemedView>
  );
}
