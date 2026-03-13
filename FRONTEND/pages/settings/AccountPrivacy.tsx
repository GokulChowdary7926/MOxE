import React, { useEffect, useState } from 'react';
import { PageLayout } from '../../components/layout/PageLayout';
import { ThemedText } from '../../components/ui/Themed';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5007/api';

/**
 * Instagram-style Account privacy screen: Private account toggle, explanatory copy, Learn more link.
 * Matches blueprint §9.2.
 */
export default function AccountPrivacy() {
  const [isPrivate, setIsPrivate] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }
    fetch(`${API_BASE}/accounts/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.account) setIsPrivate(!!data.account.isPrivate);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function togglePrivate() {
    const next = !isPrivate;
    setIsPrivate(next);
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      await fetch(`${API_BASE}/accounts/me`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPrivate: next }),
      });
    } catch {
      setIsPrivate(!next);
    }
  }

  return (
    <PageLayout title="Account privacy" backTo="/settings/privacy">
      <div className="py-4 space-y-4">
        {/* Private account row: label + toggle (Instagram pattern) */}
        <div className="flex items-center justify-between">
          <ThemedText className="text-moxe-body font-semibold text-moxe-text">Private account</ThemedText>
          <button
            type="button"
            role="switch"
            aria-checked={isPrivate}
            disabled={loading}
            onClick={togglePrivate}
            className={`relative w-11 h-6 rounded-full flex-shrink-0 transition-colors ${
              isPrivate ? 'bg-moxe-primary' : 'bg-moxe-border'
            }`}
          >
            <span
              className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                isPrivate ? 'left-5' : 'left-0.5'
              }`}
            />
          </button>
        </div>

        {/* Explanatory copy – public */}
        <ThemedText secondary className="text-moxe-body text-moxe-textSecondary block">
          When your account is public, your profile and posts can be seen by anyone, on or off MOxE, even if they
          don&apos;t have a MOxE account.
        </ThemedText>

        {/* Explanatory copy – private */}
        <ThemedText secondary className="text-moxe-body text-moxe-textSecondary block">
          When your account is private, only the followers that you approve can see what you share, including your
          photos or videos on hashtag and location pages, and your followers and following lists. Certain info on your
          profile, such as your profile picture and username, is visible to everyone on and off MOxE.
        </ThemedText>

        {/* Learn more link */}
        <a
          href="https://help.instagram.com/116064594648721"
          target="_blank"
          rel="noopener noreferrer"
          className="text-moxe-body text-moxe-primary font-medium active:opacity-80"
        >
          Learn more
        </a>
      </div>
    </PageLayout>
  );
}
