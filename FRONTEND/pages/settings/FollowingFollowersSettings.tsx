import React, { useState } from 'react';
import { SettingsPageShell, SettingsRadioSection } from '../../components/layout/SettingsPageShell';

export default function FollowingFollowersSettings() {
  const [followRequests, setFollowRequests] = useState<'off' | 'on'>('on');
  const [acceptedFollowRequests, setAcceptedFollowRequests] = useState<'off' | 'on'>('on');
  const [newFollowers, setNewFollowers] = useState<'off' | 'on'>('on');

  return (
    <SettingsPageShell title="Following and followers" backTo="/settings/notifications">
      <SettingsRadioSection name="follow-requests" title="Follow requests" value={followRequests} onChange={(v) => setFollowRequests(v as 'off' | 'on')} exampleText="Someone requested to follow you." />
      <SettingsRadioSection name="accepted" title="Accepted follow requests" value={acceptedFollowRequests} onChange={(v) => setAcceptedFollowRequests(v as 'off' | 'on')} exampleText="Your follow request was accepted." />
      <SettingsRadioSection name="new-followers" title="New followers" value={newFollowers} onChange={(v) => setNewFollowers(v as 'off' | 'on')} exampleText="Someone started following you." />
    </SettingsPageShell>
  );
}
