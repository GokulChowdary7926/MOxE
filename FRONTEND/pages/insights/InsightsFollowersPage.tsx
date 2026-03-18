import React, { useState } from 'react';
import { SettingsPageShell } from '../../components/layout/SettingsPageShell';
import { Info } from 'lucide-react';

const LOCATIONS = [
  { name: 'Chennai', pct: 37.1 },
  { name: 'Kattankulathur', pct: 13.0 },
  { name: 'Lalgudi', pct: 2.3 },
  { name: 'Bangalore', pct: 2.0 },
  { name: 'Coimbatore', pct: 1.8 },
];

const AGE_RANGES = [
  { range: '13-17', pct: 2.2 },
  { range: '18-24', pct: 57.5 },
  { range: '25-34', pct: 28.8 },
  { range: '35-44', pct: 7.5 },
  { range: '45-54', pct: 2.9 },
  { range: '55-64', pct: 0.7 },
  { range: '65+', pct: 0.2 },
];

const GENDERS = [
  { label: 'Men', pct: 84.8 },
  { label: 'Women', pct: 15.2 },
];

const HOURS = ['12a', '3a', '6a', '9a', '12p', '3p', '6p', '9p'];
const ACTIVE_HEIGHTS = [5, 10, 8, 25, 55, 90, 70, 40]; // mock bar heights

function BarRow({ label, pct }: { label: string; pct: number }) {
  return (
    <div className="flex items-center gap-3 py-2">
      <span className="text-white text-sm w-24 flex-shrink-0">{label}</span>
      <div className="flex-1 h-2 rounded-full bg-[#262626] overflow-hidden">
        <div className="h-full rounded-full bg-pink-500" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[#a8a8a8] text-sm w-12 text-right">{pct}%</span>
    </div>
  );
}

export default function InsightsFollowersPage() {
  const [locationTab, setLocationTab] = useState<'cities' | 'countries'>('cities');
  const [ageTab, setAgeTab] = useState<'all' | 'men' | 'women'>('all');
  const [dayTab, setDayTab] = useState(0); // 0 = Sun, etc.

  return (
    <SettingsPageShell title="Followers" backTo="/insights" right={<button type="button" className="p-1 text-[#a8a8a8]" aria-label="Info"><Info className="w-5 h-5" /></button>}>
      <div className="px-4 py-3 flex items-center justify-between border-b border-[#262626]">
        <button type="button" className="px-3 py-1.5 rounded-lg bg-[#262626] text-white text-sm flex items-center gap-1">
          Last 30 days <span className="text-xs">▼</span>
        </button>
        <span className="text-[#a8a8a8] text-sm">9 Feb - 10 Mar</span>
      </div>

      <div className="px-4 py-4">
        <h2 className="text-white font-semibold mb-3">Top locations</h2>
        <div className="flex gap-2 mb-3">
          {(['cities', 'countries'] as const).map((t) => (
            <button key={t} type="button" onClick={() => setLocationTab(t)} className={`px-3 py-1.5 rounded-lg text-sm ${locationTab === t ? 'bg-[#262626] text-white' : 'text-[#a8a8a8]'}`}>
              {t === 'cities' ? 'Towns/cities' : 'Countries'}
            </button>
          ))}
        </div>
        {locationTab === 'cities' && LOCATIONS.map((loc) => <BarRow key={loc.name} label={loc.name} pct={loc.pct} />)}
      </div>

      <div className="px-4 py-4 border-t border-[#262626]">
        <h2 className="text-white font-semibold mb-3">Age range</h2>
        <div className="flex gap-2 mb-3">
          {(['all', 'men', 'women'] as const).map((t) => (
            <button key={t} type="button" onClick={() => setAgeTab(t)} className={`px-3 py-1.5 rounded-lg text-sm capitalize ${ageTab === t ? 'bg-[#262626] text-white' : 'text-[#a8a8a8]'}`}>
              {t}
            </button>
          ))}
        </div>
        {AGE_RANGES.map((a) => (
          <BarRow key={a.range} label={a.range} pct={a.pct} />
        ))}
      </div>

      <div className="px-4 py-4 border-t border-[#262626]">
        <h2 className="text-white font-semibold mb-3">Gender</h2>
        {GENDERS.map((g) => (
          <BarRow key={g.label} label={g.label} pct={g.pct} />
        ))}
      </div>

      <div className="px-4 py-4 border-t border-[#262626]">
        <h2 className="text-white font-semibold mb-3">Most active times</h2>
        <div className="flex gap-1 mb-4">
          {['Su', 'M', 'Tu', 'W', 'Th', 'F', 'Sa'].map((d, i) => (
            <button key={d} type="button" onClick={() => setDayTab(i)} className={`w-9 h-9 rounded-full text-xs ${dayTab === i ? 'bg-[#262626] text-white' : 'text-[#a8a8a8]'}`}>{d}</button>
          ))}
        </div>
        <div className="flex items-end gap-1 h-24">
          {HOURS.map((h, i) => (
            <div key={h} className="flex-1 flex flex-col items-center">
              <div className="w-full rounded-t bg-pink-500/80" style={{ height: `${ACTIVE_HEIGHTS[i]}%` }} />
              <span className="text-[#737373] text-[10px] mt-1">{h}</span>
            </div>
          ))}
        </div>
      </div>
    </SettingsPageShell>
  );
}
