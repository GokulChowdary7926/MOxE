import React, { useState } from 'react';
import { SettingsPageShell } from '../../components/layout/SettingsPageShell';
import { Filter, Play } from 'lucide-react';

const MOCK_ITEMS = [
  { id: '1', caption: 'Every Medico 🧑🏽‍⚕️ after getting first degree in our college.🎓😂', views: 13373, isReel: true },
];

export default function InsightsContentPage() {
  const [contentFilter, setContentFilter] = useState<'all' | 'reels' | 'posts'>('all');
  const [timeFilter, setTimeFilter] = useState('30');

  return (
    <SettingsPageShell title="Content" backTo="/insights">
      <div className="px-4 py-3 flex items-center gap-2 border-b border-[#262626]">
        <button type="button" className={`px-3 py-1.5 rounded-lg text-sm ${contentFilter === 'all' ? 'bg-[#262626] text-white' : 'text-[#a8a8a8]'}`} onClick={() => setContentFilter('all')}>All</button>
        <button type="button" className={`px-3 py-1.5 rounded-lg text-sm ${timeFilter === '30' ? 'bg-[#262626] text-white' : 'text-[#a8a8a8]'}`} onClick={() => setTimeFilter('30')}>Last 30 days</button>
        <button type="button" className="ml-auto p-2 text-[#a8a8a8]" aria-label="Filter"><Filter className="w-5 h-5" /></button>
      </div>
      <div className="px-4 py-4">
        <h2 className="text-white font-bold text-xl mb-4">Views</h2>
        <div className="grid grid-cols-2 gap-3">
          {MOCK_ITEMS.map((item) => (
            <div key={item.id} className="aspect-[9/16] rounded-lg bg-[#262626] overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
              <span className="absolute top-2 right-2 text-white/90 text-xs flex items-center gap-1"><Play className="w-3 h-3" /> Reel</span>
              <p className="absolute left-2 right-2 top-2 text-white text-xs line-clamp-2">{item.caption}</p>
              <p className="absolute bottom-2 left-2 text-white font-semibold text-sm">{item.views.toLocaleString()}</p>
            </div>
          ))}
        </div>
      </div>
    </SettingsPageShell>
  );
}
