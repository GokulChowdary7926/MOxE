import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../../store';
import { setEmailNotifications } from '../../store/settingsSlice';
import { PageLayout, SettingsSection, SettingsToggleRow } from '../../components/layout/PageLayout';

export default function EmailNotificationsSettings() {
  const state = useSelector((s: RootState) => s.settings.notifications.email);
  const dispatch = useDispatch();

  const update = (key: keyof typeof state, value: boolean) => {
    dispatch(setEmailNotifications({ [key]: value }));
  };

  return (
    <PageLayout title="Email notifications" backTo="/settings/notifications">
      <div className="py-4">
        <SettingsSection title="Email">
          <SettingsToggleRow
            label="Product announcements"
            checked={state.productAnnouncements}
            onChange={(v) => update('productAnnouncements', v)}
          />
          <SettingsToggleRow
            label="Support emails"
            checked={state.supportEmails}
            onChange={(v) => update('supportEmails', v)}
          />
          <SettingsToggleRow
            label="Tips and tricks"
            checked={state.tipsAndTricks}
            onChange={(v) => update('tipsAndTricks', v)}
          />
        </SettingsSection>
      </div>
    </PageLayout>
  );
}
