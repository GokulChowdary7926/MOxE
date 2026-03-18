import React from 'react';
import { SettingsPageShell } from '../../components/layout/SettingsPageShell';

export default function ReviewTagsPage() {
  return (
    <SettingsPageShell title="Review tags" backTo="/settings/tags-mentions">
      <div className="px-4 py-4">
        <p className="text-[#a8a8a8] text-sm mb-4">Posts you’re tagged in appear here. Choose whether they show on your profile.</p>
        <div className="rounded-xl bg-[#262626] border border-[#363636] p-4 text-center">
          <p className="text-white text-sm font-medium">No tags to review</p>
          <p className="text-[#737373] text-xs mt-1">When someone tags you, it will show here.</p>
        </div>
      </div>
    </SettingsPageShell>
  );
}
