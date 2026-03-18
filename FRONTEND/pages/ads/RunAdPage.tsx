import React from 'react';
import { Link } from 'react-router-dom';
import { SettingsPageShell } from '../../components/layout/SettingsPageShell';

export default function RunAdPage() {
  return (
    <SettingsPageShell title="Run an ad" backTo="/ads/tools">
      <div className="px-4 py-4">
        <p className="text-[#a8a8a8] text-sm mb-4">Create a new ad campaign. Choose a post or reel to promote, or start from scratch.</p>
        <Link to="/boost" className="block w-full py-3 rounded-xl bg-[#0095f6] text-white font-semibold text-sm text-center mb-2">
          Promote a post
        </Link>
        <Link to="/boost" className="block w-full py-3 rounded-xl bg-[#262626] border border-[#363636] text-white font-semibold text-sm text-center">
          Create new ad
        </Link>
      </div>
    </SettingsPageShell>
  );
}
