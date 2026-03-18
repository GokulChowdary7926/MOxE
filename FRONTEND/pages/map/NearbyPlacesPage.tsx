import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { SettingsPageShell } from '../../components/layout/SettingsPageShell';
import { MapPin } from 'lucide-react';
import { mockPlaces } from '../../mocks/places';
import LeafletMap from '../../components/map/LeafletMap';

const MAP_CENTER: [number, number] = [37.7749, -122.4194];

export default function NearbyPlacesPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const mapMarkers = mockPlaces
    .filter((p) => p.coords)
    .map((p) => ({ position: p.coords!, label: p.name }));

  return (
    <SettingsPageShell title="Nearby Places" backTo="/map">
      <div className="px-4 py-4">
        <p className="text-[#a8a8a8] text-sm mb-4">Points of interest near you – businesses, landmarks, and more.</p>
        {mounted && (
          <div className="rounded-xl overflow-hidden border border-[#363636] h-48 mb-4">
            <LeafletMap center={MAP_CENTER} zoom={14} markers={mapMarkers} className="w-full h-full min-h-[12rem]" />
          </div>
        )}
        <div className="space-y-2">
          {mockPlaces.map((place) => (
            <div
              key={place.id}
              className="flex items-center gap-3 p-3 rounded-xl bg-[#262626] border border-[#363636]"
            >
              <div className="w-12 h-12 rounded-lg bg-[#363636] overflow-hidden flex-shrink-0">
                {place.imageUrl ? <img src={place.imageUrl} alt="" className="w-full h-full object-cover" /> : null}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium truncate">{place.name}</p>
                <p className="text-[#a8a8a8] text-sm">{place.distanceKm.toFixed(1)} km · {place.rating} · {place.category}</p>
              </div>
              <button type="button" className="text-[#0095f6] text-sm font-semibold flex-shrink-0">Directions</button>
            </div>
          ))}
        </div>
      </div>
    </SettingsPageShell>
  );
}
