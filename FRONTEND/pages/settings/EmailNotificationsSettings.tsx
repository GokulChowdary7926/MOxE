import React from 'react';
import {
  SettingsPageShell,
  SettingsRadioSection,
  SettingsSaveErrorBanner,
} from '../../components/layout/SettingsPageShell';
import { usePersistedNotificationGroup } from '../../hooks/usePersistedNotificationGroup';

const DEFAULTS = {
  feedback: 'on',
  reminder: 'on',
  product: 'on',
  news: 'on',
  support: 'on',
} as const;

export default function EmailNotificationsSettings() {
  const { values, setField, ready, saveError, clearSaveError } = usePersistedNotificationGroup(
    'email',
    { ...DEFAULTS } as Record<string, string>,
  );

  return (
    <SettingsPageShell title="Email notifications" backTo="/settings/notifications">
      {saveError && <SettingsSaveErrorBanner message={saveError} onDismiss={clearSaveError} />}
      <p className="text-[#a8a8a8] text-sm px-4 py-2">See notifications that you may have missed.</p>
      {!ready && <p className="text-[#737373] text-sm px-4 py-2">Loading…</p>}
      <SettingsRadioSection
        name="feedback"
        title="Feedback emails"
        value={values.feedback}
        onChange={(v) => setField('feedback', v)}
        exampleText="Give feedback on MOxE."
      />
      <SettingsRadioSection
        name="reminder"
        title="Reminder emails"
        value={values.reminder}
        onChange={(v) => setField('reminder', v)}
        exampleText="See notifications that you may have missed."
      />
      <SettingsRadioSection
        name="product"
        title="Product emails"
        value={values.product}
        onChange={(v) => setField('product', v)}
        exampleText="Get tips and resources about MOxE's tools."
      />
      <SettingsRadioSection
        name="news"
        title="News emails"
        value={values.news}
        onChange={(v) => setField('news', v)}
        exampleText="Learn about new MOxE features."
      />
      <SettingsRadioSection
        name="support"
        title="Support emails"
        value={values.support}
        onChange={(v) => setField('support', v)}
        exampleText="Get updates on reports and violations of our Community Standards."
      />
    </SettingsPageShell>
  );
}
