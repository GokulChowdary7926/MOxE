import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { SettingsPageShell } from '../../components/layout/SettingsPageShell';
import { MapPin } from 'lucide-react';
import LeafletMap from '../../components/map/LeafletMap';
import { fetchNearbyFamousPlaces, openDirections, type NearbyPlace } from '../../utils/nearbyPlaces';

const MAP_CENTER: [number, number] = [37.7749, -122.4194];

export default function NearbyPlacesPage() {
  const [mounted, setMounted] = useState(false);
  const [userCoords, setUserCoords] = useState<[number, number] | null>(null);
  const [manualCenter, setManualCenter] = useState<[number, number] | null>(null);
  const [places, setPlaces] = useState<NearbyPlace[]>([]);
  const [loading, setLoading] = useState(true);
  const [directionTo, setDirectionTo] = useState<NearbyPlace | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted) return;
    if (!navigator.geolocation) {
      setLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setUserCoords([lat, lng]);
        // Places fetch happens in the effect that watches the active center.
      },
      () => setLoading(false),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [mounted]);

  const activeCenter = manualCenter ?? userCoords;
  const mapCenter = activeCenter ?? MAP_CENTER;
  const mapMarkers = places.slice(0, 25).map((p) => ({ position: [p.lat, p.lng] as [number, number], label: p.name }));

  useEffect(() => {
    if (!mounted) return;
    if (!activeCenter) return;
    setLoading(true);
    fetchNearbyFamousPlaces(activeCenter[0], activeCenter[1], 50)
      .then(setPlaces)
      .finally(() => setLoading(false));
  }, [mounted, activeCenter]);

  const handleDirections = (place: NearbyPlace) => {
    if (activeCenter) {
      setDirectionTo(place);
    } else {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}`, '_blank');
    }
  };

  const handleSearchLocation = async () => {
    const q = search.trim();
    if (!q) {
      setManualCenter(null);
      setDirectionTo(null);
      return;
    }

    setLoading(true);
    setDirectionTo(null);
    try {
      // Best-effort geocode using OSM Nominatim.
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=1`,
        { headers: { Accept: 'application/json' } },
      );
      const data = (await res.json().catch(() => [])) as Array<{ lat: string; lon: string }>;
      const first = data?.[0];
      if (!first) {
        setLoading(false);
        return;
      }

      const lat = Number(first.lat);
      const lng = Number(first.lon);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        setLoading(false);
        return;
      }

      setManualCenter([lat, lng]);
    } catch {
      // ignore, UI will keep last results
      setLoading(false);
    }
  };

  return (
    <SettingsPageShell title="Nearby Places" backTo="/map">
      <div className="px-4 py-4">
        <p className="text-[#a8a8a8] text-sm mb-4">Nearby famous places, tourist spots, and attractions within 50 km. Tap Directions to show route on map.</p>
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search location (city, landmark)"
            onKeyDown={(e) => {
              if (e.key === 'Enter') void handleSearchLocation();
            }}
            className="flex-1 px-3 py-2.5 rounded-lg bg-[#262626] border border-[#363636] text-white placeholder:text-[#737373] text-sm"
          />
          <button
            type="button"
            onClick={() => void handleSearchLocation()}
            className="px-3 py-2.5 rounded-lg bg-[#a855f7] text-white text-sm font-semibold"
            aria-label="Search location"
          >
            Search
          </button>
        </div>
        {mounted && (
          <>
            <div className="rounded-xl overflow-hidden border border-[#363636] h-48 mb-2">
              <LeafletMap
                center={mapCenter}
                zoom={activeCenter ? 11 : 10}
                className="w-full h-full min-h-[12rem]"
                showUserLocation={true}
                markers={mapMarkers}
                routeFrom={directionTo && activeCenter ? activeCenter : undefined}
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
                    onClick={() =>
                      activeCenter &&
                      openDirections(activeCenter[0], activeCenter[1], directionTo.lat, directionTo.lng, directionTo.name)
                    }
                    className="text-[#0095f6] text-sm font-medium"
                  >
                    Open in Google Maps
                  </button>
                </div>
              </div>
            )}
          </>
        )}
        {loading ? (
          <p className="text-[#a8a8a8] text-sm">Loading places…</p>
        ) : places.length === 0 ? (
          <p className="text-[#a8a8a8] text-sm">No famous places found. Try another location.</p>
        ) : (
          <div className="space-y-2">
            {places.map((place) => (
              <div
                key={place.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-[#262626] border border-[#363636]"
              >
                <div className="w-12 h-12 rounded-lg bg-[#363636] overflow-hidden flex-shrink-0 flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-[#a855f7]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">{place.name}</p>
                  <p className="text-[#a8a8a8] text-sm">
                    {place.distanceKm != null ? `${place.distanceKm.toFixed(1)} km` : ''} · {place.category}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDirections(place)}
                  className="text-[#0095f6] text-sm font-semibold flex-shrink-0"
                >
                  Directions
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </SettingsPageShell>
  );
}
