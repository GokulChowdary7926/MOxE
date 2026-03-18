import React from 'react';
import { useParams } from 'react-router-dom';
import { SettingsPageShell } from '../../components/layout/SettingsPageShell';

export default function LiveMessagePage() {
  const { liveId } = useParams();
  const backTo = liveId ? `/live/${liveId}` : '/live';

  return (
    <SettingsPageShell title="Live messages" backTo={backTo}>
      <div className="px-4 py-6">
        <p className="text-[#a8a8a8] text-sm">Messages and comments from viewers during this live.</p>
        <div className="mt-6 flex flex-col items-center justify-center py-12">
          <p className="text-[#737373] text-sm text-center">No messages yet.</p>
        </div>
      </div>
    </SettingsPageShell>
  );
}
