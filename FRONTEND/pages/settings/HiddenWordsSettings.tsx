import React, { useState } from 'react';
import { SettingsPageShell } from '../../components/layout/SettingsPageShell';

export default function HiddenWordsSettings() {
  const [words, setWords] = useState('');

  return (
    <SettingsPageShell title="Hidden words" backTo="/settings">
      <div className="px-4 py-4">
        <p className="text-[#a8a8a8] text-sm mb-2">
          Comments with these words, including similar misspellings, will be filtered out so that they&apos;re only visible to the authors. Message requests will be moved to the hidden requests folder.
        </p>
        <a href="#" className="text-[#0095f6] text-sm font-medium">Learn more</a>
        <input
          type="text"
          placeholder="Add words separated by commas..."
          value={words}
          onChange={(e) => setWords(e.target.value)}
          className="w-full mt-4 px-4 py-3 rounded-lg bg-[#262626] border border-[#363636] text-white placeholder:text-[#737373] text-sm"
        />
        <button type="button" className="w-full py-3 rounded-lg bg-[#0095f6] text-white font-semibold mt-4">Add</button>
      </div>
    </SettingsPageShell>
  );
}
