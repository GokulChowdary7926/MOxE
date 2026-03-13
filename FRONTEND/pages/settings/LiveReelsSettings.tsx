import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../../store';
import { setLiveReels } from '../../store/settingsSlice';
import { PageLayout, SettingsSection, SettingsToggleRow } from '../../components/layout/PageLayout';

export default function LiveReelsSettings() {
  const state = useSelector((s: RootState) => s.settings.notifications.liveReels);
  const dispatch = useDispatch();

  const update = (key: keyof typeof state, value: boolean) => {
    dispatch(setLiveReels({ [key]: value }));
  };

  return (
    <PageLayout title="Live and reels" backTo="/settings/notifications">
      <div className="py-4">
        <SettingsSection title="Live and reels">
          <SettingsToggleRow
            label="Live videos"
            checked={state.liveVideos}
            onChange={(v) => update('liveVideos', v)}
          />
          <SettingsToggleRow
            label="Reel recommendations"
            checked={state.reelRecommendations}
            onChange={(v) => update('reelRecommendations', v)}
          />
          <SettingsToggleRow
            label="Reminders"
            checked={state.reminders}
            onChange={(v) => update('reminders', v)}
          />
        </SettingsSection>
      </div>
    </PageLayout>
  );
}
