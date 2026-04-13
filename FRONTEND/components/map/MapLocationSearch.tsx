import React, { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { getApiBase, getToken } from '../../services/api';

export type MapPlaceResult = {
  id: string;
  name: string;
  displayName: string;
  latitude: number;
  longitude: number;
};

type Props = {
  /** Prefer search results near this point (map center / GPS). */
  biasCenter?: [number, number];
  onSelect: (place: MapPlaceResult) => void;
  className?: string;
  inputClassName?: string;
  placeholder?: string;
};

const DEBOUNCE_MS = 380;

export function MapLocationSearch({
  biasCenter,
  onSelect,
  className = '',
  inputClassName = '',
  placeholder = 'Search places worldwide…',
}: Props) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<MapPlaceResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    const timer = window.setTimeout(async () => {
      try {
        const token = getToken();
        if (!token) {
          if (!cancelled) {
            setResults([]);
            setLoading(false);
          }
          return;
        }
        const u = new URL(`${getApiBase()}/location/search`);
        u.searchParams.set('q', term);
        u.searchParams.set('limit', '8');
        if (biasCenter) {
          u.searchParams.set('latitude', String(biasCenter[0]));
          u.searchParams.set('longitude', String(biasCenter[1]));
        }
        const res = await fetch(u.toString(), { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        const places = (data?.places ?? []) as MapPlaceResult[];
        setResults(Array.isArray(places) ? places : []);
      } catch {
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, DEBOUNCE_MS);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [q, biasCenter?.[0], biasCenter?.[1]]);

  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#737373] pointer-events-none z-10" />
      <input
        type="search"
        autoComplete="off"
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          window.setTimeout(() => setOpen(false), 200);
        }}
        placeholder={placeholder}
        className={`w-full pl-9 pr-3 py-2 rounded-lg bg-[#1a1a1a] border border-[#363636] text-white text-sm placeholder:text-[#737373] ${inputClassName}`}
      />
      {open && (results.length > 0 || loading) && (
        <div className="absolute z-[2000] left-0 right-0 mt-1 max-h-56 overflow-auto rounded-lg border border-[#363636] bg-[#1f1f1f] shadow-xl">
          {loading && results.length === 0 && (
            <div className="px-3 py-2 text-[#a8a8a8] text-xs">Searching…</div>
          )}
          {results.map((p) => (
            <button
              key={p.id}
              type="button"
              className="w-full text-left px-3 py-2 hover:bg-[#2a2a2a] border-b border-[#2a2a2a] last:border-0"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onSelect(p);
                setQ(p.name);
                setOpen(false);
              }}
            >
              <div className="text-white text-sm font-medium">{p.name}</div>
              <div className="text-[#737373] text-xs line-clamp-2">{p.displayName}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
