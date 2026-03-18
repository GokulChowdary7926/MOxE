import React from 'react';
import { Link } from 'react-router-dom';
import { SettingsPageShell } from '../../components/layout/SettingsPageShell';

export default function BoostPreviewPage() {
  return (
    <SettingsPageShell title="Preview ad" backTo="/boost/review">
      <div className="px-4 py-4">
        <p className="text-[#a8a8a8] text-sm mb-4">See how your ad will look to your audience.</p>
        <div className="rounded-xl bg-[#262626] border border-[#363636] aspect-[9/16] max-h-[400px] flex items-center justify-center text-[#737373] text-sm">
          Ad preview
        </div>
        <Link to="/boost/review" className="block w-full py-3 rounded-xl bg-[#0095f6] text-white font-semibold text-sm text-center mt-4">
          Back to review
        </Link>
      </div>
    </SettingsPageShell>
  );
}
