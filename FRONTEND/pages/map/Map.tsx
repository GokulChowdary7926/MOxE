import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ThemedView } from '../../components/ui/Themed';
import { MobileShell } from '../../components/layout/MobileShell';
import { MoxePageHeader } from '../../components/layout/MoxePageHeader';
import { MapPin, MapPinned, Radio, AlertTriangle, Bell, UserPlus, Maximize2, Locate } from 'lucide-react';
import LeafletMap from '../../components/map/LeafletMap';
import { MapLocationSearch, type MapPlaceResult } from '../../components/map/MapLocationSearch';
import { getApiBase, getToken } from '../../services/api';

const DEFAULT_CENTER: [number, number] = [37.7749, -122.4194];

/**
 * Map tab – unified screen for all account types (Personal, Creator, Business, Job).
 * Integrates: MOxE Map, Nearby Places, Nearby Messaging, SOS, Proximity Alert.
 */
export default function Map() {
  const [center, setCenter] = useState<[number, number]>(DEFAULT_CENTER);
  const [mounted, setMounted] = useState(false);
  const [networkScope, setNetworkScope] = useState<'followers' | 'following' | 'friends' | 'close_friends'>('followers');
  const [networkMarkers, setNetworkMarkers] = useState<{ position: [number, number]; label: string }[]>([]);
  const [tagMarkers, setTagMarkers] = useState<{ position: [number, number]; label: string }[]>([]);
  const flyRevision = useRef(0);
  const [flyTo, setFlyTo] = useState<{ lat: number; lng: number; zoom?: number; revision: number } | null>(null);
  const [searchPin, setSearchPin] = useState<{ position: [number, number]; label: string } | null>(null);

  const goToPlace = (p: MapPlaceResult) => {
    flyRevision.current += 1;
    setCenter([p.latitude, p.longitude]);
    setSearchPin({
      position: [p.latitude, p.longitude],
      label: p.displayName,
    });
    setFlyTo({
      lat: p.latitude,
      lng: p.longitude,
      zoom: 16,
      revision: flyRevision.current,
    });
  };

  const goToMyLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        flyRevision.current += 1;
        setCenter([lat, lng]);
        setSearchPin({
          position: [lat, lng],
          label: `Your location · ${lat.toFixed(5)}, ${lng.toFixed(5)}`,
        });
        setFlyTo({ lat, lng, zoom: 16, revision: flyRevision.current });
      },
      () => {},
      { enableHighAccuracy: true, timeout: 15000 },
    );
  };

  useEffect(() => {
    setMounted(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setCenter([pos.coords.latitude, pos.coords.longitude]),
        () => {}
      );
    }
  }, []);

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    fetch(`${getApiBase()}/location/network?scope=${encodeURIComponent(networkScope)}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : { locations: [] }))
      .then((data) => {
        const locations = Array.isArray(data?.locations) ? data.locations : [];
        setNetworkMarkers(
          locations.map((l: any) => ({
            position: [Number(l.latitude), Number(l.longitude)] as [number, number],
            label: l.displayName || l.username || 'User',
          })),
        );
      })
      .catch(() => setNetworkMarkers([]));
  }, [networkScope]);

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    fetch(`${getApiBase()}/location/network-tags?scope=${encodeURIComponent(networkScope)}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : { tags: [] }))
      .then((data) => {
        const tags = Array.isArray(data?.tags) ? data.tags : [];
        setTagMarkers(
          tags.map((t: any) => ({
            position: [Number(t.latitude), Number(t.longitude)] as [number, number],
            label: `${t.displayName || t.username} · ${t.source === 'story' ? 'Story' : 'Post'} · ${t.location}`,
          })),
        );
      })
      .catch(() => setTagMarkers([]));
  }, [networkScope]);

  return (
    <ThemedView className="min-h-screen flex flex-col bg-black pb-24">
      <MobileShell>
        <MoxePageHeader title="Map" left={<div className="w-10" />} />

        <div className="flex-1 overflow-auto px-4 py-4">
          {/* MOxE Map (Leaflet preview) */}
          <div className="rounded-xl bg-[#262626] border border-[#363636] overflow-hidden mb-4">
            <div className="px-4 py-3 border-b border-[#363636] space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <MapPin className="w-5 h-5 text-[#a855f7] shrink-0" />
                  <span className="text-white font-semibold">MOxE Map</span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={goToMyLocation}
                    className="p-2 rounded-full text-white hover:bg-white/10"
                    aria-label="Center on my location"
                  >
                    <Locate className="w-4 h-4" />
                  </button>
                  <Link to="/map/full" className="flex items-center gap-1 text-[#a8a8a8] text-sm font-medium px-2 py-1 rounded-lg hover:bg-white/5">
                    <Maximize2 className="w-4 h-4" />
                    Full screen
                  </Link>
                </div>
              </div>
              <MapLocationSearch biasCenter={center} onSelect={goToPlace} />
            </div>
            <div className="relative aspect-[4/3] bg-[#1a1a1a]">
              {mounted ? (
                <LeafletMap
                  center={center}
                  zoom={14}
                  showMarker={false}
                  className="w-full h-full"
                  markers={[
                    ...networkMarkers,
                    ...tagMarkers,
                    ...(searchPin ? [searchPin] : []),
                  ]}
                  flyTo={flyTo ?? undefined}
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <MapPin className="w-12 h-12 text-[#737373]" />
                </div>
              )}
            </div>
          </div>

          <div className="rounded-xl bg-[#262626] border border-[#363636] p-4 mb-4">
            <p className="text-white font-semibold mb-2">Network locations</p>
            <p className="text-[#a8a8a8] text-sm mb-3">Show live map locations for followers/following/friends/close friends.</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'followers', label: 'Followers' },
                { id: 'following', label: 'Following' },
                { id: 'friends', label: 'Friends' },
                { id: 'close_friends', label: 'Close Friends' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setNetworkScope(opt.id as 'followers' | 'following' | 'friends' | 'close_friends')}
                  className={`px-3 py-2 rounded-lg text-sm border ${
                    networkScope === opt.id
                      ? 'bg-[#a855f7] text-white border-[#a855f7]'
                      : 'bg-[#1f1f1f] text-[#a8a8a8] border-[#363636]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Nearby Places */}
          <div className="rounded-xl bg-[#262626] border border-[#363636] p-4 mb-4">
            <div className="flex items-center gap-2 mb-1">
              <MapPinned className="w-5 h-5 text-[#a855f7]" />
              <span className="text-white font-semibold">Nearby Places</span>
            </div>
            <p className="text-[#a8a8a8] text-sm mb-3">Points of interest near you – businesses, landmarks, and more.</p>
            <Link to="/map/places" className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#a855f7] text-white font-semibold">
              <MapPinned className="w-4 h-4" />
              Browse Nearby Places
            </Link>
          </div>

          {/* Nearby Messaging */}
          <div className="rounded-xl bg-[#262626] border border-[#363636] p-4 mb-4">
            <div className="flex items-center gap-2 mb-1">
              <Radio className="w-5 h-5 text-[#a855f7]" />
              <span className="text-white font-semibold">Nearby Messaging</span>
            </div>
            <p className="text-[#a8a8a8] text-sm mb-3">Send messages to users nearby your location.</p>
            <Link to="/map/nearby-messaging" className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#a855f7] text-white font-semibold">
              <Radio className="w-4 h-4" />
              Open Nearby Messaging
            </Link>
          </div>

          {/* SOS Emergency */}
          <div className="rounded-xl bg-[#262626] border border-[#363636] p-4 mb-4">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <span className="text-white font-semibold">SOS Emergency</span>
            </div>
            <p className="text-[#a8a8a8] text-sm mb-3">Access full SOS features including voice activation, safety timer, and emergency contacts.</p>
            <Link to="/map/sos" className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-red-600 text-white font-semibold mb-2">
              <AlertTriangle className="w-4 h-4" />
              Open SOS Emergency
            </Link>
          </div>

          {/* Proximity Alerts */}
          <div className="rounded-xl bg-[#262626] border border-[#363636] p-4 mb-4">
            <div className="flex items-center gap-2 mb-1">
              <Bell className="w-5 h-5 text-[#a855f7]" />
              <span className="text-white font-semibold">Proximity Alerts</span>
            </div>
            <p className="text-[#a8a8a8] text-sm mb-3">Get notified when selected contacts are nearby.</p>
            <div className="flex flex-col items-center justify-center py-4 text-[#737373] mb-3">
              <UserPlus className="w-10 h-10 mb-2 opacity-60" />
              <span className="text-white text-sm">No trusted contacts yet</span>
            </div>
            <Link to="/map/proximity-alerts" className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#a855f7] text-white font-semibold">
              + Add Username
            </Link>
          </div>
        </div>
      </MobileShell>
    </ThemedView>
  );
}
