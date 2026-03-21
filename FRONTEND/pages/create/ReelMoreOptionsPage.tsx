import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Heart, Users } from 'lucide-react';
import { ThemedView, ThemedText } from '../../components/ui/Themed';
import { MobileShell } from '../../components/layout/MobileShell';

/** Base path for links (reel or post) so same page works for both. */
function useCreateBasePath() {
  const { pathname } = useLocation();
  return pathname.startsWith('/create/post') ? '/create/post' : '/create/reel';
}

/**
 * More options page for reels/posts – same for all accounts.
 * Add Fundraiser, Partnership label and ads, Upload at highest quality,
 * Don't let others use as template, Enable/Translate closed captions,
 * Hide like count, Hide share count, Turn off commenting.
 */
export default function ReelMoreOptionsPage() {
  const navigate = useNavigate();
  const base = useCreateBasePath();
  const [uploadHighest, setUploadHighest] = useState(false);
  const [noTemplate, setNoTemplate] = useState(false);
  const [closedCaptions, setClosedCaptions] = useState(false);
  const [translateCaptions, setTranslateCaptions] = useState(false);
  const [hideLikes, setHideLikes] = useState(false);
  const [hideShares, setHideShares] = useState(false);
  const [turnOffComments, setTurnOffComments] = useState(false);

  const Toggle = ({ checked, onChange, label, description, learnMore }: { checked: boolean; onChange: (v: boolean) => void; label: string; description?: string; learnMore?: boolean }) => (
    <div className="flex items-start gap-3 px-4 py-3 border-b border-[#262626]">
      <div className="flex-1 min-w-0">
        <span className="text-white text-sm font-medium block">{label}</span>
        {description && <p className="text-[#a8a8a8] text-xs mt-1">{description}{learnMore && <span className="text-[#0095f6]"> Learn more</span>}</p>}
      </div>
      <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)} className={`w-11 h-6 rounded-full flex-shrink-0 ${checked ? 'bg-[#0095f6]' : 'bg-[#363636]'}`}>
        <span className={`block w-5 h-5 rounded-full bg-white mt-0.5 transition-transform ${checked ? 'translate-x-6' : 'translate-x-0.5'}`} />
      </button>
    </div>
  );

  return (
    <ThemedView className="min-h-screen flex flex-col bg-black">
      <MobileShell>
        <header className="flex items-center h-12 px-3 border-b border-[#262626] bg-black safe-area-pt">
          <button type="button" onClick={() => navigate(-1)} className="p-2 -m-2 text-white">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="flex-1 text-white font-semibold text-base text-center">More options</span>
          <div className="w-10" />
        </header>

        <div className="flex-1 overflow-auto pb-20">
          <Link to={`${base}/fundraiser`} className="flex items-center gap-3 px-4 py-3 border-b border-[#262626] text-white">
            <Heart className="w-5 h-5 text-[#a8a8a8]" />
            <span className="flex-1 text-left">Add Fundraiser</span>
            <span className="text-[#737373]">›</span>
          </Link>

          <p className="text-[#737373] text-xs font-semibold px-4 pt-4 pb-1">Ads and monetisation</p>
          <Link to={`${base}/partnership`} className="flex items-center gap-3 px-4 py-3 border-b border-[#262626] text-white">
            <Users className="w-5 h-5 text-[#a8a8a8]" />
            <span className="flex-1 text-left">Partnership label and ads</span>
            <span className="text-[#737373]">›</span>
          </Link>

          <p className="text-[#737373] text-xs font-semibold px-4 pt-4 pb-1">Sharing preferences</p>
          <Toggle checked={uploadHighest} onChange={setUploadHighest} label="Upload at highest quality" description="Always upload the highest-quality photos and videos, even if uploading takes longer. When this is off, we'll automatically adjust upload quality to fit network conditions." learnMore />

          <p className="text-[#737373] text-xs font-semibold px-4 pt-4 pb-1">What others can remix and reuse</p>
          <Toggle checked={noTemplate} onChange={setNoTemplate} label="Don't let others use this reel as a template" description="Templates allow anyone on MOxE to use the same audio and timing as your reel, and replace the photos and videos with their own." learnMore />

          <p className="text-[#737373] text-xs font-semibold px-4 pt-4 pb-1">Accessibility and translation</p>
          <Toggle checked={closedCaptions} onChange={setClosedCaptions} label="Enable closed captions" description="Your videos will show auto-generated captions. You can change this on individual posts by tapping on the ••• menu and going to Edit > Advanced settings > Show captions." learnMore />
          <Toggle checked={translateCaptions} onChange={setTranslateCaptions} label="Translate closed captions" description="Closed captions will be automatically translated to the viewer's selected language." />

          <p className="text-[#737373] text-xs font-semibold px-4 pt-4 pb-1">How others can interact with your reel</p>
          <Toggle checked={hideLikes} onChange={setHideLikes} label="Hide like count on this reel" />
          <Toggle checked={hideShares} onChange={setHideShares} label="Hide share count on this reel" description="Only you will see the number of likes and shares on this reel. You can change this later by going to the ••• menu at the top of the reel." learnMore />
          <Toggle checked={turnOffComments} onChange={setTurnOffComments} label="Turn off commenting" />
        </div>
      </MobileShell>
    </ThemedView>
  );
}
