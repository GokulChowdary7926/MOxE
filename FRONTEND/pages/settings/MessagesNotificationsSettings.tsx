import React from 'react';
import {
  SettingsPageShell,
  SettingsRadioSection,
  SettingsSaveErrorBanner,
} from '../../components/layout/SettingsPageShell';
import { usePersistedNotificationGroup } from '../../hooks/usePersistedNotificationGroup';

const MESSAGE_OPTIONS = [
  { label: 'Off', value: 'off' },
  { label: 'From profiles I follow', value: 'from_following' },
  { label: 'From everyone', value: 'from_everyone' },
];
const OFF_ON = [{ label: 'Off', value: 'off' }, { label: 'On', value: 'on' }];

const DEFAULTS = {
  messageRequests: 'on',
  messages: 'on',
  groupRequests: 'on',
} as const;

export default function MessagesNotificationsSettings() {
  const { values, setField, ready, saveError, clearSaveError } = usePersistedNotificationGroup(
    'messages',
    { ...DEFAULTS } as Record<string, string>,
  );

  return (
    <SettingsPageShell title="Messages" backTo="/settings/notifications">
      {saveError && <SettingsSaveErrorBanner message={saveError} onDismiss={clearSaveError} />}
      {!ready && <p className="text-[#737373] text-sm px-4 py-3">Loading…</p>}
      <SettingsRadioSection
        name="message-requests"
        title="Message requests"
        value={values.messageRequests}
        onChange={(v) => setField('messageRequests', v)}
        options={MESSAGE_OPTIONS}
        exampleText="Someone sent you a message request."
      />
      <SettingsRadioSection
        name="messages"
        title="Messages"
        value={values.messages}
        onChange={(v) => setField('messages', v)}
        options={OFF_ON}
        exampleText="New messages in your conversations."
      />
      <SettingsRadioSection
        name="group-requests"
        title="Group requests"
        value={values.groupRequests}
        onChange={(v) => setField('groupRequests', v)}
        options={OFF_ON}
        exampleText="Someone added you to a group or requested to join."
      />
    </SettingsPageShell>
  );
}
