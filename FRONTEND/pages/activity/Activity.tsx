import React, { useEffect, useState } from 'react';
import { PageLayout, SettingsSection, SettingsRow } from '../../components/layout/PageLayout';
import { ThemedText } from '../../components/ui/Themed';
import { ErrorState } from '../../components/ui/ErrorState';
import { EmptyState } from '../../components/ui/EmptyState';
import { getApiBase, getToken } from '../../services/api';

type ActivityItem = {
  id: string;
  type: string;
  createdAt: string;
  description?: string | null;
};

export default function Activity() {
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setError('You must be logged in to view your activity.');
      setLoading(false);
      return;
    }
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`${getApiBase()}/accounts/me/activity`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data.error || 'Failed to load account activity.');
        }
        setItems(data.items ?? data.activities ?? []);
      } catch (e: any) {
        setError(e.message || 'Failed to load account activity.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  function formatLabel(item: ActivityItem) {
    switch (item.type) {
      case 'EMAIL_CHANGED':
        return 'Email changed';
      case 'USERNAME_CHANGED':
        return 'Username changed';
      default:
        return item.description || item.type;
    }
  }

  return (
    <PageLayout title="Your activity" backTo="/settings">
      <div className="py-4 space-y-4">
        <SettingsSection title="Activity">
          <SettingsRow to="/settings/your-activity/time-spent" label="Time spent" />
          <SettingsRow to="/settings/your-activity/watch-history" label="Watch history" />
          <SettingsRow to="/settings/your-activity/account-history" label="Account history" />
          <SettingsRow to="/settings/your-activity/recent-searches" label="Recent searches" />
          <SettingsRow to="/settings/your-activity/link-history" label="Link history" />
        </SettingsSection>
        <SettingsSection title="Account activity">
          {loading && (
          <ThemedText secondary className="text-moxe-caption">
            Loading account activity…
          </ThemedText>
        )}
        {error && !loading && (
          <ErrorState
            message={error}
            onRetry={() => {
              const token = localStorage.getItem('token');
              if (!token) return;
              setError(null);
              setLoading(true);
              fetch(`${getApiBase()}/accounts/me/activity`, { headers: { Authorization: `Bearer ${token}` } })
                .then((res) =>
                  res.json().then((data: any) => {
                    if (!res.ok) throw new Error(data?.error || 'Failed to load account activity.');
                    return data;
                  }),
                )
                .then((data) => setItems(data?.items ?? data?.activities ?? []))
                .catch((e: any) => setError(e?.message || 'Failed to load account activity.'))
                .finally(() => setLoading(false));
            }}
          />
        )}
        {!loading && !error && items.length === 0 && (
          <EmptyState
            title="No activity yet"
            message="Changes to your account, username, and contact info will appear here."
          />
        )}
          {!loading &&
          !error &&
          items.map((a) => (
            <div
              key={a.id}
              className="rounded-xl bg-moxe-surface border border-moxe-border px-4 py-3 flex items-center justify-between"
            >
              <div>
                <ThemedText className="text-moxe-body font-semibold">
                  {formatLabel(a)}
                </ThemedText>
                {a.description && (
                  <ThemedText secondary className="text-moxe-caption">
                    {a.description}
                  </ThemedText>
                )}
              </div>
              <ThemedText secondary className="text-moxe-caption">
                {new Date(a.createdAt).toLocaleString()}
              </ThemedText>
            </div>
          ))}
        </SettingsSection>
      </div>
    </PageLayout>
  );
}

