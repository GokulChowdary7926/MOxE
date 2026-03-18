import React, { useState } from 'react';
import { SettingsPageShell, SettingsRadioSection } from '../../components/layout/SettingsPageShell';

export default function PoliticalContentSettings() {
  const [level, setLevel] = useState('standard');

  return (
    <SettingsPageShell title="Political content" backTo="/settings/content-preferences">
      <div className="border-t border-[#262626]">
        <SettingsRadioSection
          title="Political content in Explore and Reels"
          name="political"
          value={level}
          onChange={setLevel}
          options={[
            { label: 'Don’t limit', value: 'none' },
            { label: 'Standard', value: 'standard' },
            { label: 'Limit', value: 'limit' },
          ]}
          exampleText="Choose how much political content you see from accounts you don’t follow. This doesn’t affect posts from accounts you follow."
        />
      </div>
    </SettingsPageShell>
  );
}
