import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../../store';
import { setFollowingFollowers } from '../../store/settingsSlice';
import type { NotificationValue } from '../../store/settingsSlice';
import { PageLayout, SettingsRadioSection } from '../../components/layout/PageLayout';

const OPTIONS: { label: string; value: NotificationValue }[] = [
  { label: 'Off', value: 'off' },
  { label: 'On', value: 'on' },
];

export default function FollowingFollowersSettings() {
  const state = useSelector((s: RootState) => s.settings.notifications.followingFollowers);
  const dispatch = useDispatch();

  const update = (key: keyof typeof state, value: NotificationValue) => {
    dispatch(setFollowingFollowers({ [key]: value }));
  };

  return (
    <PageLayout title="Following and followers" backTo="/settings/notifications">
      <div className="py-4">
        <SettingsRadioSection
          title="Follow requests"
          options={OPTIONS}
          value={state.followRequests}
          onChange={(v) => update('followRequests', v as NotificationValue)}
          exampleText="Someone requested to follow you."
        />
        <SettingsRadioSection
          title="Accepted follow requests"
          options={OPTIONS}
          value={state.acceptedFollowRequests}
          onChange={(v) => update('acceptedFollowRequests', v as NotificationValue)}
          exampleText="Your follow request was accepted."
        />
        <SettingsRadioSection
          title="New followers"
          options={OPTIONS}
          value={state.newFollowers}
          onChange={(v) => update('newFollowers', v as NotificationValue)}
          exampleText="Someone started following you."
        />
      </div>
    </PageLayout>
  );
}
