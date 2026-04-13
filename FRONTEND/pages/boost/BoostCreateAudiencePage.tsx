import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { SettingsPageShell } from '../../components/layout/SettingsPageShell';
import { writeBoostDraft } from '../../utils/boostDraft';

export default function BoostCreateAudiencePage() {
  const navigate = useNavigate();
  const [advantagePlus, setAdvantagePlus] = useState(false);
  const [audienceName, setAudienceName] = useState('');

  const finishAudience = () => {
    const name = audienceName.trim();
    writeBoostDraft({ audienceName: name || undefined });
    navigate('/boost/budget');
  };

  return (
    <SettingsPageShell
      title="Create audience"
      backTo="/boost/audience"
      right={
        <button type="button" onClick={finishAudience} className="text-[#0095f6] font-medium text-sm">
          Done
        </button>
      }
    >
      <div className="px-4 py-4">
        <div className="text-center mb-6">
          <p className="text-2xl font-bold text-white">—</p>
          <p className="text-[#a8a8a8] text-sm flex items-center justify-center gap-1">Estimated audience size <span className="text-[#737373]">ⓘ</span></p>
          <p className="text-[#737373] text-xs mt-2">Sizing appears when forecasting is available for your account.</p>
        </div>

        <div className="mb-4">
          <span className="px-2 py-0.5 rounded bg-[#363636] text-[#a8a8a8] text-xs font-medium">Recommended</span>
          <div className="flex items-center justify-between mt-2 py-3 border-b border-[#262626]">
            <div>
              <p className="text-white font-medium">Use Advantage+ audience</p>
              <p className="text-[#a8a8a8] text-sm">Automatically finds and updates audiences whenever it&apos;s likely to improve performance.</p>
            </div>
            <button type="button" onClick={() => setAdvantagePlus(!advantagePlus)} className={`w-11 h-6 rounded-full flex-shrink-0 ${advantagePlus ? 'bg-[#0095f6]' : 'bg-[#363636]'}`}>
              <span className={`block w-5 h-5 rounded-full bg-white mt-0.5 transition-transform ${advantagePlus ? 'ml-5' : 'ml-0.5'}`} />
            </button>
          </div>
        </div>

        <input type="text" value={audienceName} onChange={(e) => setAudienceName(e.target.value)} placeholder="Audience name" className="w-full px-3 py-2.5 rounded-lg bg-[#262626] border border-[#363636] text-white placeholder:text-[#737373] text-sm mb-6" />

        <p className="text-white font-semibold mb-2">Audience details</p>
        <Link to="/boost/location" className="flex items-center justify-between py-3 border-b border-[#262626] text-white">
          <span>Locations</span>
          <span className="text-[#737373]">›</span>
        </Link>
        <Link to="/boost/age-gender" className="flex items-center justify-between py-3 border-b border-[#262626] text-white">
          <span>Minimum age</span>
          <span className="text-[#a8a8a8]">18</span>
          <span className="text-[#737373]">›</span>
        </Link>

        <p className="text-[#737373] text-xs font-semibold mt-6 mb-2">OPTIONAL</p>
        <div className="py-2 border-b border-[#262626]">
          <p className="text-white font-medium">Audience suggestions</p>
          <p className="text-[#a8a8a8] text-sm">When your suggestions are accurate, they can help find your audience faster.</p>
        </div>

        <button
          type="button"
          onClick={finishAudience}
          className="w-full py-3 rounded-lg bg-[#0095f6] text-white font-semibold text-center mt-8"
        >
          Continue to budget
        </button>
      </div>
    </SettingsPageShell>
  );
}
