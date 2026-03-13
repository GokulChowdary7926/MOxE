import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../../store';
import { setFromInstagram } from '../../store/settingsSlice';
import { PageLayout, SettingsSection, SettingsToggleRow } from '../../components/layout/PageLayout';

export default function FromInstagramSettings() {
  const state = useSelector((s: RootState) => s.settings.notifications.fromInstagram);
  const dispatch = useDispatch();

  const update = (key: keyof typeof state, value: boolean) => {
    dispatch(setFromInstagram({ [key]: value }));
  };

  return (
    <PageLayout title="From MOxE" backTo="/settings/notifications">
      <div className="py-4">
        <SettingsSection title="In-app notifications">
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
            label="Tips"
            checked={state.tips}
            onChange={(v) => update('tips', v)}
          />
        </SettingsSection>
      </div>
    </PageLayout>
  );
}
