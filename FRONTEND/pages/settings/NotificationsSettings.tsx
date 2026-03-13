import React from 'react';
import { PageLayout, SettingsSection, SettingsRow } from '../../components/layout/PageLayout';

/**
 * Notifications settings hub – six rows to sub-screens (§9.3).
 * Instagram-style: Posts, stories and comments; Following and followers; Messages;
 * Email notifications; From Instagram; Live and reels.
 */
export default function NotificationsSettings() {
  return (
    <PageLayout title="Notifications" backTo="/settings">
      <div className="py-4">
        <SettingsSection title="Notification preferences">
          <SettingsRow to="/settings/notifications/posts-stories-comments" label="Posts, stories and comments" />
          <SettingsRow to="/settings/notifications/following-followers" label="Following and followers" />
          <SettingsRow to="/settings/notifications/messages" label="Messages" />
          <SettingsRow to="/settings/notifications/email" label="Email notifications" />
          <SettingsRow to="/settings/notifications/from-instagram" label="From MOxE" />
          <SettingsRow to="/settings/notifications/live-reels" label="Live and reels" />
        </SettingsSection>
      </div>
    </PageLayout>
  );
}
