import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { SettingsPageShell } from '../../components/layout/SettingsPageShell';
import { Search, MapPin } from 'lucide-react';
import LeafletMap from '../../components/map/LeafletMap';

const DEFAULT_CENTER: [number, number] = [37.7749, -122.4194];

export default function BoostAddressPage() {
  const navigate = useNavigate();
  const [address, setAddress] = useState('');
  const [markerPos, setMarkerPos] = useState<[number, number]>(DEFAULT_CENTER);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSave = () => {
    navigate(-1);
  };

  return (
    <SettingsPageShell
      title="Address"
      backTo="/boost/location"
      right={
        <button type="button" onClick={handleSave} className="text-[#0095f6] font-medium text-sm">
          Done
        </button>
      }
    >
      <div className="px-4 py-4 space-y-4">
        <p className="text-[#a8a8a8] text-sm">Set a location for your ad audience. You can search or tap on the map.</p>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#737373]" />
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Search address or place"
            className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-[#262626] border border-[#363636] text-white placeholder:text-[#737373] text-sm"
          />
        </div>

        <div className="rounded-xl overflow-hidden border border-[#363636] bg-[#1a1a1a]">
          {mounted ? (
            <LeafletMap
              center={markerPos}
              zoom={14}
              showMarker={true}
              draggableMarker={true}
              clickToSetMarker={true}
              onMarkerMove={(lat, lng) => setMarkerPos([lat, lng])}
              className="w-full h-56 rounded-xl"
            />
          ) : (
            <div className="w-full h-56 flex items-center justify-center text-[#737373]">
              <MapPin className="w-10 h-10" />
            </div>
          )}
        </div>

        <p className="text-[#737373] text-xs">
          Lat: {markerPos[0].toFixed(5)}, Lng: {markerPos[1].toFixed(5)}
        </p>
      </div>
    </SettingsPageShell>
  );
}
