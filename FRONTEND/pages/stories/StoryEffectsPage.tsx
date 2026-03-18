import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bookmark, Sparkles } from 'lucide-react';
import { ThemedView, ThemedText } from '../../components/ui/Themed';
import { MobileShell } from '../../components/layout/MobileShell';

const EFFECT_CATEGORIES = ['Trending', 'Appearance', 'Aesthetic', 'Gaming'];
const EFFECTS = [
  { id: 'none', name: 'No effect', selected: true },
  { id: '1', name: 'Filter B1' },
  { id: '2', name: 'Download !' },
  { id: '3', name: 'Fresh Beauty' },
  { id: '4', name: 'Pastel' },
  { id: '5', name: 'SHABY' },
  { id: '6', name: 'Film burn III' },
  { id: '7', name: 'preset A4' },
  { id: '8', name: 'Jack' },
];

/**
 * Select an effect – same for all accounts.
 * Camera preview top, "Select an effect" text. Bottom sheet: handle, Search, bookmark, tabs, effect grid.
 */
export default function StoryEffectsPage() {
  const navigate = useNavigate();
  const [category, setCategory] = useState(0);
  const [selectedId, setSelectedId] = useState('none');

  return (
    <ThemedView className="min-h-screen flex flex-col bg-black">
      <div className="w-full max-w-[428px] h-full flex flex-col mx-auto">
        {/* Camera preview area */}
        <div className="flex-1 flex flex-col items-center justify-center bg-[#0a0a0a] min-h-[40vh]">
          <p className="text-[#737373] text-sm mt-2">Select an effect</p>
        </div>

        {/* Bottom sheet: effects */}
        <div className="bg-[#1c1c1e] rounded-t-2xl border-t border-[#262626] flex flex-col max-h-[60vh]">
          <div className="pt-2 pb-1">
            <div className="w-8 h-0.5 rounded-full bg-white/30 mx-auto" />
          </div>
          <div className="flex items-center gap-3 px-4 py-2">
            <button type="button" className="p-2 text-white">
              <Search className="w-5 h-5" />
            </button>
            <button type="button" className="p-2 text-white">
              <Bookmark className="w-5 h-5" />
            </button>
            <button type="button" className="flex items-center gap-1.5 text-white font-semibold text-sm border-b-2 border-[#0095f6] pb-1">
              <Sparkles className="w-4 h-4" />
              Create
            </button>
            {EFFECT_CATEGORIES.map((cat, i) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(i)}
                className={`text-sm font-medium ${category === i ? 'text-white' : 'text-[#737373]'}`}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-auto px-4 pb-6">
            <div className="grid grid-cols-4 gap-3 py-2">
              {EFFECTS.map((eff) => (
                <button
                  key={eff.id}
                  type="button"
                  onClick={() => setSelectedId(eff.id)}
                  className={`flex flex-col items-center gap-1 p-2 rounded-xl ${selectedId === eff.id ? 'ring-2 ring-[#0095f6]' : ''}`}
                >
                  <div className="w-16 h-16 rounded-full bg-[#262626] border-2 border-[#363636] flex items-center justify-center overflow-hidden">
                    {eff.id === 'none' ? (
                      <span className="text-[#737373] text-xl">∅</span>
                    ) : (
                      <div className="w-full h-full bg-[#363636]" />
                    )}
                  </div>
                  <span className="text-white text-[10px] text-center truncate w-full">{eff.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </ThemedView>
  );
}
