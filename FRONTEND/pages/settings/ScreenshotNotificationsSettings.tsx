import React, { useEffect, useState } from 'react';
import { PageLayout } from '../../components/layout/PageLayout';
import { ThemedView, ThemedText } from '../../components/ui/Themed';
import { getApiBase, getToken } from '../../services/api';

/**
 * Screenshot Notifications – choose whether to be notified when someone attempts
 * a screenshot of your protected content (Personal/Star tier).
 */
export default function ScreenshotNotificationsSettings() {
  const [screenshotAlerts, setScreenshotAlerts] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    fetch(`${getApiBase()}/accounts/me/notification-preferences`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : Promise.resolve({})))
      .then((prefs: unknown) =>
        setScreenshotAlerts((prefs as { screenshotAlerts?: boolean }).screenshotAlerts !== false),
      )
      .finally(() => setLoading(false));
  }, []);

  function handleToggle() {
    const token = getToken();
    if (!token) return;
    const next = !screenshotAlerts;
    setSaving(true);
    fetch(`${getApiBase()}/accounts/me/notification-preferences`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ screenshotAlerts: next }),
    })
      .then((r) => (r.ok ? r.json() : {}))
      .then((prefs: unknown) =>
        setScreenshotAlerts((prefs as { screenshotAlerts?: boolean }).screenshotAlerts !== false),
      )
      .finally(() => setSaving(false));
  }

  return (
    <PageLayout title="Screenshot notifications" backTo="/settings/advanced">
      <ThemedView className="p-4">
        <p className="text-moxe-body text-moxe-textSecondary mb-4">
          When you enable screenshot protection on posts or stories, we attempt to detect when someone tries to capture your content.
          If a screenshot is detected, we can notify you (Star tier).
        </p>
        {loading ? (
          <p className="text-moxe-textSecondary">Loading…</p>
        ) : (
          <div className="flex items-center justify-between py-3 border-b border-moxe-border">
            <div>
              <ThemedText className="font-medium text-moxe-text">Notify me when a screenshot is detected</ThemedText>
              <p className="text-sm text-moxe-textSecondary mt-0.5">Get a notification when someone attempts to screenshot your protected content.</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={screenshotAlerts}
              disabled={saving}
              onClick={handleToggle}
              className={`w-11 h-6 rounded-full transition-colors flex-shrink-0 ${screenshotAlerts ? 'bg-moxe-primary' : 'bg-moxe-border'}`}
            >
              <span className={`block w-5 h-5 rounded-full bg-white mt-0.5 transition-transform ${screenshotAlerts ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
          </div>
        )}
      </ThemedView>
    </PageLayout>
  );
}
