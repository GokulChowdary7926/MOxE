import React, { useEffect, useState } from 'react';
import { SettingsPageShell, SettingsToggleRow } from '../../components/layout/SettingsPageShell';
import { fetchClientSettings, patchClientSettings } from '../../services/clientSettings';

export default function LikeShareCountsSettings() {
  const [hideLikes, setHideLikes] = useState(false);
  const [hideCounts, setHideCounts] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void fetchClientSettings()
      .then((settings) => {
        if (cancelled) return;
        const social = settings.socialCounts;
        setHideCounts(!!social?.hideLikeAndShareCounts);
        setHideLikes(!!social?.hideLikeCountOnOwnPosts);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  async function save(next: { hideCounts?: boolean; hideLikes?: boolean }) {
    const resolvedHideCounts = next.hideCounts ?? hideCounts;
    const resolvedHideLikes = next.hideLikes ?? hideLikes;
    setSaving(true);
    try {
      await patchClientSettings({
        socialCounts: {
          hideLikeAndShareCounts: resolvedHideCounts,
          hideLikeCountOnOwnPosts: resolvedHideLikes,
        },
      });
    } catch {
      // Keep UI optimistic; settings page should stay responsive even on transient failures.
    } finally {
      setSaving(false);
    }
  }

  return (
    <SettingsPageShell title="Like and share counts" backTo="/settings">
      <SettingsToggleRow
        label="Hide like and share counts"
        checked={hideCounts}
        onChange={(next) => {
          setHideCounts(next);
          void save({ hideCounts: next });
        }}
        description="You won't see like and share counts on posts. Your posts won't show like or share counts to others."
      />
      <SettingsToggleRow
        label="Hide like count on your posts"
        checked={hideLikes}
        onChange={(next) => {
          setHideLikes(next);
          void save({ hideLikes: next });
        }}
        description="Only you will see the like count on your posts."
      />
      {saving && <p className="px-4 py-2 text-xs text-moxe-textSecondary">Saving…</p>}
    </SettingsPageShell>
  );
}
