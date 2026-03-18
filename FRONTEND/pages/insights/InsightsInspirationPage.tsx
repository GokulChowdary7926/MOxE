import React, { useState } from 'react';
import { SettingsPageShell } from '../../components/layout/SettingsPageShell';
import { Plus, Eye, Bookmark } from 'lucide-react';

const TABS = ['Reels', 'Audio', 'Accounts'] as const;

const MOCK_REELS = [
  { id: '1', username: 'divyas_fitness', caption: 'IS THESE MANGO 🥭 OR ORANGE 🍊', views: '20.8 M', audio: 'Original audio' },
  { id: '2', username: 'creator', caption: 'adrenaline rush', views: '1.2M', audio: 'Original audio' },
];

const MOCK_ACCOUNTS = [
  { username: 'lokesh.r.v', subtitle: 'AI Tools Tamil | Tamil Ai | Ai Tamil', verified: true },
  { username: 'sowmiyaaa.ig', subtitle: 'Sowmiya | Skincare & Makeup', verified: false },
  { username: 'aarthisundar_arts', subtitle: 'Aarthisundar_arts', verified: false },
];

export default function InsightsInspirationPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]>('Reels');

  return (
    <SettingsPageShell title="Inspiration" backTo="/insights" right={<button type="button" className="p-1 text-white" aria-label="Add"><Plus className="w-5 h-5" /></button>}>
      <div className="flex gap-2 px-4 py-3 border-b border-[#262626]">
        {TABS.map((t) => (
          <button key={t} type="button" onClick={() => setTab(t)} className={`px-3 py-1.5 rounded-lg text-sm ${tab === t ? 'bg-white text-black' : 'bg-[#262626] text-white'}`}>{t}</button>
        ))}
      </div>
      <div className="px-4 py-4">
        {tab === 'Reels' && (
          <>
            <h2 className="text-white font-semibold mb-3">Popular with your followers</h2>
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4">
              {MOCK_REELS.map((r) => (
                <div key={r.id} className="flex-shrink-0 w-[200px] aspect-[9/16] rounded-xl bg-[#262626] overflow-hidden relative">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                  <p className="absolute top-2 left-2 right-2 text-white text-xs font-medium line-clamp-2">{r.caption}</p>
                  <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                    <span className="text-white text-xs flex items-center gap-1"><Eye className="w-3 h-3" /> {r.views}</span>
                    <Bookmark className="w-4 h-4 text-white" />
                  </div>
                </div>
              ))}
            </div>
            <h2 className="text-white font-semibold mt-6 mb-3">Suggested for you</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="aspect-[9/16] rounded-xl bg-[#262626]" />
              <div className="aspect-[9/16] rounded-xl bg-[#262626]" />
            </div>
          </>
        )}
        {tab === 'Audio' && (
          <p className="text-[#a8a8a8] text-sm">Browse trending audio for your reels.</p>
        )}
        {tab === 'Accounts' && (
          <>
            <h2 className="text-white font-semibold mb-3">Suggested for you</h2>
            <div className="space-y-2">
              {MOCK_ACCOUNTS.map((acc) => (
                <div key={acc.username} className="flex items-center gap-3 p-3 rounded-xl bg-[#262626]">
                  <div className="w-10 h-10 rounded-full bg-[#363636]" />
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium flex items-center gap-1">{acc.username} {acc.verified && <span className="text-[#0095f6]">✓</span>}</p>
                    <p className="text-[#a8a8a8] text-xs truncate">{acc.subtitle}</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </SettingsPageShell>
  );
}
