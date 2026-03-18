import React, { useState } from 'react';
import { SettingsPageShell } from '../../components/layout/SettingsPageShell';

export default function NoteLocationPage() {
  const [location, setLocation] = useState('');

  return (
    <SettingsPageShell title="Location" backTo="/notes/new">
      <div className="px-4 py-4">
        <p className="text-[#a8a8a8] text-sm mb-4">Add a location to your note so followers can see where you are.</p>
        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Search for a location"
          className="w-full px-3 py-2.5 rounded-lg bg-[#262626] border border-[#363636] text-white placeholder:text-[#737373] text-sm"
        />
      </div>
    </SettingsPageShell>
  );
}
