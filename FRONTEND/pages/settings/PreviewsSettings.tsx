import React, { useState } from 'react';
import { SettingsPageShell, SettingsToggleRow } from '../../components/layout/SettingsPageShell';

export default function PreviewsSettings() {
  const [on, setOn] = useState(false);

  return (
    <SettingsPageShell title="Previews" backTo="/settings/messages">
      <div className="px-4 py-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-white font-semibold">Show previews</h2>
          <button
            type="button"
            role="switch"
            aria-checked={on}
            onClick={() => setOn((v) => !v)}
            className={`relative w-11 h-6 rounded-full flex-shrink-0 transition-colors ${on ? 'bg-[#0095f6]' : 'bg-[#363636]'}`}
          >
            <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${on ? 'left-5' : 'left-0.5'}`} />
          </button>
        </div>
        <p className="text-[#a8a8a8] text-sm">
          See previews of MOxE content such as posts, stories and reels in your end-to-end encrypted chats.{' '}
          <span className="text-[#0095f6]">Learn more about previews</span>
        </p>
      </div>
    </SettingsPageShell>
  );
}
