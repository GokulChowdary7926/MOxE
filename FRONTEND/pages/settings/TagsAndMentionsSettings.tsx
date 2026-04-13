import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { SettingsPageShell, SettingsRadioSection, SettingsToggleRow } from '../../components/layout/SettingsPageShell';
import { fetchClientSettings, patchClientSettings, type ClientSettingsData } from '../../services/clientSettings';

const TAG_OPTIONS = [
  { label: 'Allow tags from everyone', value: 'everyone' },
  { label: 'Allow tags from people that you follow', value: 'following' },
  { label: "Don't allow tags", value: 'off' },
];
const MENTION_OPTIONS = [
  { label: 'Allow mentions from everyone', value: 'everyone' },
  { label: 'Allow mentions from people you follow', value: 'following' },
  { label: "Don't allow mentions", value: 'off' },
];

export default function TagsAndMentionsSettings() {
  const [whoTag, setWhoTag] = useState('everyone');
  const [manuallyApprove, setManuallyApprove] = useState(false);
  const [whoMention, setWhoMention] = useState('everyone');
  const [boostStories, setBoostStories] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void fetchClientSettings()
      .then((settings) => {
        if (cancelled) return;
        const t = settings.tagsAndMentions;
        if (t?.tagsFrom === 'following' || t?.tagsFrom === 'off') setWhoTag(t.tagsFrom);
        else setWhoTag('everyone');
        if (t?.mentionsFrom === 'following' || t?.mentionsFrom === 'off') setWhoMention(t.mentionsFrom);
        else setWhoMention('everyone');
        setManuallyApprove(!!t?.manualTagApproval);
        setBoostStories(!!t?.allowBoostStoriesFromMentions);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const persist = useCallback(async (next: NonNullable<ClientSettingsData['tagsAndMentions']>) => {
    setSaving(true);
    try {
      await patchClientSettings({ tagsAndMentions: next });
    } finally {
      setSaving(false);
    }
  }, []);

  return (
    <SettingsPageShell title="Tags and mentions" backTo="/settings">
      <SettingsRadioSection
        name="who-can-tag"
        title="Who can tag you"
        value={whoTag}
        onChange={(v) => {
          setWhoTag(v);
          void persist({
            tagsFrom: v as 'everyone' | 'following' | 'off',
            mentionsFrom: whoMention as 'everyone' | 'following' | 'off',
            manualTagApproval: manuallyApprove,
            allowBoostStoriesFromMentions: boostStories,
          });
        }}
        options={TAG_OPTIONS}
        exampleText="MOxE enforces these rules when others publish posts. Tags on your profile grid may require your approval if enabled below."
      />
      <p className="text-[#a8a8a8] text-xs px-4 py-2">
        If you use Limit interactions, some accounts may still be blocked from tagging or mentioning you elsewhere in the app.
        {saving ? <span className="block mt-1 text-[#737373]">Saving…</span> : null}
      </p>

      <section className="border-b border-[#262626] py-3 px-4">
        <h2 className="text-white font-semibold mb-2">How you manage tags</h2>
        <SettingsToggleRow
          label="Manually approve tags"
          checked={manuallyApprove}
          onChange={(next) => {
            setManuallyApprove(next);
            void persist({
              tagsFrom: whoTag as 'everyone' | 'following' | 'off',
              mentionsFrom: whoMention as 'everyone' | 'following' | 'off',
              manualTagApproval: next,
              allowBoostStoriesFromMentions: boostStories,
            });
          }}
        />
        <Link
          to="/settings/tags/review"
          className="flex items-center justify-between py-3 border-b border-[#262626] text-white active:bg-white/5"
        >
          <span className="font-medium">Review tags</span>
          <ChevronRight className="w-5 h-5 text-[#737373]" />
        </Link>
      </section>

      <SettingsRadioSection
        name="who-can-mention"
        title="Who can @mention you"
        value={whoMention}
        onChange={(v) => {
          setWhoMention(v);
          void persist({
            tagsFrom: whoTag as 'everyone' | 'following' | 'off',
            mentionsFrom: v as 'everyone' | 'following' | 'off',
            manualTagApproval: manuallyApprove,
            allowBoostStoriesFromMentions: boostStories,
          });
        }}
        options={MENTION_OPTIONS}
        exampleText="Caption and composer @mentions are blocked when someone is not allowed to mention you."
      />

      <SettingsToggleRow
        label="Allow people to boost stories that they mention you in"
        checked={boostStories}
        onChange={(next) => {
          setBoostStories(next);
          void persist({
            tagsFrom: whoTag as 'everyone' | 'following' | 'off',
            mentionsFrom: whoMention as 'everyone' | 'following' | 'off',
            manualTagApproval: manuallyApprove,
            allowBoostStoriesFromMentions: next,
          });
        }}
      />
    </SettingsPageShell>
  );
}
