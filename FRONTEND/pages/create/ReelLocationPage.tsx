import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, MapPin } from 'lucide-react';
import { ThemedView, ThemedText } from '../../components/ui/Themed';
import { MobileShell } from '../../components/layout/MobileShell';

const SUGGESTED_LOCATIONS = [
  { name: 'Latteri, Tamil Nadu, India', detail: '1 km • Katpadi' },
  { name: 'Vellore', detail: '9.1 km • Vellore' },
  { name: 'Chennai, India', detail: 'Chennai' },
  { name: 'Latheri Police Station', detail: '0.3 km • National Highway 234' },
  { name: 'லத்தேரி - Latteri', detail: '2.6 km • Latteri' },
  { name: 'Vellore, Tamilnadu', detail: '9.9 km • Katpadi' },
  { name: 'Katpadi, Vellore', detail: '7.6 km • Katpadi' },
];

/**
 * Locations page for reels – same for all accounts.
 * Choose a location to tag. Search. List. Add location. Preview on map.
 */
export default function ReelLocationPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <ThemedView className="min-h-screen flex flex-col bg-black">
      <MobileShell>
        <header className="flex items-center justify-between h-12 px-3 border-b border-[#262626] bg-black safe-area-pt">
          <button type="button" onClick={() => navigate(-1)} className="p-2 -m-2 text-white" aria-label="Back">
            <Send className="w-5 h-5 rotate-[-45deg]" />
          </button>
          <span className="text-white font-semibold text-base">Locations</span>
          <button type="button" onClick={() => navigate(-1)} className="text-[#a8a8a8] text-sm">
            Cancel
          </button>
        </header>

        <div className="flex-1 overflow-auto pb-24">
          <div className="p-4">
            <p className="text-white font-semibold text-lg mb-1">Choose a location to tag</p>
            <p className="text-[#a8a8a8] text-sm mb-4">
              People that you share this content with can see the location that you tag and view this content on the map.
            </p>
            <div className="relative mb-4">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search"
                className="w-full pl-4 pr-4 py-3 rounded-lg bg-[#262626] text-white placeholder:text-[#737373] text-sm border border-[#363636]"
              />
            </div>
            <ul className="space-y-0 border-t border-[#262626]">
              {SUGGESTED_LOCATIONS.map((loc) => (
                <li key={loc.name}>
                  <button
                    type="button"
                    onClick={() => setSelected(loc.name)}
                    className="w-full flex items-center gap-3 px-0 py-3 border-b border-[#262626] text-left"
                  >
                    <MapPin className="w-5 h-5 text-[#737373] flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="text-white text-sm block">{loc.name}</span>
                      <span className="text-[#737373] text-xs block">{loc.detail}</span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 max-w-[428px] mx-auto p-4 border-t border-[#262626] bg-black safe-area-pb space-y-2">
          <button type="button" className="w-full py-3 rounded-lg bg-[#0095f6] text-white font-semibold text-sm">
            Add location
          </button>
          <button type="button" className="w-full text-[#0095f6] text-sm font-medium">
            Preview on map
          </button>
        </div>
      </MobileShell>
    </ThemedView>
  );
}
