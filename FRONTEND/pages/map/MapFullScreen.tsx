import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ThemedView } from '../../components/ui/Themed';
import { MobileShell } from '../../components/layout/MobileShell';
import { MapPin, X, Locate } from 'lucide-react';
import LeafletMap from '../../components/map/LeafletMap';

const DEFAULT_CENTER: [number, number] = [37.7749, -122.4194];

export default function MapFullScreen() {
  const [center, setCenter] = useState<[number, number]>(DEFAULT_CENTER);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLocate = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setCenter([pos.coords.latitude, pos.coords.longitude]),
      () => {}
    );
  };

  return (
    <ThemedView className="min-h-screen flex flex-col bg-black">
      <MobileShell>
        <header className="absolute top-0 left-0 right-0 z-[1000] flex items-center justify-between h-12 px-3 safe-area-pt bg-black/80 backdrop-blur-sm border-b border-[#262626]">
          <span className="text-white font-semibold">MOxE Map</span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleLocate}
              className="p-2 rounded-full text-white hover:bg-white/10"
              aria-label="Use my location"
            >
              <Locate className="w-5 h-5" />
            </button>
            <Link to="/map" className="p-2 rounded-full text-white hover:bg-white/10" aria-label="Close">
              <X className="w-5 h-5" />
            </Link>
          </div>
        </header>
        <div className="flex-1 min-h-0 pt-12">
          {mounted ? (
            <LeafletMap
              key={center.join(',')}
              center={center}
              zoom={14}
              showMarker={true}
              className="w-full h-full min-h-[calc(100vh-3rem)] rounded-none"
            />
          ) : (
            <div className="flex-1 flex items-center justify-center bg-[#1a1a1a]">
              <div className="text-center">
                <MapPin className="w-16 h-16 text-[#737373] mx-auto mb-3" />
                <p className="text-white font-medium">Loading map…</p>
              </div>
            </div>
          )}
        </div>
      </MobileShell>
    </ThemedView>
  );
}
