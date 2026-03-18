import React from 'react';
import { SettingsPageShell, SettingsRadioSection } from '../../components/layout/SettingsPageShell';

const OPTIONS = [
  { label: 'Followers', value: 'followers' },
  { label: 'Close friends', value: 'close_friends' },
];

export default function NoteShareWithPage() {
  return (
    <SettingsPageShell title="Share with" backTo="/notes/new">
      <div className="px-4 py-4">
        <p className="text-[#a8a8a8] text-sm mb-4">Choose who can see this note.</p>
        <SettingsRadioSection title="Audience" options={OPTIONS} value="followers" onChange={() => {}} name="share" />
      </div>
    </SettingsPageShell>
  );
}
