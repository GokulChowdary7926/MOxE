import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ThemedText } from '../../components/ui/Themed';
import { PageLayout } from '../../components/layout/PageLayout';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5007/api';

type RowProps = {
  label: string;
  description?: string;
  trailing?: React.ReactNode;
};

function SettingsRow({ label, description, trailing }: RowProps) {
  return (
    <div className="flex items-start gap-3 px-3 py-3 border-b border-moxe-border last:border-0">
      <div className="flex-1">
        <ThemedText className="text-moxe-body font-medium">{label}</ThemedText>
        {description ? (
          <ThemedText secondary className="text-moxe-caption mt-0.5 block">
            {description}
          </ThemedText>
        ) : null}
      </div>
      {trailing}
    </div>
  );
}

export default function PrivacySettings() {
  const navigate = useNavigate();
  const [isPrivate, setIsPrivate] = useState(false);
  const [showActivity, setShowActivity] = useState(true);
  const [searchVisibility, setSearchVisibility] = useState<'EVERYONE' | 'FOLLOWERS_ONLY' | 'NO_ONE'>('EVERYONE');
  const [storyReplies, setStoryReplies] = useState<'EVERYONE' | 'FOLLOWERS' | 'OFF'>('EVERYONE');
  const [storyReshares, setStoryReshares] = useState<boolean>(true);
  const [storyArchiveEnabled, setStoryArchiveEnabled] = useState<boolean>(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    fetch(`${API_BASE}/accounts/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data?.account) return;
        const acc = data.account;
        setIsPrivate(!!acc.isPrivate);
        setShowActivity(acc.showActivityStatus !== false);
        if (acc.searchVisibility) {
          setSearchVisibility(acc.searchVisibility as any);
        }
        if (acc.defaultStoryAllowReplies === false) {
          setStoryReplies('OFF');
        } else if (acc.defaultStoryAllowReplies === 'FOLLOWERS' || acc.defaultStoryAllowReplies === 'FOLLOWERS_ONLY') {
          setStoryReplies('FOLLOWERS');
        } else {
          setStoryReplies('EVERYONE');
        }
        if (acc.defaultStoryAllowReshares !== undefined && acc.defaultStoryAllowReshares !== null) {
          setStoryReshares(!!acc.defaultStoryAllowReshares);
        }
        if (typeof acc.storyArchiveEnabled === 'boolean') {
          setStoryArchiveEnabled(acc.storyArchiveEnabled);
        }
      })
      .catch(() => {});
  }, []);

  async function updateAccount(patch: Record<string, unknown>) {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      await fetch(`${API_BASE}/accounts/me`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(patch),
      });
    } catch {
      // ignore UI failures; values will refetch on next open
    }
  }

  return (
    <PageLayout title="Privacy" backTo="/settings">
      <div className="py-4 space-y-6">
        <ThemedText secondary className="text-moxe-caption leading-relaxed">
          Control who can see your MOxE content, how people find you, and what activity is visible.
        </ThemedText>

        <section>
          <h2 className="text-moxe-caption font-semibold text-moxe-textSecondary uppercase tracking-wider mb-2">
            Account & content
          </h2>
          <div className="rounded-moxe-md bg-moxe-surface border border-moxe-border overflow-hidden">
            <Link
              to="/settings/account-privacy"
              className="flex items-center justify-between py-3 px-4 border-b border-moxe-border active:bg-moxe-surface/80"
            >
              <ThemedText className="text-moxe-body font-medium text-moxe-text">Account privacy</ThemedText>
              <span className="text-moxe-textSecondary text-moxe-body">›</span>
            </Link>
            <SettingsRow
              label="Private account"
              description="Only approved followers can see your posts, stories, and highlights."
              trailing={
                <button
                  type="button"
                  onClick={() => {
                    setIsPrivate((v) => {
                      const next = !v;
                      updateAccount({ isPrivate: next });
                      return next;
                    });
                  }}
                  className={`w-10 h-6 rounded-full flex items-center ${
                    isPrivate ? 'bg-moxe-primary' : 'bg-moxe-border'
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded-full bg-moxe-background transform transition-transform ${
                      isPrivate ? 'translate-x-4' : 'translate-x-1'
                    }`}
                  />
                </button>
              }
            />
            <SettingsRow
              label="Follow requests"
              description="Review pending requests, see mutual followers, approve, decline, or block."
            />
            <SettingsRow
              label="Remove followers"
              description="Quietly remove followers without blocking or notifying them."
            />
          </div>
        </section>

        <section>
          <h2 className="text-moxe-caption font-semibold text-moxe-textSecondary uppercase tracking-wider mb-2">
            Story privacy
          </h2>
          <div className="rounded-moxe-md bg-moxe-surface border border-moxe-border overflow-hidden">
            <SettingsRow
              label="Hide story from"
              description="Select people who should never see your stories."
            />
            <SettingsRow
              label="Story replies"
              description="Everyone, Followers, or Off. Override per story when posting."
              trailing={
                <select
                  value={storyReplies}
                  onChange={(e) => {
                    const value = e.target.value as 'EVERYONE' | 'FOLLOWERS' | 'OFF';
                    setStoryReplies(value);
                    let allow: boolean | string;
                    if (value === 'OFF') {
                      allow = false;
                    } else if (value === 'FOLLOWERS') {
                      allow = 'FOLLOWERS';
                    } else {
                      allow = true;
                    }
                    updateAccount({ defaultStoryAllowReplies: allow });
                  }}
                  className="px-2 py-1 rounded-moxe-md bg-moxe-surface border border-moxe-border text-moxe-caption text-moxe-text"
                >
                  <option value="EVERYONE">Everyone</option>
                  <option value="FOLLOWERS">Followers</option>
                  <option value="OFF">Off</option>
                </select>
              }
            />
            <SettingsRow
              label="Story resharing"
              description="Allow or prevent others from sharing your stories."
              trailing={
                <button
                  type="button"
                  onClick={() =>
                    setStoryReshares((v) => {
                      const next = !v;
                      updateAccount({ defaultStoryAllowReshares: next });
                      return next;
                    })
                  }
                  className={`w-10 h-6 rounded-full flex items-center ${
                    storyReshares ? 'bg-moxe-primary' : 'bg-moxe-border'
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded-full bg-moxe-background transform transition-transform ${
                      storyReshares ? 'translate-x-4' : 'translate-x-1'
                    }`}
                  />
                </button>
              }
            />
            <SettingsRow
              label="Story archive & highlights"
              description="Auto‑save stories and build Highlights from your archive."
              trailing={
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setStoryArchiveEnabled((v) => {
                        const next = !v;
                        updateAccount({ storyArchiveEnabled: next });
                        return next;
                      })
                    }
                    className={`w-10 h-6 rounded-full flex items-center ${
                      storyArchiveEnabled ? 'bg-moxe-primary' : 'bg-moxe-border'
                    }`}
                  >
                    <span
                      className={`w-4 h-4 rounded-full bg-moxe-background transform transition-transform ${
                        storyArchiveEnabled ? 'translate-x-4' : 'translate-x-1'
                      }`}
                    />
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/stories/archive')}
                    className="px-2 py-1 rounded-moxe-md border border-moxe-border text-moxe-caption text-moxe-text hover:bg-moxe-surfaceHover"
                  >
                    View archive
                  </button>
                </div>
              }
            />
            <SettingsRow
              label="Close Friends"
              description="Maintain a Close Friends list for more private stories."
            />
          </div>
        </section>

        <section>
          <h2 className="text-moxe-caption font-semibold text-moxe-textSecondary uppercase tracking-wider mb-2">
            Discovery & activity
          </h2>
          <div className="rounded-moxe-md bg-moxe-surface border border-moxe-border overflow-hidden">
            <SettingsRow
              label="Profile in search"
              description="Control whether your profile appears in search results."
              trailing={
                <select
                  value={searchVisibility}
                  onChange={(e) => {
                    const next = e.target.value as 'EVERYONE' | 'FOLLOWERS_ONLY' | 'NO_ONE';
                    setSearchVisibility(next);
                    updateAccount({ searchVisibility: next });
                  }}
                  className="px-2 py-1 rounded-moxe-md bg-moxe-surface border border-moxe-border text-moxe-caption text-moxe-text"
                >
                  <option value="EVERYONE">Everyone</option>
                  <option value="FOLLOWERS_ONLY">Followers only</option>
                  <option value="NO_ONE">No one</option>
                </select>
              }
            />
            <SettingsRow
              label="Show activity status"
              description="Let people you follow and message see when you were last active. Turning this off also hides others’ status from you."
              trailing={
                <button
                  type="button"
                  onClick={() =>
                    setShowActivity((v) => {
                      const next = !v;
                      updateAccount({ showActivityStatus: next });
                      return next;
                    })
                  }
                  className={`w-10 h-6 rounded-full flex items-center ${
                    showActivity ? 'bg-moxe-primary' : 'bg-moxe-border'
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded-full bg-moxe-background transform transition-transform ${
                      showActivity ? 'translate-x-4' : 'translate-x-1'
                    }`}
                  />
                </button>
              }
            />
            <SettingsRow
              label="Favorites"
              description="Mark accounts as Favorites to prioritize them in your feed."
            />
            <SettingsRow
              label="Saved & collections"
              description="Review posts you’ve saved into private collections."
            />
            <SettingsRow
              label="Archive"
              description="See posts you’ve archived instead of deleted from your profile."
            />
          </div>
        </section>
      </div>
    </PageLayout>
  );
}

