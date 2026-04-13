import React, { useCallback, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { SettingsPageShell } from '../../components/layout/SettingsPageShell';
import { fetchClientSettings, patchClientSettings, type ClientSettingsData } from '../../services/clientSettings';

const OPTIONS: { label: string; value: NonNullable<ClientSettingsData['comments']>['allowFrom'] }[] = [
  { label: 'Everyone', value: 'everyone' },
  { label: 'Your followers', value: 'followers' },
  { label: 'Followers you follow back', value: 'follow_back' },
  { label: 'Off', value: 'off' },
];

export default function AllowCommentsFromSettings() {
  const { pathname } = useLocation();
  const isStories = pathname.includes('allow-from-stories');
  const [value, setValue] = useState<NonNullable<ClientSettingsData['comments']>['allowFrom']>('everyone');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void fetchClientSettings()
      .then((settings) => {
        if (cancelled) return;
        const v = settings.comments?.allowFrom;
        if (v === 'followers' || v === 'follow_back' || v === 'off') setValue(v);
        else setValue('everyone');
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const persist = useCallback(async (next: NonNullable<ClientSettingsData['comments']>['allowFrom']) => {
    setSaving(true);
    try {
      const current = await fetchClientSettings();
      await patchClientSettings({
        comments: {
          ...(current.comments ?? {}),
          allowFrom: next,
        },
      });
      setValue(next);
    } finally {
      setSaving(false);
    }
  }, []);

  return (
    <SettingsPageShell
      title={isStories ? 'Allow story comments from' : 'Allow comments from'}
      backTo="/settings/comments"
    >
      <p className="text-[#a8a8a8] text-sm px-4 py-3">
        {isStories
          ? 'Story comments follow the same rules when you use close-caption comments on a story.'
          : 'Applies to new comments on your posts. You can still turn comments off on individual posts.'}
        {saving ? <span className="block mt-1 text-[#737373]">Saving…</span> : null}
      </p>
      <section className="border-b border-[#262626] py-3 px-4">
        {OPTIONS.map((opt) => (
          <label key={opt.value} className="flex items-center justify-between py-3 cursor-pointer active:opacity-80">
            <span className="text-white font-medium">{opt.label}</span>
            <input
              type="radio"
              name="allow-comments"
              checked={value === opt.value}
              onChange={() => void persist(opt.value)}
              className="sr-only"
            />
            <span
              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                value === opt.value ? 'border-white' : 'border-[#363636]'
              }`}
            >
              {value === opt.value ? <span className="w-2.5 h-2.5 rounded-full bg-white" /> : null}
            </span>
          </label>
        ))}
      </section>
    </SettingsPageShell>
  );
}
