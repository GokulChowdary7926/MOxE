import React, { useState } from 'react';
import { SettingsPageShell, SettingsRadioSection } from '../../components/layout/SettingsPageShell';

export default function MapSettings() {
  const [locationSharingRequest, setLocationSharingRequest] = useState<'off' | 'on'>('on');
  const [locationSharingReminder, setLocationSharingReminder] = useState<'off' | 'on'>('on');
  const [locationLikes, setLocationLikes] = useState<'off' | 'on'>('on');

  return (
    <SettingsPageShell title="Map" backTo="/settings">
      <SettingsRadioSection
        name="location-request"
        title="Location sharing request"
        value={locationSharingRequest}
        onChange={(v) => setLocationSharingRequest(v as 'off' | 'on')}
        exampleText="johnappleseed requested your location."
      />
      <SettingsRadioSection
        name="location-reminder"
        title="Location sharing reminder"
        value={locationSharingReminder}
        onChange={(v) => setLocationSharingReminder(v as 'off' | 'on')}
        exampleText="You are sharing your location on the map. Make sure that your settings are up to date."
      />
      <SettingsRadioSection
        name="location-likes"
        title="Location likes"
        value={locationLikes}
        onChange={(v) => setLocationLikes(v as 'off' | 'on')}
        exampleText="janeappleseed liked your location on the map."
      />
    </SettingsPageShell>
  );
}
