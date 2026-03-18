import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ThemedView } from '../../components/ui/Themed';
import { MobileShell } from '../../components/layout/MobileShell';

const MOCK_MEDIA = Array.from({ length: 9 }, (_, i) => ({ id: String(i), duration: '0:13', selected: true }));

export default function EditHighlightPage() {
  const { highlightId } = useParams();
  const [name, setName] = useState('campus.');
  const [tab, setTab] = useState<'selected' | 'stories'>('selected');

  return (
    <ThemedView className="min-h-screen flex flex-col bg-black">
      <MobileShell>
        <header className="sticky top-0 z-10 flex items-center justify-between h-12 px-3 border-b border-[#262626] bg-black safe-area-pt">
          <button type="button" className="text-[#0095f6] font-medium text-sm">Cancel</button>
          <span className="absolute left-1/2 -translate-x-1/2 text-white font-semibold">Edit highlight</span>
          <button type="button" className="text-[#0095f6] font-medium text-sm">Done</button>
        </header>

        <div className="flex-1 overflow-auto px-4 py-6">
          <div className="flex flex-col items-center mb-6">
            <div className="w-24 h-24 rounded-full bg-[#262626] overflow-hidden mb-2 bg-gradient-to-br from-green-600 to-blue-500" />
            <button type="button" className="text-[#0095f6] text-sm font-medium">Edit Cover</button>
          </div>

          <div className="mb-4">
            <label className="block text-[#a8a8a8] text-sm mb-1">Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3 py-2.5 rounded-lg bg-[#262626] border border-[#363636] text-white text-sm" />
          </div>

          <div className="flex gap-2 mb-4">
            <button type="button" onClick={() => setTab('selected')} className={`flex-1 py-2 text-sm font-semibold ${tab === 'selected' ? 'text-white border-b-2 border-[#0095f6]' : 'text-[#737373]'}`}>Selected</button>
            <button type="button" onClick={() => setTab('stories')} className={`flex-1 py-2 text-sm font-semibold ${tab === 'stories' ? 'text-white border-b-2 border-[#0095f6]' : 'text-[#737373]'}`}>Stories</button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {MOCK_MEDIA.map((m) => (
              <div key={m.id} className="aspect-square rounded-lg bg-[#262626] overflow-hidden relative">
                <span className="absolute bottom-1 left-1 text-white text-[10px] font-medium">{m.duration}</span>
                {m.selected && <span className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-[#0095f6] flex items-center justify-center text-white text-xs">✓</span>}
              </div>
            ))}
          </div>
        </div>
      </MobileShell>
    </ThemedView>
  );
}
