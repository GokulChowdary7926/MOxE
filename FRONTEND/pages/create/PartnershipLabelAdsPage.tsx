import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { ThemedView, ThemedText } from '../../components/ui/Themed';
import { MobileShell } from '../../components/layout/MobileShell';

function useCreateBasePath() {
  const { pathname } = useLocation();
  return pathname.startsWith('/create/post') ? '/create/post' : '/create/reel';
}

/**
 * Partnership label and ads page – same for reels/posts and all accounts.
 * Branded content > Add paid partnership label.
 * Partnership ad permissions > Get partnership ad code (toggle).
 */
export default function PartnershipLabelAdsPage() {
  const navigate = useNavigate();
  const base = useCreateBasePath();
  const [adCode, setAdCode] = useState(false);

  return (
    <ThemedView className="min-h-screen flex flex-col bg-black">
      <MobileShell>
        <header className="flex items-center justify-between h-12 px-3 border-b border-[#262626] bg-black safe-area-pt">
          <button type="button" onClick={() => navigate(-1)} className="p-2 -m-2 text-white">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="text-white font-semibold text-base">Partnership label and ads</span>
          <button type="button" onClick={() => navigate(-1)} className="text-[#0095f6] font-semibold text-sm">
            Done
          </button>
        </header>

        <div className="flex-1 overflow-auto pb-20">
          <p className="text-white font-semibold text-sm px-4 pt-4 pb-2">Branded content</p>
          <Link to={`${base}/partnership/add`} className="flex flex-col px-4 py-3 border-y border-[#262626]">
            <span className="text-white text-sm font-medium">Add paid partnership label</span>
            <p className="text-[#a8a8a8] text-xs mt-1">
              Adding the label helps us show your content to relevant audiences and complies with our{' '}
              <span className="text-[#0095f6]">Branded Content Policies</span>.
            </p>
            <span className="text-[#737373] mt-2 block">›</span>
          </Link>

          <p className="text-white font-semibold text-sm px-4 pt-6 pb-2">Partnership ad permissions</p>
          <div className="flex items-start gap-3 px-4 py-3 border-y border-[#262626]">
            <div className="flex-1 min-w-0">
              <span className="text-white text-sm font-medium block">Get partnership ad code</span>
              <p className="text-[#a8a8a8] text-xs mt-1">
                Sharing a code with a partner allows them to boost this content as a partnership ad.{' '}
                <span className="text-[#0095f6]">How it works</span>.
              </p>
            </div>
            <button type="button" role="switch" aria-checked={adCode} onClick={() => setAdCode(!adCode)} className={`w-11 h-6 rounded-full flex-shrink-0 ${adCode ? 'bg-[#0095f6]' : 'bg-[#363636]'}`}>
              <span className={`block w-5 h-5 rounded-full bg-white mt-0.5 transition-transform ${adCode ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </button>
          </div>
        </div>
      </MobileShell>
    </ThemedView>
  );
}
