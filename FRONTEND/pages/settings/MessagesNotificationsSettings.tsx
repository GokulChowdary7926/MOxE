import React, { useState } from 'react';
import { SettingsPageShell, SettingsRadioSection } from '../../components/layout/SettingsPageShell';

const MESSAGE_OPTIONS = [
  { label: 'Off', value: 'off' },
  { label: 'From profiles I follow', value: 'from_following' },
  { label: 'From everyone', value: 'from_everyone' },
];
const OFF_ON = [{ label: 'Off', value: 'off' }, { label: 'On', value: 'on' }];

export default function MessagesNotificationsSettings() {
  const [messageRequests, setMessageRequests] = useState('on');
  const [messages, setMessages] = useState('on');
  const [groupRequests, setGroupRequests] = useState('on');

  return (
    <SettingsPageShell title="Messages" backTo="/settings/notifications">
      <SettingsRadioSection name="message-requests" title="Message requests" value={messageRequests} onChange={setMessageRequests} options={MESSAGE_OPTIONS} exampleText="Someone sent you a message request." />
      <SettingsRadioSection name="messages" title="Messages" value={messages} onChange={setMessages} options={OFF_ON} exampleText="New messages in your conversations." />
      <SettingsRadioSection name="group-requests" title="Group requests" value={groupRequests} onChange={setGroupRequests} options={OFF_ON} exampleText="Someone added you to a group or requested to join." />
    </SettingsPageShell>
  );
}
