import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../../store';
import { setMessagesNotifications } from '../../store/settingsSlice';
import type { NotificationValue } from '../../store/settingsSlice';
import { PageLayout, SettingsRadioSection } from '../../components/layout/PageLayout';

const OPTIONS: { label: string; value: NotificationValue }[] = [
  { label: 'Off', value: 'off' },
  { label: 'From profiles I follow', value: 'from_following' },
  { label: 'From everyone', value: 'from_everyone' },
];

export default function MessagesNotificationsSettings() {
  const state = useSelector((s: RootState) => s.settings.notifications.messages);
  const dispatch = useDispatch();

  const update = (key: keyof typeof state, value: NotificationValue) => {
    dispatch(setMessagesNotifications({ [key]: value }));
  };

  return (
    <PageLayout title="Messages" backTo="/settings/notifications">
      <div className="py-4">
        <SettingsRadioSection
          title="Message requests"
          options={OPTIONS}
          value={state.messageRequests}
          onChange={(v) => update('messageRequests', v as NotificationValue)}
          exampleText="Someone sent you a message request."
        />
        <SettingsRadioSection
          title="Messages"
          options={[{ label: 'Off', value: 'off' }, { label: 'On', value: 'on' }]}
          value={state.messages}
          onChange={(v) => update('messages', v as NotificationValue)}
          exampleText="New messages in your conversations."
        />
        <SettingsRadioSection
          title="Group requests"
          options={[{ label: 'Off', value: 'off' }, { label: 'On', value: 'on' }]}
          value={state.groupRequests}
          onChange={(v) => update('groupRequests', v as NotificationValue)}
          exampleText="Someone added you to a group or requested to join."
        />
      </div>
    </PageLayout>
  );
}
