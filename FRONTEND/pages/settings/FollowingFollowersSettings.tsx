import React from 'react';
import {
  SettingsPageShell,
  SettingsRadioSection,
  SettingsSaveErrorBanner,
} from '../../components/layout/SettingsPageShell';
import { usePersistedNotificationGroup } from '../../hooks/usePersistedNotificationGroup';

const DEFAULTS = {
  followRequests: 'on',
  acceptedFollowRequests: 'on',
  newFollowers: 'on',
} as const;

export default function FollowingFollowersSettings() {
  const { values, setField, ready, saveError, clearSaveError } = usePersistedNotificationGroup(
    'followingFollowers',
    { ...DEFAULTS } as Record<string, string>,
  );

  return (
    <SettingsPageShell title="Following and followers" backTo="/settings/notifications">
      {saveError && <SettingsSaveErrorBanner message={saveError} onDismiss={clearSaveError} />}
      {!ready && <p className="text-[#737373] text-sm px-4 py-3">Loading…</p>}
      <SettingsRadioSection
        name="follow-requests"
        title="Follow requests"
        value={values.followRequests}
        onChange={(v) => setField('followRequests', v)}
        exampleText="Someone requested to follow you."
      />
      <SettingsRadioSection
        name="accepted"
        title="Accepted follow requests"
        value={values.acceptedFollowRequests}
        onChange={(v) => setField('acceptedFollowRequests', v)}
        exampleText="Your follow request was accepted."
      />
      <SettingsRadioSection
        name="new-followers"
        title="New followers"
        value={values.newFollowers}
        onChange={(v) => setField('newFollowers', v)}
        exampleText="Someone started following you."
      />
    </SettingsPageShell>
  );
}
