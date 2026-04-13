import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, MapPin } from 'lucide-react';
import { ThemedView, ThemedText } from '../../components/ui/Themed';
import { MobileShell } from '../../components/layout/MobileShell';
import { fetchApi, getToken } from '../../services/api';

type PlaceRow = { id: string; name: string; detail?: string };

/**
 * Reel location tag — uses `GET /location/search` (distinct post locations); no hardcoded city list.
 */
export default function ReelLocationPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [places, setPlaces] = useState<PlaceRow[]>([]);
  const [loading, setLoading] = useState(false);

  const runSearch = useCallback(async (q: string) => {
    if (!getToken() || q.trim().length < 2) {
      setPlaces([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetchApi(`location/search?q=${encodeURIComponent(q.trim())}&limit=15`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setPlaces([]);
        return;
      }
      const raw = data.places ?? data;
      const list = Array.isArray(raw)
        ? raw.map((p: { id?: string; name?: string }) => ({
            id: String(p.id ?? p.name ?? ''),
            name: String(p.name ?? ''),
            detail: undefined as string | undefined,
          }))
        : [];
      setPlaces(list.filter((p) => p.name));
    } catch {
      setPlaces([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => {
      void runSearch(search);
    }, 320);
    return () => window.clearTimeout(t);
  }, [search, runSearch]);

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
              Results come from locations already used on public posts; type at least 2 characters.
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
            {loading ? (
              <ThemedText secondary className="text-sm py-2">
                Searching…
              </ThemedText>
            ) : null}
            {!loading && search.trim().length >= 2 && places.length === 0 ? (
              <ThemedText secondary className="text-sm py-2">
                No matching locations yet. Try another name or tag a location on a post first.
              </ThemedText>
            ) : null}
            <ul className="space-y-0 border-t border-[#262626]">
              {places.map((loc) => (
                <li key={`${loc.id}-${loc.name}`}>
                  <button
                    type="button"
                    onClick={() => setSelected(loc.name)}
                    className="w-full flex items-center gap-3 px-0 py-3 border-b border-[#262626] text-left"
                  >
                    <MapPin className="w-5 h-5 text-[#737373] flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="text-white text-sm block">{loc.name}</span>
                      {loc.detail ? <span className="text-[#737373] text-xs block">{loc.detail}</span> : null}
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
          {selected ? (
            <p className="text-[#a8a8a8] text-xs text-center truncate" title={selected}>
              Selected: {selected}
            </p>
          ) : null}
        </div>
      </MobileShell>
    </ThemedView>
  );
}
