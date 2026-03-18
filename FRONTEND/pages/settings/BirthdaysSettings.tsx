import React, { useState } from 'react';
import { SettingsPageShell, SettingsRadioSection } from '../../components/layout/SettingsPageShell';

export default function BirthdaysSettings() {
  const [birthdays, setBirthdays] = useState<'off' | 'on'>('on');

  return (
    <SettingsPageShell title="Birthdays" backTo="/settings/notifications">
      <SettingsRadioSection
        name="birthdays"
        title="Birthdays"
        value={birthdays}
        onChange={(v) => setBirthdays(v as 'off' | 'on')}
        exampleText="johnappleseed has a birthday today!"
      />
      <p className="text-[#a8a8a8] text-sm px-4 py-4">
        We&apos;ll only notify you for people who choose to tell others about their birthdays on MOxE. You can change who to tell about your birthday at any time in your profile personal information settings.
      </p>
    </SettingsPageShell>
  );
}
