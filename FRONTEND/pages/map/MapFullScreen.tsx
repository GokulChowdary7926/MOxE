import React, { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ThemedView } from '../../components/ui/Themed';
import { MobileShell } from '../../components/layout/MobileShell';
import { MapPin, X, Locate } from 'lucide-react';
import LeafletMap from '../../components/map/LeafletMap';
import { MapLocationSearch, type MapPlaceResult } from '../../components/map/MapLocationSearch';

const DEFAULT_CENTER: [number, number] = [37.7749, -122.4194];

export default function MapFullScreen() {
  const [center, setCenter] = useState<[number, number]>(DEFAULT_CENTER);
  const [mounted, setMounted] = useState(false);
  const flyRevision = useRef(0);
  const [flyTo, setFlyTo] = useState<{ lat: number; lng: number; zoom?: number; revision: number } | null>(null);
  const [searchPin, setSearchPin] = useState<{ position: [number, number]; label: string } | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

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
      zoom: 17,
      revision: flyRevision.current,
    });
  };

  const handleLocate = () => {
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
        setFlyTo({ lat, lng, zoom: 17, revision: flyRevision.current });
      },
      () => {},
      { enableHighAccuracy: true, timeout: 15000 },
    );
  };

  return (
    <ThemedView className="min-h-screen flex flex-col bg-black pb-24">
      <MobileShell>
        <div className="flex flex-col flex-1 min-h-[calc(100vh-4rem)]">
          <header className="shrink-0 flex flex-col gap-2 px-3 py-3 safe-area-pt bg-black border-b border-[#262626] z-[1000]">
            <div className="flex items-center justify-between h-9">
              <span className="text-white font-semibold pl-1">MOxE Map</span>
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
            </div>
            <MapLocationSearch biasCenter={center} onSelect={goToPlace} />
          </header>
          <div className="flex-1 min-h-0 min-h-[60vh] bg-[#1a1a1a]">
            {mounted ? (
              <LeafletMap
                center={center}
                zoom={14}
                showUserLocation={true}
                showMarker={false}
                markers={searchPin ? [searchPin] : []}
                flyTo={flyTo ?? undefined}
                className="w-full h-full min-h-[50vh] rounded-none"
              />
            ) : (
              <div className="w-full h-full min-h-[50vh] flex items-center justify-center">
                <div className="text-center">
                  <MapPin className="w-16 h-16 text-[#737373] mx-auto mb-3" />
                  <p className="text-white font-medium">Loading map…</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </MobileShell>
    </ThemedView>
  );
}
