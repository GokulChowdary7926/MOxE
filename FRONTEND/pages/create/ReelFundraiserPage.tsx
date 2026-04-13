import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { ThemedView, ThemedText } from '../../components/ui/Themed';
import { MobileShell } from '../../components/layout/MobileShell';

/**
 * Fundraiser attach flow — no hardcoded nonprofit list (NBK-032 / product hygiene).
 * Curated directory can be wired to commerce/creator APIs when available.
 */
export default function ReelFundraiserPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [goalUsd, setGoalUsd] = useState('5000');
  const [story, setStory] = useState('');

  const attach = () => {
    if (selectedId === null) {
      toast.error('Choose an option.');
      return;
    }
    if (selectedId === 'custom') {
      const name = query.trim();
      if (!name) {
        toast.error('Enter an organization name, or choose No fundraiser.');
        return;
      }
      toast.success(`Fundraiser “${name}” attached to this reel (draft).`);
      navigate(-1);
      return;
    }
    if (selectedId === 'off') {
      toast.success('No fundraiser on this reel.');
      navigate(-1);
    }
  };

  return (
    <ThemedView className="min-h-screen flex flex-col bg-black pb-24">
      <MobileShell>
        <header className="flex items-center h-12 px-3 border-b border-[#262626] bg-black safe-area-pt">
          <button type="button" onClick={() => navigate(-1)} className="p-2 -m-2 text-white" aria-label="Back">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="flex-1 text-white font-semibold text-base text-center">Add Fundraiser</span>
          <div className="w-10" />
        </header>

        <div className="flex-1 overflow-auto px-4 py-4 space-y-5">
          <ThemedText secondary className="text-sm">
            Raise money for a cause. Donations are processed when checkout is enabled for your account. Nonprofit directory
            search will connect to your platform catalog when available.
          </ThemedText>

          <div>
            <label className="text-[#a8a8a8] text-xs font-semibold uppercase tracking-wide">Organization name</label>
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-[#737373]" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Type a nonprofit or campaign name"
                className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-[#262626] border border-[#363636] text-white text-sm placeholder:text-[#737373] outline-none focus:border-[#0095f6]"
              />
            </div>
          </div>

          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setSelectedId('off')}
              className={`w-full text-left px-4 py-3 rounded-xl border text-sm ${
                selectedId === 'off' ? 'border-[#0095f6] bg-[#0095f6]/15 text-white' : 'border-[#363636] bg-[#121212] text-[#a8a8a8]'
              }`}
            >
              No fundraiser
            </button>
            <button
              type="button"
              onClick={() => setSelectedId('custom')}
              className={`w-full text-left px-4 py-3 rounded-xl border text-sm ${
                selectedId === 'custom' ? 'border-[#0095f6] bg-[#0095f6]/15 text-white' : 'border-[#363636] bg-[#121212] text-[#a8a8a8]'
              }`}
            >
              <span className="block font-semibold text-white">Use name from search</span>
              <span className="text-xs text-[#737373]">Attaches the text you entered above (draft only until checkout is live).</span>
            </button>
          </div>

          <div>
            <label className="text-[#a8a8a8] text-xs font-semibold uppercase tracking-wide">Goal (USD)</label>
            <input
              value={goalUsd}
              onChange={(e) => setGoalUsd(e.target.value.replace(/[^\d]/g, ''))}
              inputMode="numeric"
              className="mt-2 w-full px-3 py-2 rounded-xl bg-[#262626] border border-[#363636] text-white text-sm"
            />
          </div>
          <div>
            <label className="text-[#a8a8a8] text-xs font-semibold uppercase tracking-wide">Story (optional)</label>
            <textarea
              value={story}
              onChange={(e) => setStory(e.target.value.slice(0, 500))}
              rows={4}
              className="mt-2 w-full px-3 py-2 rounded-xl bg-[#262626] border border-[#363636] text-white text-sm resize-none"
            />
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 max-w-[428px] mx-auto p-4 border-t border-[#262626] bg-black safe-area-pb space-y-2">
          <button
            type="button"
            onClick={attach}
            className="w-full py-3 rounded-lg bg-[#0095f6] text-white font-semibold text-sm"
          >
            Done
          </button>
        </div>
      </MobileShell>
    </ThemedView>
  );
}
