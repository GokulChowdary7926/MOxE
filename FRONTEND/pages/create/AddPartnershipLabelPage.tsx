import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search } from 'lucide-react';
import { ThemedView, ThemedText } from '../../components/ui/Themed';
import { MobileShell } from '../../components/layout/MobileShell';

/**
 * Add paid partnership label page – same for all accounts.
 * Back, title, Next, Cancel. Search bar. Info text. List area for brand partners.
 */
export default function AddPartnershipLabelPage() {
  const navigate = useNavigate();

  return (
    <ThemedView className="min-h-screen flex flex-col bg-black">
      <MobileShell>
        <header className="flex items-center justify-between h-12 px-3 border-b border-[#262626] bg-black safe-area-pt">
          <button type="button" onClick={() => navigate(-1)} className="p-2 -m-2 text-white">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="text-white font-semibold text-base">Add paid partnership label</span>
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => navigate(-1)} className="text-[#0095f6] font-semibold text-sm">
              Next
            </button>
            <button type="button" onClick={() => navigate(-1)} className="text-[#a8a8a8] text-sm">
              Cancel
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-4">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#737373]" />
            <input type="text" placeholder="Search" className="w-full pl-10 pr-4 py-3 rounded-lg bg-[#262626] text-white placeholder:text-[#737373] text-sm border border-[#363636]" />
          </div>
          <p className="text-[#a8a8a8] text-sm leading-relaxed">
            Added brand partners that you have approval from will appear in the paid partnership label on your reel.
          </p>
          <p className="text-[#a8a8a8] text-sm leading-relaxed mt-2">
            Your brand partner will be able to see its insights unless you remove them from the paid partnership label.
          </p>
          <p className="text-[#a8a8a8] text-sm leading-relaxed mt-2">
            Branded content must comply with our <span className="text-[#0095f6]">Branded Content Policies</span>.
          </p>
          <div className="mt-6 min-h-[200px]" />
        </div>
      </MobileShell>
    </ThemedView>
  );
}
