import React, { useState } from 'react';
import { SettingsPageShell, SettingsRadioSection } from '../../components/layout/SettingsPageShell';

export default function SensitiveContentSettings() {
  const [level, setLevel] = useState('standard');

  return (
    <SettingsPageShell title="Sensitive content control" backTo="/settings/content-preferences">
      <div className="border-t border-[#262626]">
        <SettingsRadioSection
          title="Sensitive content"
          name="sensitive"
          value={level}
          onChange={setLevel}
          options={[
            { label: 'More', value: 'more' },
            { label: 'Standard', value: 'standard' },
            { label: 'Less', value: 'less' },
          ]}
          exampleText="Control how much sensitive or potentially upsetting content you see in Explore and Reels. This doesn’t affect content from accounts you follow."
        />
      </div>
    </SettingsPageShell>
  );
}
