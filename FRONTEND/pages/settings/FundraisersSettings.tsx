import React, { useState } from 'react';
import { SettingsPageShell, SettingsRadioSection } from '../../components/layout/SettingsPageShell';

export default function FundraisersSettings() {
  const [yourFundraisers, setYourFundraisers] = useState<'off' | 'on'>('on');
  const [fundraisersByOthers, setFundraisersByOthers] = useState<'off' | 'on'>('on');

  return (
    <SettingsPageShell title="Fundraisers" backTo="/settings/notifications">
      <SettingsRadioSection
        name="your-fundraisers"
        title="Your fundraisers"
        value={yourFundraisers}
        onChange={(v) => setYourFundraisers(v as 'off' | 'on')}
        exampleText="johnappleseed donated to your fundraiser."
      />
      <SettingsRadioSection
        name="fundraisers-by-others"
        title="Fundraisers by others"
        value={fundraisersByOthers}
        onChange={(v) => setFundraisersByOthers(v as 'off' | 'on')}
        exampleText="johnappleseed started a fundraiser."
      />
    </SettingsPageShell>
  );
}
