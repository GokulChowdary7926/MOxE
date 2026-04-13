import React from 'react';
import {
  SettingsPageShell,
  SettingsRadioSection,
  SettingsSaveErrorBanner,
} from '../../components/layout/SettingsPageShell';
import { usePersistedNotificationGroup } from '../../hooks/usePersistedNotificationGroup';

const DEFAULTS = {
  reminders: 'on',
  productAnnouncements: 'on',
  uploadsAndSharing: 'on',
  contentIntegrity: 'on',
  supportRequests: 'on',
  trendingPlaces: 'on',
} as const;

export default function FromMoxeNotificationsSettings() {
  const { values, setField, ready, saveError, clearSaveError } = usePersistedNotificationGroup(
    'fromMoxe',
    { ...DEFAULTS } as Record<string, string>,
  );

  return (
    <SettingsPageShell title="From MOxE" backTo="/settings/notifications">
      <div data-testid="from-moxe-settings">
        {saveError && <SettingsSaveErrorBanner message={saveError} onDismiss={clearSaveError} />}
        {!ready && <p className="text-[#737373] text-sm px-4 py-2">Loading…</p>}
        <SettingsRadioSection
          name="reminders"
          title="Reminders"
          value={values.reminders}
          onChange={(v) => setField('reminders', v)}
          exampleText="You have unseen notifications and other similar notifications"
        />
        <SettingsRadioSection
          name="product"
          title="Product announcements and feedback"
          value={values.productAnnouncements}
          onChange={(v) => setField('productAnnouncements', v)}
          exampleText="Download the latest MOxE update."
        />
        <SettingsRadioSection
          name="uploads"
          title="Uploads and sharing"
          value={values.uploadsAndSharing}
          onChange={(v) => setField('uploadsAndSharing', v)}
          exampleText="Your post shared to MOxE, but cross-post to another app didn’t complete."
        />
        <SettingsRadioSection
          name="content-integrity"
          title="Content integrity"
          value={values.contentIntegrity}
          onChange={(v) => setField('contentIntegrity', v)}
          exampleText="We're recommending your reel instead of others that feature your original content."
        />
        <SettingsRadioSection
          name="support"
          title="Support requests"
          value={values.supportRequests}
          onChange={(v) => setField('supportRequests', v)}
          exampleText="Your support request from July 10 has just been updated."
        />
        <SettingsRadioSection
          name="trending"
          title="Trending places"
          value={values.trendingPlaces}
          onChange={(v) => setField('trendingPlaces', v)}
          exampleText="John Appleseed Park is a trending place near you. See what's being shared."
        />
      </div>
    </SettingsPageShell>
  );
}
