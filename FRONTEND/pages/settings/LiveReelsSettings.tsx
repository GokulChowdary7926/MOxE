import React, { useState } from 'react';
import { SettingsPageShell, SettingsRadioSection } from '../../components/layout/SettingsPageShell';

export default function LiveReelsSettings() {
  const [addYours, setAddYours] = useState<'off' | 'on'>('on');
  const [promptResponses, setPromptResponses] = useState<'off' | 'on'>('on');
  const [reelsMadeForYou, setReelsMadeForYou] = useState<'off' | 'on'>('off');

  return (
    <SettingsPageShell title="Live and reels" backTo="/settings/notifications">
      <p className="text-[#a8a8a8] text-sm px-4 py-3">Take a look at the most watched reels in your location today.</p>
      <SettingsRadioSection
        name="add-yours"
        title="Add yours"
        value={addYours}
        onChange={(v) => setAddYours(v as 'off' | 'on')}
        exampleText="johnappleseed started an Add yours prompt."
      />
      <SettingsRadioSection
        name="prompt-responses"
        title="Prompt responses"
        value={promptResponses}
        onChange={(v) => setPromptResponses(v as 'off' | 'on')}
        exampleText="johnappleseed created a reel with your prompt: Most recent photo"
      />
      <SettingsRadioSection
        name="reels-made-for-you"
        title="Reels made for you"
        value={reelsMadeForYou}
        onChange={(v) => setReelsMadeForYou(v as 'off' | 'on')}
        exampleText="See new reels made for you."
      />
    </SettingsPageShell>
  );
}
