import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ThemedView } from '../../components/ui/Themed';
import { MobileShell } from '../../components/layout/MobileShell';
import { MapPin, MapPinned, Radio, AlertTriangle, Bell, UserPlus, Maximize2 } from 'lucide-react';
import LeafletMap from '../../components/map/LeafletMap';

const DEFAULT_CENTER: [number, number] = [37.7749, -122.4194];

/**
 * Map tab – unified screen for all account types (Personal, Creator, Business, Job).
 * Integrates: MOxE Map, Nearby Places, Nearby Messaging, SOS, Proximity Alert.
 */
export default function Map() {
  const [center, setCenter] = useState<[number, number]>(DEFAULT_CENTER);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setCenter([pos.coords.latitude, pos.coords.longitude]),
        () => {}
      );
    }
  }, []);

  return (
    <ThemedView className="min-h-screen flex flex-col bg-black pb-24">
      <MobileShell>
        <header className="sticky top-0 z-10 flex items-center justify-between h-12 px-3 border-b border-[#262626] bg-black safe-area-pt">
          <span className="text-white font-semibold">Map</span>
          <div className="w-10" />
        </header>

        <div className="flex-1 overflow-auto px-4 py-4">
          {/* MOxE Map (Leaflet preview) */}
          <div className="rounded-xl bg-[#262626] border border-[#363636] overflow-hidden mb-4">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#363636]">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-[#a855f7]" />
                <span className="text-white font-semibold">MOxE Map</span>
              </div>
              <Link to="/map/full" className="flex items-center gap-1 text-[#a8a8a8] text-sm font-medium">
                <Maximize2 className="w-4 h-4" />
                Tap to view full screen
              </Link>
            </div>
            <div className="relative aspect-[4/3] bg-[#1a1a1a]">
              {mounted ? (
                <LeafletMap
                  center={center}
                  zoom={14}
                  showMarker={true}
                  className="w-full h-full"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <MapPin className="w-12 h-12 text-[#737373]" />
                </div>
              )}
              <Link
                to="/map/full"
                className="absolute inset-0"
                aria-label="Open full screen map"
              />
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
            <Link to="/map/sos" className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#363636] text-white font-medium text-sm">
              Test SOS System
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
              + Add Trusted Contact
            </Link>
          </div>
        </div>
      </MobileShell>
    </ThemedView>
  );
}
