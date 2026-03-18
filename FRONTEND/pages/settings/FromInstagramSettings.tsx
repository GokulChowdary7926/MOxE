import React, { useState } from 'react';
import { SettingsPageShell, SettingsRadioSection } from '../../components/layout/SettingsPageShell';

export default function FromInstagramSettings() {
  const [reminders, setReminders] = useState<'off' | 'on'>('on');
  const [productAnnouncements, setProductAnnouncements] = useState<'off' | 'on'>('on');
  const [uploadsAndSharing, setUploadsAndSharing] = useState<'off' | 'on'>('on');
  const [contentIntegrity, setContentIntegrity] = useState<'off' | 'on'>('on');
  const [supportRequests, setSupportRequests] = useState<'off' | 'on'>('on');
  const [trendingPlaces, setTrendingPlaces] = useState<'off' | 'on'>('on');

  return (
    <SettingsPageShell title="From MOxE" backTo="/settings/notifications">
      <SettingsRadioSection
        name="reminders"
        title="Reminders"
        value={reminders}
        onChange={(v) => setReminders(v as 'off' | 'on')}
        exampleText="You have unseen notifications and other similar notifications"
      />
      <SettingsRadioSection
        name="product"
        title="Product announcements and feedback"
        value={productAnnouncements}
        onChange={(v) => setProductAnnouncements(v as 'off' | 'on')}
        exampleText="Download Boomerang, MOxE's latest app."
      />
      <SettingsRadioSection
        name="uploads"
        title="Uploads and sharing"
        value={uploadsAndSharing}
        onChange={(v) => setUploadsAndSharing(v as 'off' | 'on')}
        exampleText="Your post shared to MOxE, but was unable to share to Facebook."
      />
      <SettingsRadioSection
        name="content-integrity"
        title="Content integrity"
        value={contentIntegrity}
        onChange={(v) => setContentIntegrity(v as 'off' | 'on')}
        exampleText="We're recommending your reel instead of others that feature your original content."
      />
      <SettingsRadioSection
        name="support"
        title="Support requests"
        value={supportRequests}
        onChange={(v) => setSupportRequests(v as 'off' | 'on')}
        exampleText="Your support request from July 10 has just been updated."
      />
      <SettingsRadioSection
        name="trending"
        title="Trending places"
        value={trendingPlaces}
        onChange={(v) => setTrendingPlaces(v as 'off' | 'on')}
        exampleText="John Appleseed Park is a trending place near you. See what's being shared."
      />
    </SettingsPageShell>
  );
}
