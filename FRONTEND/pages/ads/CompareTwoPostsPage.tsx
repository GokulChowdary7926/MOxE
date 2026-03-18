import React from 'react';
import { SettingsPageShell } from '../../components/layout/SettingsPageShell';

export default function CompareTwoPostsPage() {
  return (
    <SettingsPageShell title="Compare two posts" backTo="/ads/tools">
      <div className="px-4 py-4">
        <p className="text-[#a8a8a8] text-sm mb-4">Select two posts or reels to compare their performance side by side.</p>
        <div className="rounded-xl bg-[#262626] border border-[#363636] p-4 text-center">
          <p className="text-white text-sm font-medium">Select first post</p>
          <p className="text-[#737373] text-xs mt-1">Tap to choose a post, then select a second to compare.</p>
        </div>
      </div>
    </SettingsPageShell>
  );
}
