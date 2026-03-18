import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { SettingsPageShell } from '../../components/layout/SettingsPageShell';
import { Search } from 'lucide-react';
import LeafletMap from '../../components/map/LeafletMap';

const DEFAULT_CENTER: [number, number] = [37.7749, -122.4194];

export default function BoostLocationPage() {
  const [tab, setTab] = useState<'regional' | 'local'>('regional');
  const [search, setSearch] = useState('');
  const [radius, setRadius] = useState(5);
  const [useCurrentLocation, setUseCurrentLocation] = useState(false);
  const [mapMounted, setMapMounted] = useState(false);
  useEffect(() => {
    if (tab === 'local') setMapMounted(true);
  }, [tab]);

  return (
    <SettingsPageShell title="Locations" backTo="/boost/create-audience" right={<button type="button" className="text-[#0095f6] font-medium text-sm">Done</button>}>
      <div className="px-4 py-4">
        <div className="text-center mb-4">
          <p className="text-2xl font-bold text-white">N/A</p>
          <p className="text-[#a8a8a8] text-sm flex items-center justify-center gap-1">Estimated audience size <span className="text-[#737373]">ⓘ</span></p>
        </div>

        <div className="flex gap-2 border-b border-[#262626] mb-4">
          <button type="button" onClick={() => setTab('regional')} className={`flex-1 py-2 text-sm font-semibold ${tab === 'regional' ? 'text-white border-b-2 border-[#0095f6]' : 'text-[#737373]'}`}>Regional</button>
          <button type="button" onClick={() => setTab('local')} className={`flex-1 py-2 text-sm font-semibold ${tab === 'local' ? 'text-white border-b-2 border-[#0095f6]' : 'text-[#737373]'}`}>Local</button>
        </div>

        {tab === 'regional' && (
          <>
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#737373]" />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Add locations" className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-[#262626] border border-[#363636] text-white placeholder:text-[#737373] text-sm" />
            </div>
            <p className="text-[#a8a8a8] text-xs mb-4">Adding a broad range of countries, regions and cities increases the number of people who can see your ad.</p>
          </>
        )}

        {tab === 'local' && (
          <>
            <div className="w-full h-48 rounded-xl overflow-hidden border border-[#363636] mb-4">
              {mapMounted ? (
                <LeafletMap center={DEFAULT_CENTER} zoom={13} showMarker={true} className="w-full h-48 rounded-xl" />
              ) : (
                <div className="w-full h-48 bg-[#262626] flex items-center justify-center text-[#737373] text-sm">Loading map…</div>
              )}
            </div>
            <div className="flex items-center justify-between py-3 border-b border-[#262626]">
              <span className="text-white">Your current location</span>
              <button type="button" onClick={() => setUseCurrentLocation(!useCurrentLocation)} className={`w-11 h-6 rounded-full ${useCurrentLocation ? 'bg-[#0095f6]' : 'bg-[#363636]'}`}>
                <span className={`block w-5 h-5 rounded-full bg-white mt-0.5 transition-transform ${useCurrentLocation ? 'ml-5' : 'ml-0.5'}`} />
              </button>
            </div>
            <Link to="/boost/location/address" className="flex items-center justify-between py-3 border-b border-[#262626] text-white active:bg-white/5">
              <span>Address</span>
              <span className="text-[#737373]">›</span>
            </Link>
            <div className="py-3">
              <p className="text-white font-medium mb-2">Radius</p>
              <input type="range" min={1} max={50} value={radius} onChange={(e) => setRadius(Number(e.target.value))} className="w-full accent-[#0095f6]" />
              <p className="text-[#a8a8a8] text-sm mt-1">{radius} km</p>
            </div>
          </>
        )}
      </div>
    </SettingsPageShell>
  );
}
