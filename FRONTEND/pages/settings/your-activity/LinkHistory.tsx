import React, { useState } from 'react';
import { SettingsPageShell } from '../../../components/layout/SettingsPageShell';

type LinkEntry = { id: string; title?: string; url: string; clickedAt: string };

export default function LinkHistory() {
  const [items, setItems] = useState<LinkEntry[]>([]);

  return (
    <SettingsPageShell title="Link history" backTo="/activity">
      <div className="px-4 py-4">
        <p className="text-[#a8a8a8] text-sm mb-4">Links you&apos;ve opened from MOxE.</p>
        {items.length === 0 ? (
          <p className="text-[#a8a8a8] text-sm">No link history.</p>
        ) : (
          <div className="divide-y divide-[#262626] border border-[#262626] rounded-xl overflow-hidden">
            {items.map((entry) => (
              <div key={entry.id} className="py-3 px-4">
                <p className="text-white font-medium truncate">{entry.title ?? entry.url}</p>
                <p className="text-[#a8a8a8] text-xs truncate mt-0.5">{entry.url}</p>
                <p className="text-[#737373] text-[11px] mt-1">
                  {new Date(entry.clickedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </SettingsPageShell>
  );
}
